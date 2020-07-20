'use strict';

const mysql = require('mysql');
const md5 = require('md5');
const jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
const config = require('./../config/system_config');
const dbConnection = require('./../utils/db_connect');


function userLoginCheck(reqBody, res) {
  const postReq = {
    email: JSON.parse(reqBody).email,
    password: JSON.parse(reqBody).password,
  };

  let dbQuery = 'SELECT * FROM ?? WHERE ??=? AND ??=?';

  const userTable = ['access_user', 'email', postReq.email, 'password', md5(postReq.password)];

  dbQuery = mysql.format(dbQuery, userTable);

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'OPTIONS, POST, GET',
    'Access-Control-Max-Age': 2592000, // 30 days
    /** add other headers as per requirement */
  };

  dbConnection.query(dbQuery, (err, rows) => {
    if (err) {
      // res.statusCode = 401;
      // res.writeHead(200, headers);
      res.end(JSON.stringify({ Error: true, Message: 'Error executing MySQL query' }));
    } else if (rows.length === 1) {
      const userId = rows[0].user_id;
      const userToken = jwt.sign(postReq, config.jwt.secret, {
        expiresIn: 3600,
        subject: 'NodeSKUD',
      });

      res.writeHead(200, headers);
      res.end(JSON.stringify({
        id: userId,
        email: rows[0].email,
        firstName: rows[0].first_name,
        lastName: rows[0].last_name,
        accessRole: rows[0].access_role,
        token: userToken,
      }));
    } else {
      res.writeHead(400, headers);
      res.end(JSON.stringify({ Error: true, Message: 'wrong email/password combination' }));
    }
  });
}

module.exports = userLoginCheck;
