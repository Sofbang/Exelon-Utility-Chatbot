"use strict";

var app = require('./app.js');

//set paramters as appropriate
var port =9200;
const config = {
    root: __dirname,
    port: port,
    logLevel: 'INFO',
    logger: null,
		basicAuth: null,
		sslOptions: null
};

// Create an express app instance
var express_app = app.init(config);

// Start the server listening..
express_app.listen(port);
