'use strict';

// const logger = require('./../config/logger_config');
const dbConnect = require('../utils/db_connect');
const dbSelect = require('../utils/db_select');

function apiGetEmployee(reqBody, res) {
  const postReq = {
    empId: JSON.parse(reqBody).empId,
  };


  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Access-Control-Allow-Origin, Access-Control-Allow-Headers, Authorization, X-Requested-With',
    'Access-Control-Allow-Methods': 'OPTIONS, POST, GET',
  };

  dbConnect.query(dbSelect.apiGetEmployeeByID(postReq.empId), (err, rows) => {
    if (err) {
      // res.statusCode = 401;
      res.writeHead(400, headers);
      res.end(JSON.stringify({ Error: true, Message: 'Error executing MySQL query' }));
    } else if (rows.length === 1) {
      res.writeHead(200, headers);
      res.end(JSON.stringify({
        id: rows[0].id,
        lastName: rows[0].lname,
        firstName: rows[0].fname,
        middleName: rows[0].mname,
        photo: rows[0].photo,
        apointName: rows[0].apoint,
        timeStamp: rows[0].tstamp,
      }));
    } else {
      res.writeHead(400, headers);
      res.end(JSON.stringify({ Error: true, Message: 'wrong search' }));
    }
  });
}

function apiGetAllEmployee(reqBody, res) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Access-Control-Allow-Origin, Access-Control-Allow-Headers, Authorization, X-Requested-With',
    'Access-Control-Allow-Methods': 'OPTIONS, POST, GET',
  };

  const users = [];

  dbConnect.query(dbSelect.apiGetAllEmployee, (err, rows) => {
    if (err) {
      // res.statusCode = 401;
      res.writeHead(400, headers);
      res.end(JSON.stringify({ Error: true, Message: 'Error executing MySQL query' }));
    } else if (rows.length !== 0) {
      rows.forEach((row, i) => {
        users[i] = row;
      });
      res.writeHead(200, headers);
      res.end(JSON.stringify({
        total: users.length,
        results: users,
      }));
    } else {
      res.writeHead(400, headers);
      res.end(JSON.stringify({ Error: true, Message: 'wrong search' }));
    }
  });
}

exports.apiGetEmployee = apiGetEmployee;
exports.apiGetAllEmployee = apiGetAllEmployee;
