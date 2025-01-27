const logger = require('../utils/logging/winston')

const sendErrorDev = (err, res) => {
  return res.status(err.statusCode).json({
    status: err.status,
    error: err,
    stack: err.stack
  })
}

const sendErrorProduction = (err, res) => {
  // Operational Error, trusted send error response to client
  if (err.isOperationError) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    })
  } else {
    // Bug or unknown error: dont leak error response to client
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong!'
    })
  }
}

const ErrorController = (err, req, res, next) => {
  const errors = { ...err }
  errors.status = err.status || 'error'
  errors.statusCode = err.statusCode || 500

  if (err.name === 'Validation Error') {
    errors.message = err.message
  }

  logger.error(JSON.stringify(errors))

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(errors, res)
  } else if (process.env.NODE_ENV === 'production') {
    sendErrorProduction(errors, res)
  }
}

module.exports = ErrorController
