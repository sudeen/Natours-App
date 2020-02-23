const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const cors = require('cors');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const bookingController = require('./controllers/bookingController');
const viewRouter = require('./routes/viewRoutes');

const app = express();

app.enable('trust proxy');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

/* GLOBAL MIDDLEWARES */

/* Implement CORS */
// use cors before all route definitions
app.use(cors());
// app.use(cors({ origin: 'http://127.0.0.1:3000', credentials: 'true' }));

// To allow complex requests like PUT, PATCH, DELETE
app.options('*', cors());

/* Serving static files */
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));

/* Set Security HTTP headers */
app.use(helmet());
// console.log(process.env.NODE_ENV);

/* Development logging */
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); // To get log in the console
}

/* This rate limiter creates two new headers in the headers section which can be seen from postman.
This might help prevent Brute-force attack and Denial-of-Service attack */
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000, // Allow 100 request from one IP in one HOUR
  message: 'Too many requests from this IP, please try again in an hour!'
});

// Applies the rate limit to the APIs starting from '/api
app.use('/api', limiter);

/* This route is placed here because Stripe wants data in raw format not in JSON
That is the reason it is placed before the body parser */
app.post(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  bookingController.webhookCheckout
);

/* Body parser, reading data from the body into req.body */
app.use(express.json({ limit: '10kb' })); // If body is larger than 10kb it will not accept it
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

/* Data Sanitization against NoSQL query injection.
If we use {"$gt": """} we will be able to login as admin */
app.use(mongoSanitize());

/* Data sanitization against XSS (Cross-site-scripting) */
app.use(xss());

/* Prevent parameter pollution */
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);

/* Compresses all the text that are sent to clients. Not works for images.
Use this link https://www.giftofspeed.com/gzip-test/ to check  */
app.use(compression());

/* Test middlewares */
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);
  next();
});

/* ROUTES */
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

/* Handling 404 errors */
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

/* Global Error Handling middleware */
app.use(globalErrorHandler);

module.exports = app;
