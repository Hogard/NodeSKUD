/**
* Конфигурационный файл
*/

'use strict';

const config = {
  server: {
    host: '172.20.4.195',
    // host: 'localhost',
    port: 3000,
  },
  revers: {
    host: '172.21.110.139',
    port: 24532,
  },
  database: {
    host: 'localhost',
    // host: '172.20.4.195',
    user: 'ngdash',
    password: 'S9oE43h5OMaw',
    dbname: 'ngdashboard',
  },
  jwt: {
    secret: 'HxQiRJ1LkSga',
  },
};

module.exports = config;
