const logger = require('../config/logger_config');

const initApiSocket = require('./revers_api_socket');
const initHttpServer = require('./http_server');
const createJSONRequest = require('./create_json');
const websocketServer = require('./websocket_server');
const dbConnect = require('../utils/db_connect');
const dbInsert = require('../utils/db_insert');
const dbSelect = require('../utils/db_select');

const wss = websocketServer();

const initZabbixAPIServer = require('./zabbix_api_server');
const initVPNAPIServer = require('./vpn_api_server');

const socket = initApiSocket();
// const http = httpServer(socket);
// const io = webSocket(http);

const clients = [];

require('events').EventEmitter.defaultMaxListeners = 45;

initHttpServer();

async function guestPerDay(clientId) {
  try {
    const guestCIPerDayRows = await dbConnect.query(dbSelect.guestCIPerDay);
    const guestEntrancePerDayRows = await dbConnect.query(dbSelect.guestEntrancePerDay);
    if (clientId) {
      // io.to(clientId).emit('event_guest_per_day', guestEntrancePerDayRows.length + guestCIPerDayRows.length);

      clientId.send(
        JSON.stringify({
          event: 'event_guest_per_day',
          data: guestEntrancePerDayRows.length + guestCIPerDayRows.length,
        }),
      );
    } else {
      // io.emit('event_guest_per_day', guestEntrancePerDayRows.length + guestCIPerDayRows.length);
      wss.clients.forEach(client => {
        client.send(
          JSON.stringify({
            event: 'event_guest_per_day',
            data: guestEntrancePerDayRows.length + guestCIPerDayRows.length,
          }),
        );
      });
    }
  } catch (error) {
    logger.error(error);
  }
}

async function carTotalPerDay(clientId) {
  try {
    const carTotalPerDayRows = await dbConnect.query(dbSelect.carTotalPerDay);
    if (clientId) {
      clientId.send(
        JSON.stringify({
          event: 'event_car_per_day',
          data: carTotalPerDayRows.length,
        }),
      );
    } else {
      wss.clients.forEach(client => {
        client.send(
          JSON.stringify({
            event: 'event_car_per_day',
            data: carTotalPerDayRows.length,
          }),
        );
      });
    }
  } catch (error) {
    logger.error(error);
  }
}

async function realCarOnTerritory(clientId) {
  const carRealEntryArray = [];
  const carRealExitArray = [];
  try {
    const carRealEntryRows = await dbConnect.query(dbSelect.carRealEntry);
    carRealEntryRows.forEach((row, i) => {
      carRealEntryArray[i] = row.gc_value_sys;
    });
  } catch (error) {
    logger.error(error);
  }

  try {
    const carRealExitRows = await dbConnect.query(dbSelect.carRealExit);
    carRealExitRows.forEach((row, i) => {
      carRealExitArray[i] = row.gc_value_sys;
    });
    let pos;
    carRealExitArray.forEach(row => {
      pos = carRealEntryArray.indexOf(row);
      if (pos !== -1) {
        carRealEntryArray.splice(pos, 1);
      }
    });
  } catch (error) {
    logger.error(error);
  }
  // io.emit('event_real_car_on_territory', carRealEntryArray.length);
  if (clientId) {
    clientId.send(
      JSON.stringify({
        event: 'event_real_car_on_territory',
        data: carRealEntryArray.length,
      }),
    );
  } else {
    wss.clients.forEach(client => {
      client.send(
        JSON.stringify({
          event: 'event_real_car_on_territory',
          data: carRealEntryArray.length,
        }),
      );
    });
  }
}

