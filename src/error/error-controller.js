const logger = require('../utils/logging/winston');

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    name: err.name,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProduction = (err, res) => {
  console.log('Log error production: ' + err);
  console.log('isOperationError: ' + err.isOperationError);
  console.log('Error Code: ' + err.statusCode.toString());
  console.log(typeof err.statusCode.toString());
  // Operational Error, trusted send error response to client
  if (err.isOperationError || err.statusCode.toString().startsWith('4')) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // Bug or unknown error: dont leak error response to client
    logger.error(new Error('ERROR 🎆' + err.message));
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!',
    });
  }
};

const ErrorController = (err, req, res, next) => {
  err.status = err.status || 'error';
  console.log('Error Name: ' + err.name);
  console.log('Log Error: ' + err);
  console.log('Log Stack: ' + err.stack);
  switch (err.name) {
    case 'ValidationError':
      err.statusCode = 400;
      err.message = 'Validation Error';
      break;
    case 'CastError':
      err.statusCode = 400;
      err.message = 'Bad Request';
      break;
    case 'MongoNetworkError':
      err.statusCode = 503;
      err.message = 'Error connecting to the database';
      break;
    default:
      if (err.code === 11000) {
        err.statusCode = 409;
        err.message = 'Duplicate Key Error';
      } else {
        err.statusCode = err.statusCode || 500;
      }
      break;
  }

  if (process.env.NODE_ENV.trim() === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV.trim() === 'production') {
    sendErrorProduction(err, res);
  }
};

module.exports = ErrorController;
