const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel');
// const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have less or equals 40 characters'],
      minlength: [10, 'A tour name must have more or equals 10 characters']
      // validate: [validator.isAlpha, 'Tour name must only contain characters']
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either easy, medium or difficult'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'A rating must be above 1.0'],
      max: [5, 'A rating must be below 5.0']
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    // priceDiscount must always be lower that the actual price
    priceDiscount: {
      type: Number,
      validate: {
        validator: function(val) {
          // this works only on NEW document creation and will not work for update
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be less than the actual price'
      }
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image']
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    },
    startLocation: {
      // GeoJSON in order to specify Geospatial data
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }]
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

/* Virtual data cannot be used for query as this property is not part of database */
tourSchema.virtual('durationWeeks').get(function() {
  // similar to getter
  return this.duration / 7;
});

/* DOCUMENT MIDDLEWARE: runs before .save() and .create() and not for update */
tourSchema.pre('save', function(next) {
  // console.log(this); // this refers to current documents being processed
  this.slug = slugify(this.name, { lower: true });
  next();
});

/* Used to embed documents in the model.
Responsible for embedding documents */
// tourSchema.pre('save', async function(next) {
//   const guidesPromises = this.guides.map(async id => await User.findById(id));
//   // The result gonna have array full of promises in each async id element so we need to use async
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

// tourSchema.post('save', function(doc, next) {
//   console.log(doc);
//   next();
// });

/* QUERY MIDDLEWARE */
tourSchema.pre(/^find/, function(next) {
  // Regular expression where it find all the methods that starts with find
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt'
  });
  next();
});

tourSchema.post(/^find/, function(docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds`);
  // console.log(docs);
  next();
});

/* AGGREGRATION MIDDLWARE */
tourSchema.pre('aggregate', function(next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } }); // unshift to add value to the beginning of the array
  // console.log(this.pipeline());
  next();
});

// MODEL MIDDLWARE
// Its not that important here

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
