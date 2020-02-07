/* Using catchAsync we basically remove the overhead of adding try catch in every section.
Makes code short and more readable */
module.exports = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
