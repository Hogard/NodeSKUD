const fetch = require('node-fetch');
const logger = require('../config/logger_config');
const config = require('../config/system_config');

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

async function getHostData(token) {
  const postData = {
    jsonrpc: '2.0',
    method: 'host.get',
    id: 1,
    auth: token,
    params: {
      output: ['hostid', 'host'],
    },
  };

  const versionResponse = await fetch(config.zabbix.host, {
    method: 'post',
    body: JSON.stringify(postData),
    headers: { 'Content-Type': 'application/json-rpc' },
  });
  return versionResponse.json();
}

function initZabbixAPIServer(clientId) {
  getAuthToken().then(token => {
    logger.info({ 'Zabbix Auth token:': token });
    setInterval(() => {
      getHostData(token).then(data => {
        logger.info({ 'Zabbix Auth token:': data });
      });
    }, 15000);
  });
}

module.exports = initZabbixAPIServer;