// Передача запроса на выдачу или изьятие гостевой карты
function sendExtJSON(reqBody) {
  if (JSON.parse(reqBody).secret === 'Z3SN1AR6') {
    const socketReq = initApiSocket();
    createJSONRequest(socketReq, reqBody, false);
    if (JSON.parse(reqBody).event === 'issue') guestPerDay();
    if (/автомобиль/.test(JSON.parse(reqBody).pass_type)) {
      realCarOnTerritory();
      carTotalPerDay();
    }
    socketReq.on('data', data => {
      try {
        const resive = JSON.parse(data.slice(4).toString());
        logger.info(resive);
        switch (resive.Command) {
          case 'addcard':
            if (resive.ErrCode === 9) {
              createJSONRequest(socketReq, reqBody, true);
            } else socketReq.emit('end');
            break;
          case 'editcard':
            if (resive.ErrCode === 0 || resive.ErrCode === 10) socketReq.emit('end');
            break;
          case 'delcard':
            if (resive.ErrCode === 6) {
              createJSONRequest(socketReq, reqBody, true);
            } else socketReq.emit('end');
            break;
          default:
            break;
        }
      } catch (e) {
        logger.error({ 'RESIVE ERROR: ': e });
      }
    });
    socketReq.on('end', () => {
      socketReq.destroy();
      logger.info('Revers API web client disconnected from server');
    });
  } else {
    logger.error('Not valid secret phrase');
  }
}

async function realOnTerritory(evAddr, clientId) {
  const apEntryAC = [1, 5, 16, 21, 27];
  const apExitAC = [2, 6, 17, 20, 28];
  const apEntryAS = [36, 39, 45, 47];
  const apExitAS = [37, 40, 46, 48];
  const empRealEntryArray = [];
  const empRealExitArray = [];
  const guestRealEntryArray = [];
  const guestRealExitArray = [];
  // const realEmployee = {};
  let building;
  if (apEntryAC.indexOf(evAddr) !== -1 || apExitAC.indexOf(evAddr) !== -1) {
    building = 'AC';
  } else if (apEntryAS.indexOf(evAddr) !== -1 || apExitAS.indexOf(evAddr) !== -1) {
    building = 'AS';
  } else return;

  // сотрудники
  try {
    const empRealEntryRows = await dbConnect.query(dbSelect.empRealEntry(building));
    empRealEntryRows.forEach((row, i) => {
      empRealEntryArray[i] = row.ev_ow_id;
    });
  } catch (error) {
    logger.error(error);
  }

  try {
    const empRealExitRows = await dbConnect.query(dbSelect.empRealExit(building));
    empRealExitRows.forEach((row, i) => {
      empRealExitArray[i] = row.ev_ow_id;
    });
    let pos;
    empRealExitArray.forEach(row => {
      pos = empRealEntryArray.indexOf(row);
      if (pos !== -1) {
        empRealEntryArray.splice(pos, 1);
      }
    });
  } catch (error) {
    logger.error(error);
  }

  // гости
  try {
    const guestRealEntryRows = await dbConnect.query(dbSelect.guestRealEntry(building));
    guestRealEntryRows.forEach((row, i) => {
      guestRealEntryArray[i] = row.ev_ca_value;
    });
  } catch (error) {
    logger.error(error);
  }

  try {
    const guestRealExitRows = await dbConnect.query(dbSelect.guestRealExit(building));
    guestRealExitRows.forEach((row, i) => {
      guestRealExitArray[i] = row.ev_ca_value;
    });
    let pos;
    guestRealExitArray.forEach(row => {
      pos = guestRealEntryArray.indexOf(row);
      if (pos !== -1) {
        guestRealEntryArray.splice(pos, 1);
      }
    });
  } catch (error) {
    logger.error(error);
  }

  if (building === 'AC') {
    // io.emit('event_real_on_territory_ac', { empRealAC: empRealEntryArray.length, guestRealAC: guestRealEntryArray.length });
    if (clientId) {
      clientId.send(
        JSON.stringify({
          event: 'event_real_on_territory_ac',
          data: { empReal: empRealEntryArray.length, guestReal: guestRealEntryArray.length },
        }),
      );
    } else {
      wss.clients.forEach(client => {
        client.send(
          JSON.stringify({
            event: 'event_real_on_territory_ac',
            data: { empReal: empRealEntryArray.length, guestReal: guestRealEntryArray.length },
          }),
        );
      });
    }
  } // else {
  // io.emit('event_real_on_territory_as', { empRealAS: empRealEntryArray.length, guestRealAS: guestRealEntryArray.length });
  if (building === 'AS') {
    if (clientId) {
      clientId.send(
        JSON.stringify({
          event: 'event_real_on_territory_as',
          data: { empReal: empRealEntryArray.length, guestReal: guestRealEntryArray.length },
        }),
      );
    } else {
      wss.clients.forEach(client => {
        client.send(
          JSON.stringify({
            event: 'event_real_on_territory_as',
            data: { empReal: empRealEntryArray.length, guestReal: guestRealEntryArray.length },
          }),
        );
      });
    }
  }
}

