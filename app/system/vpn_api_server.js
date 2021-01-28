const logger = require('../config/logger_config');
const dbConnect = require('../utils/db_connect');
const dbSelect = require('../utils/db_select');

async function connectedUsers(wss, clientId) {
  try {
    const vpnOnlineRows = await dbConnect.query(dbSelect.vpnOnline);
    if (clientId) {
      clientId.send(
        JSON.stringify({
          event: 'event_vpn_online',
          data: vpnOnlineRows,
        }),
      );
    } else {
      wss.clients.forEach(client => {
        client.send(
          JSON.stringify({
            event: 'event_vpn_online',
            data: vpnOnlineRows,
          }),
        );
      });
    }
  } catch (error) {
    logger.error(error);
  }
}

async function sendUserSessions(clientId, account) {
  try {
    const vpnUserSessionsRows = await dbConnect.query(dbSelect.vpnUserSessions(account));
    clientId.send(
      JSON.stringify({
        event: 'event_vpn_user_sessions',
        data: vpnUserSessionsRows,
      }),
    );
  } catch (error) {
    logger.error(error);
  }
}

async function allUsers(wss, clientId) {
  try {
    const vpnAllUsersRows = await dbConnect.query(dbSelect.vpnAllUsers);
    if (clientId) {
      clientId.send(
        JSON.stringify({
          event: 'event_vpn_all_users',
          data: vpnAllUsersRows,
        }),
      );
    } else {
      wss.clients.forEach(client => {
        client.send(
          JSON.stringify({
            event: 'event_vpn_all_users',
            data: vpnAllUsersRows,
          }),
        );
      });
    }
  } catch (error) {
    logger.error(error);
  }
}

async function sendUserStatus(clientId, account) {
  try {
    const vpnUserStatusRows = await dbConnect.query(dbSelect.vpnUserStatus(account));
    clientId.send(
      JSON.stringify({
        event: 'event_vpn_user_status',
        data: vpnUserStatusRows[0].ipAddress,
      }),
    );
  } catch (error) {
    logger.error(error);
  }
}

async function initApi(wss, clientId) {
  connectedUsers(wss, clientId);
  allUsers(wss, clientId);
}

async function vpnEvents(wss, clientId) {
  setInterval(() => {
    connectedUsers(wss, clientId);
    // vpnSessionPerDay(wss, clientId);
  }, 60000);
  setInterval(() => {
    allUsers(wss, clientId);
  }, 600000);
}

exports.sendUserSessions = sendUserSessions;
exports.sendUserStatus = sendUserStatus;
exports.init = initApi;
exports.vpnEvents = vpnEvents;
// module.exports = initVPNAPIServer;
