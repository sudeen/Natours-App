const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

/* GLOBAL MIDDLEWARES */

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
  max: 3,
  windowMs: 60 * 60 * 1000, // Allow 100 request from one IP in one HOUR
  message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter); // Applies the rate limit to the APIs starting from '/api

/* Body parser, reading data from the body into req.body */
app.use(express.json({ limit: '10kb' })); // If body is larger than 10kb it will not accept it

/* Serving static files */
app.use(express.static(`${__dirname}/public`));

/* Test middlewares */
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);
  next();
});

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

/* Handling 404 errors */
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

/* Global Error Handling middleware */
app.use(globalErrorHandler);

module.exports = app;
