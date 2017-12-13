const chatServer = require('./lib/chat-server.js');

function init(config, httpServer) {

  return chatServer.init(config, httpServer);
}

module.exports = {
	init: init
};
