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

async function initVPNAPIServer(wss, clientId) {
  setInterval(() => {
    vpnOnline(wss, clientId);
    vpnSessionPerDay(wss, clientId);
  }, 60000);
}

module.exports = initVPNAPIServer;
