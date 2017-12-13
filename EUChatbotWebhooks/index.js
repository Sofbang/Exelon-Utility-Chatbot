"use strict";

var appConfig = require('./botConfig.js').get(process.env.NODE_ENV);
var app = require('./app.js');

//set paramters as appropriate
var port = appConfig.port;
const config = {
    root: __dirname,
    port: port,
    logLevel: 'INFO',
    logger: null,
	basicAuth: null,
    sslOptions: null,
    appConfig: appConfig
};

// Create an express app instance
var express_app = app.init(config);

// Start the server listening..
express_app.listen(port);
