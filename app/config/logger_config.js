/**
 * Модуль настройки логирования
 */

'use strict';

const { createLogger, format, transports } = require('winston');

const { combine, timestamp, printf } = format;


const options = {
  file_info: {
    level: 'info',
    filename: '/var/log/nodeskud.log',
    handleExceptions: true,
    json: false,
    // maxsize: 5242880, // 5MB
    // maxFiles: 5,
    // colorize: false,
  },
  /*
  file_error: {
    level: 'error',
    filename: '/var/log/nodeskud-error.log',
    handleExceptions: true,
    json: false,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    // colorize: false,
  },
  */
  console: {
    level: 'debug',
    handleExceptions: true,
    json: false,
    colorize: true,
  },
};

const myFormat = printf(info => `${info.timestamp} ${info.level}: ${JSON.stringify(info.message)}`);

const logger = createLogger({
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    myFormat,
  ),
  transports: [
    // new transports.File(options.file_error),
    new transports.File(options.file_info),
    // new winston.transports.Console(options.console),
  ],
  exitOnError: false,
});

logger.on('error', (err) => {
  console.log('Error in logger occured:', err.stack);
});

module.exports = logger;
