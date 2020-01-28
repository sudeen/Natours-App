const fs = require('fs');
const express = require('express');

const app = express();

app.use(express.json()); // middleware

// app.get('/', (req, res) => {
//   res.status(200).json({ message: 'Hello from the server side' });
// });

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`)
);

const getAllTours = (req, res) => {
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours
    }
  });
};

// app.get('/api/v1/tours', getAllTours);

app.route('/api/v1/tours').get(getAllTours);

const port = 3000;
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
