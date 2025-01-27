class AppError extends Error {
  constructor (name, message, statusCode) {
    super(name)
    this.name = name
    this.message = message
    this.statusCode = statusCode
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'
    this.isOperationError = true
    Error.captureStackTrace(this, this.constructor)
  }
}

module.exports = AppError