// Посыл ответной комманды ping
function sendPing(pingId) {
  const pingJSONData = JSON.stringify({
    Command: 'ping',
    Id: pingId,
    Version: 1,
  });
  socket.write(createJSONRequest.createBuffer(pingJSONData));
}

// Разбор событий от Revers API
function parseEvent(data) {
  const resive = JSON.parse(data.toString());
  const apEntry = [1, 5, 16, 21, 27, 36, 39, 41, 43, 45, 47];
  const apExit = [2, 6, 17, 20, 28, 37, 40, 42, 44, 46, 48];
  const employee = [3, 4, 189, 190, 191, 192, 193, 194, 195, 332];
  const apServerRoom = [29, 38];
  const guestCardId = [
    230,
    231,
    235,
    236,
    239,
    240,
    241,
    242,
    244,
    246,
    247,
    248,
    249,
    250,
    251,
    252,
    256,
    257,
    258,
    261,
    262,
    263,
    264,
    265,
    266,
    267,
    268,
    269,
    270,
    280,
    287,
    291,
    293,
    295,
    296,
    298,
    301,
  ];

  resive.Data.forEach(async item => {
    if (item.EvCode === 1) {
      const insertEventValue = [item.EvTime.replace(/(\d+).(\d+).(\d+)/, '$3-$2-$1'), item.EvCode, item.EvAddr, item.EvUser, item.EvCard];
      try {
        await dbConnect.query(dbInsert.inserEvent, insertEventValue);
        if (apEntry.indexOf(item.EvAddr) !== -1) {
          try {
            // const lastEntryRows = await dbConnect.query(dbSelect.lastEntry);
            // lastEntryRows.forEach((row) => {
            //   io.emit('event_entry', row);
            // });
            const allTenEntryRows = await dbConnect.query(dbSelect.allTenEntry);
            wss.clients.forEach(client => {
              client.send(
                JSON.stringify({
                  event: 'event_entry',
                  data: allTenEntryRows,
                }),
              );
            });
          } catch (error) {
            logger.error(error);
          }

          realOnTerritory(item.EvAddr);

          if (guestCardId.indexOf(item.EvUser) === -1) {
            try {
              const employeeTotalPerDayRows = await dbConnect.query(dbSelect.employeeTotalPerDay);
              // io.emit('event_employee_per_day', employeeTotalPerDayRows.length);
              wss.clients.forEach(client => {
                client.send(
                  JSON.stringify({
                    event: 'event_employee_per_day',
                    data: employeeTotalPerDayRows.length,
                  }),
                );
              });
            } catch (error) {
              logger.error(error);
            }
          } // else {
          // guestPerDay();
          // /*
          // try {
          //   const guestCIPerDayRows = await dbConnect.query(dbSelect.guestCIPerDay);
          //   const guestEntrancePerDayRows = await dbConnect.query(dbSelect.guestEntrancePerDay);
          //   io.emit('event_guest_per_day', guestEntrancePerDayRows.length + guestCIPerDayRows.length);
          // } catch (error) {
          //   logger.error(error);
          // }
          // */
          // }
        }

        if (apExit.indexOf(item.EvAddr) !== -1) {
          try {
            // const lastExitRows = await dbConnect.query(dbSelect.lastExit);
            // lastExitRows.forEach((row) => {
            //   io.emit('event_exit', row);
            // });
            const allTenExitRows = await dbConnect.query(dbSelect.allTenExit);
            wss.clients.forEach(client => {
              client.send(
                JSON.stringify({
                  event: 'event_exit',
                  data: allTenExitRows,
                }),
              );
            });
          } catch (error) {
            logger.error(error);
          }
          realOnTerritory(item.EvAddr);
        }

        if (employee.indexOf(item.EvUser) !== -1) {
          try {
            // const lastEmployeeUCRows = await dbConnect.query(dbSelect.lastEmployeeUC);
            // lastEmployeeUCRows.forEach((row) => {
            //   io.emit('event_employeeuc', row);
            // });
            const allEmployeeUCRows = await dbConnect.query(dbSelect.allEmployeeUC);
            wss.clients.forEach(client => {
              client.send(
                JSON.stringify({
                  event: 'event_employeeuc',
                  data: allEmployeeUCRows,
                }),
              );
            });
          } catch (error) {
            logger.error(error);
          }
        }

        // отправка события срабатывания карточки доступа сотрудника

        if (item.EvUser !== 0) {
          try {
            const lastEmployeeRows = await dbConnect.query(dbSelect.lastEmployee(item.EvUser));
            let lastEmployee = {};
            if (lastEmployeeRows.length === 1) {
              lastEmployee = {
                id: lastEmployeeRows[0].id,
                lastName: lastEmployeeRows[0].lname,
                firstName: lastEmployeeRows[0].fname,
                middleName: lastEmployeeRows[0].mname,
                photo: lastEmployeeRows[0].photo,
                apointName: lastEmployeeRows[0].apoint,
                timeStamp: lastEmployeeRows[0].tstamp,
              };
            }
            wss.clients.forEach(client => {
              client.send(
                JSON.stringify({
                  event: 'event_employee',
                  data: lastEmployee,
                }),
              );
            });
          } catch (error) {
            logger.error(error);
          }
        }

        if (apServerRoom.indexOf(item.EvAddr) !== -1) {
          try {
            const lastServerRoomEmployeeRows = await dbConnect.query(dbSelect.lastServerRoomEmployee(item.EvUser));
            /*
            let lastServerRoomEmployee = {};
            if (lastServerRoomEmployeeRows.length === 1) {
              lastServerRoomEmployee = {
                lastName: lastServerRoomEmployeeRows[0].lname,
                firstName: lastServerRoomEmployeeRows[0].fname,
                middleName: lastServerRoomEmployeeRows[0].mname,
                photo: lastServerRoomEmployeeRows[0].photo,
                apointName: lastServerRoomEmployeeRows[0].apoint,
                timeStamp: lastServerRoomEmployeeRows[0].tstamp,
                apointAddr: lastServerRoomEmployeeRows[0].apointaddr,
              };
            } */
            wss.clients.forEach(client => {
              client.send(
                JSON.stringify({
                  event: item.EvAddr === 29 ? 'event_server_room_1_employee' : 'event_server_room_2_employee',
                  data: lastServerRoomEmployeeRows[0],
                }),
              );
            });
          } catch (error) {
            logger.error(error);
          }
        }
      } catch (error) {
        logger.error(error);
      }
    }
  });
}

