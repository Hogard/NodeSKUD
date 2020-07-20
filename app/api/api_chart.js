'use strict';

// const logger = require('./../config/logger_config');
const apiGetEmpAndGuestChart = require('./charts/chart_empandguest');

let resChartData = {};

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Access-Control-Allow-Origin, Access-Control-Allow-Headers, Authorization, X-Requested-With',
  'Access-Control-Allow-Methods': 'OPTIONS, POST, GET',
};

async function apiGetChartData(reqBody, res) {
  const postReq = {
    chartId: JSON.parse(reqBody).chartId,
  };

  switch (postReq.chartId) {
    case 'empAndGuest':
      resChartData = await apiGetEmpAndGuestChart(res);
      // logger.error(resChartData);
      break;
    default:
      res.writeHead(400, headers);
      res.end(JSON.stringify({ Error: true, Message: 'wrong search' }));
      break;
  }

  if (resChartData.length !== 0) {
    res.writeHead(200, headers);
    res.end(JSON.stringify(resChartData));
  } else {
    res.writeHead(400, headers);
    res.end(JSON.stringify({ Error: true, Message: 'wrong search' }));
  }


  /*
  dbConnect.query(dbSelect.apiGetGuestCount, (err, rows) => {
    if (err) {
      // res.statusCode = 401;
      res.writeHead(400, headers);
      res.end(JSON.stringify({ Error: true, Message: 'Error executing MySQL query' }));
    } else if (rows.length !== 0) {
      rows.forEach((row, i) => {
        chartData[i] = row;
      });
      res.writeHead(200, headers);
      res.end(JSON.stringify(chartData));
    } else {
      res.writeHead(400, headers);
      res.end(JSON.stringify({ Error: true, Message: 'wrong search' }));
    }
  });
  */
}

module.exports = apiGetChartData;
