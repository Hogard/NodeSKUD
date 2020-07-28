const fetch = require('node-fetch');
const logger = require('../config/logger_config');
const config = require('../config/system_config');

// Log in and obtain an authentication token
async function getAuthToken() {
  const authData = {
    jsonrpc: '2.0',
    method: 'user.login',
    params: {
      user: 'ZabbixAPIUser',
      password: 'G4SCb68LIbL8',
    },
    id: 1,
    auth: null,
  };

  logger.info('Processing Zabbix Auth.');

  const authTokenResponse = await fetch(config.zabbix.host, {
    method: 'post',
    body: JSON.stringify(authData),
    headers: { 'Content-Type': 'application/json-rpc' },
  });
  const tokenJSON = await authTokenResponse.json();
  return tokenJSON.result;
}

// Retrieve all data about two hosts
async function getUniPingData(token) {
  const postData = {
    jsonrpc: '2.0',
    method: 'item.get',
    id: 1,
    auth: token,
    params: {
      hostids: [10186, 10229],
      output: ['hostid', 'key_', 'name', 'lastvalue'],
      filter: { key_: ['HumiditySensorValue', 'HumiditySensorValueT', 'snmptrap["Moving sensor"]'] },
    },
  };
  const dataResponse = await fetch(config.zabbix.host, {
    method: 'post',
    body: JSON.stringify(postData),
    headers: { 'Content-Type': 'application/json-rpc' },
  });
  const dataJSON = await dataResponse.json();
  return dataJSON;
}

async function getProviderData(token) {
  const postData = {
    jsonrpc: '2.0',
    method: 'item.get',
    id: 1,
    auth: token,
    params: {
      hostids: [10149, 10199],
      output: ['hostid', 'key_', 'name', 'lastvalue'],
      filter: {
        key_: [
          'ifHCInOctets[GigabitEthernet0/1/0]',
          'IfHCOutOctets[GigabitEthernet0/1/0]',
          'ifHCInOctets[GigabitEthernet0/2]',
          'IfHCOutOctets[GigabitEthernet0/2]',
          'ifHCInOctets[GigabitEthernet0/3]',
          'IfHCOutOctets[GigabitEthernet0/3]',
          'ciscoBgpPeerAdminStatus[176.221.9.165]',
          'ciscoBgpPeerAdminStatus[62.152.42.13]',
        ],
      },
    },
  };
  const dataResponse = await fetch(config.zabbix.host, {
    method: 'post',
    body: JSON.stringify(postData),
    headers: { 'Content-Type': 'application/json-rpc' },
  });
  const dataJSON = await dataResponse.json();
  return dataJSON;
}
async function serverRoomSensor(wss, clientId, data) {
  const uniPingSensorValue = {
    temper1: data.result[1].lastvalue,
    temper2: data.result[4].lastvalue,
    himidity1: data.result[0].lastvalue,
    himidity2: data.result[3].lastvalue,
  };
  try {
    if (clientId) {
      clientId.send(
        JSON.stringify({
          event: 'event_server_room_sensor',
          data: uniPingSensorValue,
        }),
      );
    } else {
      wss.clients.forEach(client => {
        client.send(
          JSON.stringify({
            event: 'event_server_room_sensor',
            data: uniPingSensorValue,
          }),
        );
      });
    }
  } catch (error) {
    logger.error(error);
  }
}

async function providerStatus(wss, clientId, data) {
  const providerValue = {
    inSpeedOrange: (data.result[7].lastvalue / 1000 / 1000).toFixed(2),
    outSpeedOrange: (data.result[6].lastvalue / 1000 / 1000).toFixed(2),
    inSpeedTelros: (data.result[4].lastvalue / 1000 / 1000).toFixed(2),
    outSpeedTelros: (data.result[0].lastvalue / 1000 / 1000).toFixed(2),
    inSpeedFilanco: (data.result[5].lastvalue / 1000 / 1000).toFixed(2),
    outSpeedFilanco: (data.result[1].lastvalue / 1000 / 1000).toFixed(2),
    bgp62: data.result[3].lastvalue,
    bgp176: data.result[2].lastvalue,
  };
  try {
    if (clientId) {
      clientId.send(
        JSON.stringify({
          event: 'event_provider_value',
          data: providerValue,
        }),
      );
    } else {
      wss.clients.forEach(client => {
        client.send(
          JSON.stringify({
            event: 'event_provider_value',
            data: providerValue,
          }),
        );
      });
    }
  } catch (error) {
    logger.error(error);
  }
}

function initZabbixAPIServer(wss, clientId) {
  getAuthToken().then(token => {
    setInterval(() => {
      getUniPingData(token).then(data => {
        // logger.info({ 'Zabbix Data:': data.result[0].lastvalue });
        serverRoomSensor(wss, clientId, data);
      });
    }, 30000);
    setInterval(() => {
      getProviderData(token).then(data => {
        logger.info({ 'Zabbix Data:': data.result });
        providerStatus(wss, clientId, data);
      });
    }, 30000);
  });
}

module.exports = initZabbixAPIServer;
