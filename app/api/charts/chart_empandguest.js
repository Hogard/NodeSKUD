'use strict';

const datetime = require('node-datetime');

// const logger = require('./../../config/logger_config');
const dbConnect = require('../../utils/db_connect');
const dbSelect = require('../../utils/db_select');

// const allChartData = [];
let empChartData = [];
let guestChartData = [];
let ciguestChartData = [];
let carChartData = [];
let dateChartData = [];
// let guestChartDataSUM = [];

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Access-Control-Allow-Origin, Access-Control-Allow-Headers, Authorization, X-Requested-With',
  'Access-Control-Allow-Methods': 'OPTIONS, POST, GET',
};

// eslint-disable-next-line no-extend-native
Date.prototype.addDays = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

function sendResError(res) {
  res.writeHead(400, headers);
  res.end(JSON.stringify({ Error: true, Message: 'Error executing MySQL query' }));
}

function getDatesArray() {
  const startDate = new Date().addDays(-30);
  const currentDate = new Date();
  const dateArray = [];

  for (let d = new Date(startDate); d <= currentDate; d.setDate(d.getDate() + 1)) {
    const dt = datetime.create(d);
    dateArray.push({ xAxes: dt.format('Y-m-d'), yAxes: 0 });
    // dateArray.push(new Date(d));
  }
  return dateArray;
}

async function createChartDataArray(res) {
  dateChartData = getDatesArray();
  dateChartData.sort((a, b) => {
    const dateA = new Date(a.xAxes);
    const dateB = new Date(b.xAxes);
    return dateA - dateB;
  });
  try {
    empChartData = await dbConnect.query(dbSelect.apiGetEmployeeCount);
    guestChartData = await dbConnect.query(dbSelect.apiGetGuestCount);
    ciguestChartData = await dbConnect.query(dbSelect.apiGetCIGuestCount);
    carChartData = await dbConnect.query(dbSelect.apiGetCarCount);
  } catch (err) {
    sendResError(res);
    return err;
  }
  // Собираем ключи из первого массива
  const seglistG = guestChartData.reduce((o, el) => { o[el.xAxes] = true; return (o[el.xAxes], o); }, {});
  const seglistC = carChartData.reduce((o, el) => { o[el.xAxes] = true; return (o[el.xAxes], o); }, {});
  const seglistE = empChartData.reduce((o, el) => { o[el.xAxes] = true; return (o[el.xAxes], o); }, {});
  const seglistCG = ciguestChartData.reduce((o, el) => { o[el.xAxes] = true; return (o[el.xAxes], o); }, {});

  dateChartData.forEach((el) => {
    // Добавляем отсутствующие
    if (!seglistG[el.xAxes]) {
      el.xAxes = el.xAxes;
      el.yAxes = 0;
      guestChartData.push(el);
    }
    if (!seglistC[el.xAxes]) {
      el.xAxes = el.xAxes;
      el.yAxes = 0;
      carChartData.push(el);
    }
    if (!seglistE[el.xAxes]) {
      el.xAxes = el.xAxes;
      el.yAxes = 0;
      empChartData.push(el);
    }
    if (!seglistCG[el.xAxes]) {
      el.xAxes = el.xAxes;
      el.yAxes = 0;
      ciguestChartData.push(el);
    }
  });

  guestChartData.sort((a, b) => {
    const dateA = new Date(a.xAxes);
    const dateB = new Date(b.xAxes);
    return dateA - dateB;
  });

  carChartData.sort((a, b) => {
    const dateA = new Date(a.xAxes);
    const dateB = new Date(b.xAxes);
    return dateA - dateB;
  });

  empChartData.sort((a, b) => {
    const dateA = new Date(a.xAxes);
    const dateB = new Date(b.xAxes);
    return dateA - dateB;
  });

  ciguestChartData.sort((a, b) => {
    const dateA = new Date(a.xAxes);
    const dateB = new Date(b.xAxes);
    return dateA - dateB;
  });

  // суммирование двух массивов (гочти через проходную и гости внутинние)
  guestChartData = guestChartData.reduce((acc, value, index) => [...acc, { xAxes: value.xAxes, yAxes: value.yAxes + ciguestChartData[index].yAxes }], []);


  /*
  // Проходим по второму
  empChartData.forEach((el) => {
  // Добавляем отсутствующие
    if (!seglist[el.xAxes]) {
      el.xAxes = el.xAxes;
      el.yAxes = 0;
      guestChartData.push(el);
    }
  });

  guestChartData.sort((a, b) => {
    const dateA = new Date(a.xAxes);
    const dateB = new Date(b.xAxes);
    return dateA - dateB;
  });
*/
  // logger.error(guestChartData);

  return {
    empChartData,
    guestChartData,
    carChartData,
  };
}

async function apiGetEmpAndGuestChart(res) {
  const finalChartData = await createChartDataArray(res);
  // logger.error(finalChartData);
  return finalChartData;
  // return chartData;
}

module.exports = apiGetEmpAndGuestChart;
