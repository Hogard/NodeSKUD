'use strict';

const mysql = require('mysql');
const util = require('util');
const config = require('./../config/system_config');
const logger = require('./../config/logger_config');

const dbConnection = mysql.createPool({
  connectionLimit: 10,
  host: config.database.host,
  user: config.database.user,
  password: config.database.password,
  database: config.database.dbname,
  timezone: 'Europe/Moscow',
});

dbConnection.getConnection((err, connection) => {
  if (err) {
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      logger.error('Database connection was closed.');
    }
    if (err.code === 'ER_CON_COUNT_ERROR') {
      logger.error('Database has too many connections.');
    }
    if (err.code === 'ECONNREFUSED') {
      logger.error('Database connection was refused.');
    }
  }

  if (connection) connection.release();
});

dbConnection.query = util.promisify(dbConnection.query);

module.exports = dbConnection;