async function lastServerRoomEmployee(clientId) {
  try {
    const lastServerRoom1EmployeeRows = await dbConnect.query(dbSelect.lastServerRoomEmployeeInit(29));
    const lastServerRoom2EmployeeRows = await dbConnect.query(dbSelect.lastServerRoomEmployeeInit(38));
    clientId.send(
      JSON.stringify({
        event: 'event_server_room_1_employee',
        data: lastServerRoom1EmployeeRows[0],
      }),
    );
    clientId.send(
      JSON.stringify({
        event: 'event_server_room_2_employee',
        data: lastServerRoom2EmployeeRows[0],
      }),
    );
  } catch (error) {
    logger.error(error);
  }
}

// main functions
async function initDash(clientId) {
  try {
    const allTenEntryRows = await dbConnect.query(dbSelect.allTenEntry);
    // allTenEntryRows.forEach((row) => {
    //   io.to(clientId).emit('event_entry', row);
    // });
    clientId.send(
      JSON.stringify({
        event: 'event_entry',
        data: allTenEntryRows,
      }),
    );
  } catch (error) {
    logger.error(error);
  }

  try {
    const allTenExitRows = await dbConnect.query(dbSelect.allTenExit);
    // allTenExitRows.forEach((row) => {
    //   io.to(clientId).emit('event_exit', row);
    // });
    clientId.send(
      JSON.stringify({
        event: 'event_exit',
        data: allTenExitRows,
      }),
    );
  } catch (error) {
    logger.error(error);
  }

  try {
    const allEmployeeUCRows = await dbConnect.query(dbSelect.allEmployeeUC);
    // allEmployeeUCRows.forEach((row) => {
    //   io.to(clientId).emit('event_employeeuc', row);
    // });
    clientId.send(
      JSON.stringify({
        event: 'event_employeeuc',
        data: allEmployeeUCRows,
      }),
    );
  } catch (error) {
    logger.error(error);
  }

  try {
    const employeeTotalPerDayRows = await dbConnect.query(dbSelect.employeeTotalPerDay);
    // io.to(clientId).emit('event_employee_per_day', employeeTotalPerDayRows.length);
    clientId.send(
      JSON.stringify({
        event: 'event_employee_per_day',
        data: employeeTotalPerDayRows.length,
      }),
    );
  } catch (error) {
    logger.error(error);
  }

  guestPerDay(clientId);
  carTotalPerDay(clientId);
  /*
  try {
    const guestCIPerDayRows = await dbConnect.query(dbSelect.guestCIPerDay);
    const guestEntrancePerDayRows = await dbConnect.query(dbSelect.guestEntrancePerDay);
    io.to(clientId).emit('event_guest_per_day', guestEntrancePerDayRows.length + guestCIPerDayRows.length);
  } catch (error) {
    logger.error(error);
  }
  */
  try {
    const carTotalPerDayRows = await dbConnect.query(dbSelect.carTotalPerDay);
    // io.to(clientId).emit('event_car_per_day', carTotalPerDayRows.length);
    clientId.send(
      JSON.stringify({
        event: 'event_car_per_day',
        data: carTotalPerDayRows.length,
      }),
    );
  } catch (error) {
    logger.error(error);
  }
  realOnTerritory(1, clientId);
  realOnTerritory(36, clientId);
  realCarOnTerritory(clientId);
  lastServerRoomEmployee(clientId);
}

