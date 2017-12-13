#! /usr/bin/env node
'use strict';

const express = require('express');
const http = require('http');
const morgan = require('morgan');
const util = require('util');

const chatServer = require('./app.js');

const root = __dirname;

let mode = 'prod';
let port = process.env.PORT || 3010;

const args = process.argv.slice(2);
if (args.length >= 1 && args[0] === 'dev') {
	mode = 'dev';
	port = 3015;
}

console.log('Mode: ' + mode);
console.log('Environment:\n' + util.inspect(process.env));

const config = {
	root: root,
	port: port,
	mode: mode,
	chatPath: '/chat'
};

const app = express();

app.use(morgan('dev'));

app.use(handleAppError);

function handleAppError(err, req, res, next) {
	const msg = 'ERROR: App error: ' + util.inspect(err); // this seems to also print out a stack trace
	console.log(msg);
	if (res.headersSent) {
		return next(err);
	}
	res.status(500).send(msg);
}

const httpServer = http.createServer(app);

var subApp = chatServer.init(chatRouter, httpServer, config);
app.use(config.chatPath, subApp);

app.use(function notFound(req, res, next) {
	res.sendStatus(404);
});

httpServer.listen(port, function httpServerListening() {
	console.log('Oracle Bots Chat Server is listening on port ' + port);
});
