const logger = require('../config/logger_config');
const dbConnect = require('../utils/db_connect');
const dbSelect = require('../utils/db_select');

async function vpnOnline(wss, clientId) {
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

async function vpnSessionPerDay(wss, clientId) {
  try {
    const vpnSessionPerDayRows = await dbConnect.query(dbSelect.vpnSessionPerDay);
    if (clientId) {
      clientId.send(
        JSON.stringify({
          event: 'event_vpn_session_per_day',
          data: vpnSessionPerDayRows,
        }),
      );
    } else {
      wss.clients.forEach(client => {
        client.send(
          JSON.stringify({
            event: 'event_vpn_session_per_day',
            data: vpnSessionPerDayRows,
          }),
        );
      });
    }
  } catch (error) {
    logger.error(error);
  }
}

async function vpnAllUsers(wss, clientId) {
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

async function sendVPNUserStatus(clientId, account) {
  try {
    const vpnUserStatusRows = await dbConnect.query(dbSelect.vpnUserStatus(account));
    clientId.send(
      JSON.stringify({
        event: 'event_vpn_user_status',
        data: vpnUserStatusRows.length,
      }),
    );
  } catch (error) {
    logger.error(error);
  }
}

async function initVPNAPIServer(wss, clientId) {
  setInterval(() => {
    vpnOnline(wss, clientId);
    // vpnSessionPerDay(wss, clientId);
  }, 60000);
  setInterval(() => {
    vpnAllUsers(wss, clientId);
  }, 60000);
}

exports.sendVPNUserStatus = sendVPNUserStatus;
exports.init = initVPNAPIServer;
// module.exports = initVPNAPIServer;
