const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');
const multer = require('multer'); // For handling User images
const sharp = require('sharp'); // For resizing images

// This way images will be stored as buffer which will be available in req.file.buffer
const multerStorage = multer.memoryStorage();

/* Filter to check if the file is an image or not */
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

// upload.array('images', 3) is used if no mixup image upload
exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 }
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();

  // 1) Cover Image

  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333) // common ratio 3:2
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 2) Images
  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
      await sharp(file.buffer)
        .resize(2000, 1333) // common ratio 3:2
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);
      req.body.images.push(filename);
    })
  );
  next();
});

exports.ailasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

/* GET ALL TOURS */
exports.getAllTours = factory.getAll(Tour);

/* GET SINGLE TOUR */
exports.getTour = factory.getOne(Tour, { path: 'reviews' }); // path options is the one we want to populate.

/* CREATE TOUR */
exports.createTour = factory.createOne(Tour);

/* UPDATE TOUR */
exports.updateTour = factory.updateOne(Tour);

/* DELETE TOUR */
exports.deleteTour = factory.deleteOne(Tour);

/* Previously Used code when handlerFactory.js was not created */
// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id);
//   if (!tour) {
//     return next(new AppError('No Tour found with that ID', 404));
//   }
//   res.status(204).json({
//     status: 'success',
//     data: null
//   });
// });

/* Aggergation Pipeline is used here. Matching and Grouping */
exports.getTourStats = catchAsync(async (req, res, next) => {
  /* Go to mongodb documentation to look for further details */
  const stats = await Tour.aggregate([
    {
      $match: {
        ratingsAverage: {
          $gte: 4.5
        }
      }
    },
    {
      $group: {
        _id: {
          $toUpper: '$difficulty'
        },
        numTours: {
          $sum: 1
        },
        numRatings: {
          $sum: '$ratingsQuantity'
        },
        avgRating: {
          $avg: '$ratingsAverage'
        },
        avgPrice: {
          $avg: '$price'
        },
        minPrice: {
          $min: '$price'
        },
        maxPrice: {
          $max: '$price'
        }
      }
    },
    {
      $sort: {
        avgPrice: 1
      }
    }
    /* Can be matched twice but not useful in most of the cases
     {
     $match: { _id: { $ne: 'EASY' } }
    } */
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats
    }
  });
});

/* Aggergration pipeline used here. Unwinding */
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; // 2021
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates'
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' }
      }
    },
    {
      $addFields: { month: '$_id' }
    },
    {
      $project: {
        _id: 0
      }
    },
    {
      $sort: { numTourStarts: -1 }
    },
    {
      $limit: 12
    }
  ]);
  res.status(200).json({
    status: 'success',
    results: plan.length,
    data: {
      plan
    }
  });
});

/* Get tours within */
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  /* Converting to radians using the radius of the earth */
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng.',
        400
      )
    );
  }

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours
    }
  });
});

/* Geospatial aggregration: Caculating distances */
exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng.',
        400
      )
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1]
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier
      }
    },
    {
      $project: {
        distance: 1,
        name: 1
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances
    }
  });
});
