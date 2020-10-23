const fetch = require('node-fetch');
const logger = require('../config/logger_config');
const config = require('../config/system_config');

const hardwareGroup = {
  7: 'ups',
  10: 'switch',
  13: 'vmware',
  17: 'router',
  21: 'server',
};

// Log in and obtain an authentication token.
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

async function getHostbyTrigger(token, triggerid) {
  const postData = {
    jsonrpc: '2.0',
    method: 'host.get',
    id: 1,
    auth: token,
    params: {
      triggerids: triggerid,
      output: ['hostid', 'name', 'description'],
    },
  };
  try {
    const dataResponse = await fetch(config.zabbix.host, {
      method: 'post',
      body: JSON.stringify(postData),
      headers: { 'Content-Type': 'application/json-rpc' },
    });
    const dataJSON = await dataResponse.json();
    return dataJSON.result;
  } catch (error) {
    return error;
  }
}

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
  return dataJSON.result;
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
  return dataJSON.result;
}

async function serverRoomSensor(wss, clientId, data) {
  const uniPingSensorValue = {
    temper1: data[1].lastvalue,
    temper2: data[4].lastvalue,
    himidity1: data[0].lastvalue,
    himidity2: data[3].lastvalue,
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
    inSpeedOrange: (data[7].lastvalue / 1000 / 1000).toFixed(2),
    outSpeedOrange: (data[6].lastvalue / 1000 / 1000).toFixed(2),
    inSpeedTelros: (data[4].lastvalue / 1000 / 1000).toFixed(2),
    outSpeedTelros: (data[0].lastvalue / 1000 / 1000).toFixed(2),
    inSpeedFilanco: (data[5].lastvalue / 1000 / 1000).toFixed(2),
    outSpeedFilanco: (data[1].lastvalue / 1000 / 1000).toFixed(2),
    bgp62: data[3].lastvalue,
    bgp176: data[2].lastvalue,
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

async function getHardwareEvent(token, groupId) {
  const postData = {
    jsonrpc: '2.0',
    method: 'problem.get',
    id: 1,
    auth: token,
    params: {
      groupids: groupId,
      severities: [2, 3, 4, 5],
      sortfield: ['eventid'],
      sortorder: 'DESC',
    },
  };
  try {
    const dataResponse = await fetch(config.zabbix.host, {
      method: 'post',
      body: JSON.stringify(postData),
      headers: { 'Content-Type': 'application/json-rpc' },
    });
    const dataJSON = await dataResponse.json();
    return dataJSON.result;
  } catch (error) {
    return error;
  }
}

async function getHardwareEventById(token, data) {
  let switchName = [];
  const switchValue = [];
  for (let i = 0; i < data.length; i += 1) {
    switchName = await getHostbyTrigger(token, data[i].objectid);
    switchValue[i] = {
      hardwareName: switchName[0].name,
      hardwareDescription: switchName[0].description,
      eventTimeStamp: data[i].clock,
      eventName: data[i].name,
      eventSeverity: data[i].severity,
    };
  }
  return switchValue;
}

function sendHardwareEvent(wss, clientId, events, groupName) {
  try {
    if (clientId) {
      clientId.send(
        JSON.stringify({
          event: `event_${groupName}_value`,
          data: events,
        }),
      );
    } else {
      wss.clients.forEach(client => {
        client.send(
          JSON.stringify({
            event: `event_${groupName}_value`,
            data: events,
          }),
        );
      });
    }
  } catch (error) {
    logger.error(error);
  }
}

async function initZabbixAPIServer(wss, clientId) {
  const token = await getAuthToken();

  setInterval(() => {
    getUniPingData(token).then(data => {
      serverRoomSensor(wss, clientId, data);
    });
  }, 30000);
  setInterval(() => {
    getProviderData(token).then(data => {
      providerStatus(wss, clientId, data);
    });
  }, 30000);
  setInterval(() => {
    Object.entries(hardwareGroup).forEach(([key, value]) => {
      logger.info({ 'Processing Zabbix Auth.': key });
      getHardwareEvent(token, key).then(data => {
        getHardwareEventById(token, data).then(events => {
          sendHardwareEvent(wss, clientId, events, value);
        });
      });
    });
  }, 30000);
}

module.exports = initZabbixAPIServer;