//
// io.on('connection', (websocket) => {
//   // const clientInfo = {};
//  // clientInfo.clientId = websocket.id;
//   // ioClients.push(clientInfo);
//
//   logger.info('New websocket connection');
//   initDash(websocket.id);
//   websocket.emit('connect', 'OK');
// /*
//   io.on('disconnect', (data) => {
//     for (let i = 0, len = ioClients.length; i < len; i += 1) {
//       const c = ioClients[i];
//
//       if (c.clientId === websocket.id) {
//         ioClients.splice(i, 1);
//         break;
//       }
//     }
//   });
// */
// });

wss.on('connection', ws => {
  const id = Math.random();
  clients[id] = ws;
  logger.info(`New connection ${id}`);

  ws.on('message', message => {
    logger.info(`Received message ${message}`);
  });

  initDash(ws);
  // initZabbixAPIServer(wss, ws);

  ws.on('close', () => {
    logger.info(`Connection closed ${id}`);
    delete clients[id];
  });
});

// Отлов событий uncaughtException и закрытие процесса. Далее pm2 перезапускает службу
process.on('uncaughtException', err => {
  logger.info('Uncaught Exception, Restart service !!!');
  logger.info(err.stack);
  process.exit(1);
});

function reversAPIServer() {
  socket.on('data', data => {
    try {
      const resive = JSON.parse(data.slice(4).toString());
      logger.info(resive);
      if (resive.Command === 'ping') sendPing(resive.Id);
      if (resive.Command === 'events') parseEvent(data.slice(4));
    } catch (e) {
      logger.error({ 'RESIVE2 ERROR: ': e });
    }
  });

  socket.on('end', () => {
    socket.destroy();
    logger.info('Revers API client disconnected from server');
  });

  socket.on('error', err => {
    socket.destroy();
    logger.error({ 'Revers API connect error:': err });
    process.exit(1);
    // socket = initApiSocket();
  });
  initZabbixAPIServer(wss);
  initVPNAPIServer(wss);
}

exports.sendExtJSON = sendExtJSON;
module.exports = reversAPIServer;
