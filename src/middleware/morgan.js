const rfs = require('rotating-file-stream');
const path = require('path');
const morgan = require('morgan');

// const isProduction = process.env.NODE_ENV === 'production'
const LOG_SIZE = process.env.LOG_SIZE;
const LOG_INTERVAL = process.env.LOG_INTERVAL;
const LOG_FOLDER_NAME = process.env.LOG_FOLDER_NAME;
// const LOG_FORMAT_COMPRESS = process.env.LOG_FORMAT_COMPRESS;
const LOG_ACCESS_FILE_NAME = process.env.LOG_ACCESS_FILE_NAME;

const accessLog = rfs.createStream(LOG_ACCESS_FILE_NAME, {
  size: LOG_SIZE,
  interval: LOG_INTERVAL,
  path: path.join(__dirname, './../', LOG_FOLDER_NAME),
  // compress: LOG_FORMAT_COMPRESS,
});

// const morganMiddleware = isProduction
//   ? morgan("dev", { stream: accessLog })
//   : morgan("dev");

morgan.format(
  'myFormat',
  '[:date[iso]] :method :url :status :response-time ms - :res[content-length]'
);
const morganMiddleware = morgan('myFormat', { stream: accessLog });

module.exports = morganMiddleware;
