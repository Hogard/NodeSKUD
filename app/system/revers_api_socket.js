const tls = require('tls');
const fs = require('fs');

require('tls').DEFAULT_MIN_VERSION = 'TLSv1';

const config = require('../config/system_config');

const logger = require('../config/logger_config');

const options = {
  requestCert: true,
  rejectUnauthorized: false,
  key: fs.readFileSync('./cert/ssl.key'),
  cert: fs.readFileSync('./cert/cert.pem'),
};

const filterEventsCommand = JSON.stringify({
  Command: 'filterevents',
  Id: 1,
  Version: 1,
  Filter: 1,
});

function createBuffer(postJSONData) {
  const buffer = Buffer.from(postJSONData);
  const bufferWithByte = Buffer.alloc(4 + buffer.length);
  bufferWithByte.writeInt32LE(buffer.length, 0);
  buffer.copy(bufferWithByte, 4);
  return bufferWithByte;
}

// Соединение с сервером Revers 8000 API
function initApiSocket() {
  const socket = tls.connect(config.revers.port, config.revers.host, options, () => {
    logger.info(`Revers API client connected${socket.authorized ? ' authorized' : ' unauthorized'}`);
    socket.write(createBuffer(filterEventsCommand));
    process.stdin.pipe(socket);
    process.stdin.resume();
  });
  socket.setKeepAlive(true);
  return socket;
}

module.exports = initApiSocket;
