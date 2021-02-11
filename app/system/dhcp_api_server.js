const logger = require('../config/logger_config');
const dbConnect = require('../utils/db_connect');
const dbSelect = require('../utils/db_select');

async function dhcpAllLeases(wss, clientId) {
  try {
    const dhcpAllLeasesRows = await dbConnect.query(dbSelect.dhcpAllLeases);
    if (clientId) {
      clientId.send(
        JSON.stringify({
          event: 'event_dhcp_leases',
          data: dhcpAllLeasesRows,
        }),
      );
    } else {
      wss.clients.forEach(client => {
        client.send(
          JSON.stringify({
            event: 'event_dhcp_leases',
            data: dhcpAllLeasesRows,
          }),
        );
      });
    }
  } catch (error) {
    logger.error(error);
  }
}

async function dhcpInfo(wss, clientId) {
  try {
    const dhcpInfoRows = await dbConnect.query(dbSelect.dhcpInfo);
    if (clientId) {
      clientId.send(
        JSON.stringify({
          event: 'event_dhcp_info',
          data: dhcpInfoRows,
        }),
      );
    } else {
      wss.clients.forEach(client => {
        client.send(
          JSON.stringify({
            event: 'event_dhcp_info',
            data: dhcpInfoRows,
          }),
        );
      });
    }
  } catch (error) {
    logger.error(error);
  }
}

async function initApi(wss, clientId) {
  dhcpAllLeases(wss, clientId);
  dhcpInfo(wss, clientId);
}

async function dhcpEvents(wss, clientId) {
  setInterval(() => {
    dhcpAllLeases(wss, clientId);
    dhcpInfo(wss, clientId);
  }, 600000);
}

exports.init = initApi;
exports.dhcpEvents = dhcpEvents;
