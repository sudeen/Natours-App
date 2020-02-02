const express = require('express');
const morgan = require('morgan');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// MIDDLEWARES
app.use(morgan('dev')); // To get log in the console
app.use(express.json());
app.use(express.static(`${__dirname}/public`));

// app.get('/', (req, res) => {
//   res.status(200).json({ message: 'Hello from the server side' });
// });

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

module.exports = app;
