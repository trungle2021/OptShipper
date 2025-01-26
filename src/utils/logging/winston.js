const winston = require('winston');
const path = require('path');
const fs = require('fs');
const LOG_ERROR_FILE_NAME = process.env.LOG_ERROR_FILE_NAME || 'error.log';
const LOG_FOLDER_NAME = process.env.LOG_FOLDER_NAME || 'logs';

const logDir = path.join(__dirname, './../../', LOG_FOLDER_NAME);
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

module.exports = winston.createLogger({
  // format của log được kết hợp thông qua format.combine
  format: winston.format.combine(
    winston.format.splat(),
    // Định dạng time cho log
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    // thêm màu sắc
    winston.format.colorize(),
    // thiết lập định dạng của log
    winston.format.printf((log) => {
      // nếu log là error hiển thị stack trace còn không hiển thị message của log
      if (log.stack) return `[${log.timestamp}] [${log.level}] ${log.stack}`;
      return `[${log.timestamp}] [${log.level}] ${log.message}`;
    })
  ),
  transports: [
    // hiển thị log thông qua console
    new winston.transports.Console(),
    // Thiết lập ghi các errors vào file
    new winston.transports.File({
      level: 'error',
      filename: path.join(__dirname, './../../', LOG_FOLDER_NAME, LOG_ERROR_FILE_NAME),
    }),
  ],
});
