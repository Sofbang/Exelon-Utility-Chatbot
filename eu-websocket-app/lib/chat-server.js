#! /usr/bin/env node

/*
 Bots Chat Server
 */
'use strict';

const bodyParser = require('body-parser');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs');
const mustache = require('mustache');
const path = require('path');
const request = require('request');
const _ = require('underscore');
const url = require('url');
const util = require('util');
const uuid = require('uuid/v4');
const WebSocket = require('ws');
const express = require('express');
const log4js = require('log4js');
const logger = log4js.getLogger();

function init(config, httpServer) {

	var app = express();
	logger.setLevel(config.logLevel||'INFO');

	const root = config.root || './';

	app.use(cors());

	console.log('serve admin settings files', __dirname + '/admin');
	app.use('/admin', express.static(__dirname + '/admin'));
	app.get('/admin/*', function(req, res) {
		res.sendFile('index.html', { root: __dirname + '/admin' }); // load the single view file (angular will handle the page changes on the front-end)
	});


	/********** Datastore **********/

	const DB_FILE_NAME = path.join(__dirname, 'chat-db.json');
	let tempDB = buildDB(DB_FILE_NAME);

	const DB = {
		users: new Map(),
		channels: new Map(),
		bots: new Map(),
		nextWebSocketID: 0
	};
	for (let user of tempDB.users) {
		DB.users.set(user.id, user);
	}
	for (let uc of tempDB.channels) {
		DB.channels.set(uc.id, uc);
	}
	for (let bc of tempDB.bots) {
		DB.bots.set(bc.id, bc);
	}
	DB.nextWebSocketID = tempDB.nextWebSocketID;
	tempDB = null;

	function buildDB(fileName) {
		console.log('Chat database file name: %s', fileName);
		const result = fs.existsSync(fileName) ? require(fileName) : buildNewDB();
		console.log('Chat database: %s', printObject(result, 2));
		return result;
	}

	function buildNewDB() {
		return {
			users: [],
			channels: [],
			bots: [],
			nextWebSocketID: 0
		};
	}

	function saveDB() {
		let output = {
			users: [...DB.users.values()].map( user => convertToPersistentUser(user) ),
			channels: [...DB.channels.values()],
			bots: [...DB.bots.values()],
			nextWebSocketID: DB.nextWebSocketID
		};
		fs.writeFile(DB_FILE_NAME, JSON.stringify(output), saveDBComplete);
	}

	function convertToPersistentUser(user) {
		const result = _.clone(user);
		result.webSockets = []; // user websockets are transient
		return result;
	}

	function saveDBComplete(error) {
		if (error) {
			console.log('ERROR: Chat database save failed: %s', printObject(error, 2));
		} else {
			console.log('Chat database saved');
		}
	}

	/*
	 GET db - Read directly from file.
	 */
	app.get('/db', getDB);

	function getDB(req, res) {
		fs.readFile(DB_FILE_NAME, 'utf8', _.partial(readDBFileCallback, res));
	}

	function readDBFileCallback(res, error, data) {
		if (error) {
			let msg = util.format('ERROR: Error reading Chat database file: %s', printObject(error, 2));
			console.log(msg);
			res.status(500).send(msg);
		} else {
			res.set(CONTENT_TYPE, APPLICATION_JSON_UTF8);
			res.status(200).send(data); // file is read in as UTF-8 string
		}
	}

	/********** Bot Channels (deprecated) **********/

	const botChannelsRoute = app.route('/botChannels');
	botChannelsRoute.all(bodyParser.json());
	botChannelsRoute.get(getBots);
	botChannelsRoute.post(postBot);
	botChannelsRoute.delete(deleteBots);

	const botChannelRoute = app.route('/botChannels/:id');
	botChannelRoute.all(bodyParser.json());
	botChannelRoute.put(putBot);
	botChannelRoute.patch(patchBot);
	botChannelRoute.delete(deleteBot);
	botChannelRoute.get(getBot);

	/********** Bots **********/

	const botsRoute = app.route('/bots');
	botsRoute.all(bodyParser.json());

	/*
	 GET all bots
	 */
	botsRoute.get(getBots);

	function getBots(req, res) {
		res.status(200).send([...DB.bots.values()]);
	}

	/*
	 POST new bot
	 */
	botsRoute.post(postBot);

	function postBot(req, res) {
		const bot = req.body;

		bot.id = uuid();

		if ( ! validateBot(bot, res)) {
			return;
		}

		res.status(201).send(bot);

		DB.bots.set(bot.id, bot);
		saveDB();
	}

	function validateBot(bot, res) {
		if ( ! bot.name) {
			res.status(400).send('Missing Name');
			return false;
		}
		if ( ! bot.uri) {
			res.status(400).send('Missing URI');
			return false;
		}
		if ( ! bot.secretKey) {
			res.status(400).send('Missing Secret Key');
			return false;
		}
		for (let bc of [...DB.bots.values()]) {
			if ((bot.name === bc.name) && (bot.id !== bc.id)) {
				res.status(400).send('Duplicate name');
				return false;
			}
		}
		return true;
	}

	/*
	 DELETE bots
	 */
	botsRoute.delete(deleteBots);

	function deleteBots(req, res) {
		const name = req.query.name;
		if (name) {
			for (let bc of [...DB.bots.values()]) {
				if (name === bc.name) {
					// the name *should* be unique
					return deleteBot_(bc.id, req, res);
				}
			}
		}
		res.status(400).send('Invalid query string');
	}

	const botRoute = app.route('/bots/:id');
	botRoute.all(bodyParser.json());

	/*
	 PUT bot
	 */
	botRoute.put(putBot);

	function putBot(req, res) {
		const id = req.params.id;
		const bot = req.body;

		const exists = DB.bots.get(id);

		if (id !== bot.id) {
			const msg = util.format('Bot IDs do not match\n  URI ID:     %s\n  Payload ID: %s', id, bot.id);
			return res.status(400).send(msg);
		}

		if ( ! validateBot(bot, res)) {
			return;
		}

		res.status(exists ? 200 : 201).send(bot);

		DB.bots.set(id, bot);
		saveDB();
	}

	/*
	 PATCH bot
	 */
	botRoute.patch(patchBot);

	function patchBot(req, res) {
		const id = req.params.id;
		const bot = DB.bots.get(id);
		if ( ! bot) {
			return res.sendStatus(404);
		}

		if (req.body.id && (req.body.id !== id)) {
			const msg = util.format('Bot IDs do not match\n  URI ID:     %s\n  Payload ID: %s', id, req.body.id);
			return res.status(400).send(msg);
		}

		Object.assign(bot, req.body);

		res.status(200).send(bot);
		saveDB();
	}

	/*
	 DELETE bot
	 */
	botRoute.delete(deleteBot);

	function deleteBot(req, res) {
		deleteBot_(req.params.id, req, res);
	}

	function deleteBot_(id, req, res) {
		const bot = DB.bots.get(id);
		if (bot) {
			DB.bots.delete(id);
			saveDB();
			res.sendStatus(204);
		} else {
			res.sendStatus(404);
		}
	}

	/*
	 GET bot
	 */
	botRoute.get(getBot);

	function getBot(req, res) {
		const id = req.params.id;
		const bot = DB.bots.get(id);
		if (bot) {
			res.status(200).send(bot);
		} else {
			res.sendStatus(404);
		}
	}

	/********** WebSocket Server **********/

	const chatPath = config.chatPath || '/chat';
	const WEB_SOCKET_PATH = chatPath + '/ws';

	const wss = new WebSocket.Server({
		server: httpServer,
		path: WEB_SOCKET_PATH,
		verifyClient: verifyChatClient
	});

	function verifyChatClient(info, cb) {
		const query = url.parse(info.req.url, true).query;

		const userID = query.user;
		if ( ! userID) {
			cb(false, 400, 'Missing query parameter: \'user\'');
			return;
		}

		// TODO authenticate user

		info.req.userID = userID;
		cb(true);
	}

	wss.on('listening', function wssListening() {
		console.log('WebSocket Server listening: ' + WEB_SOCKET_PATH);
	});

	wss.on('headers', function wssHeaders(headers) {
		console.log('WebSocket Server response headers: %s', printObject(headers, 2));
	});

	wss.on('connection', function wssConnection(ws) {
		ws.id = DB.nextWebSocketID++;
		console.log('WebSocket[%d] connection', ws.id);
		const user = getUser_(ws.upgradeReq.userID); // instantiates user if necessary
		user.webSockets.push(ws);
		console.log('User: %s WebSockets: %j', ws.upgradeReq.userID, user.webSockets.map( each => each.id ));

		ws.on('open',                _.partial(wsOpen,               ws));
		ws.on('message',             _.partial(wsMessage,            ws));
		ws.on('ping',                _.partial(wsPing,               ws));
		ws.on('pong',                _.partial(wsPong,               ws));
		ws.on('close',               _.partial(wsClose,              ws));
		ws.on('unexpected-response', _.partial(wsUnexpectedResponse, ws));
		ws.on('error',               _.partial(wsError,              ws));
	});

	wss.on('error', function wssError(error) {
		console.log('ERROR: WebSocket Server error: %s', printObject(error, 2));
	});

	function getUser_(userID) {
		let user = DB.users.get(userID);
		if ( ! user) {
			user = {
				id: userID,
				webSockets: []
			};
			DB.users.set(userID, user);
			saveDB();
			console.log('New user: %s', userID);
		}
		return user;
	}

	/********** WebSocket **********/

	function wsOpen(ws) {
		console.log('WebSocket[%d] open', ws.id);
	}

	function wsMessage(ws, data, flags) {
		console.log('WebSocket[%d] message:\n  Data: %s', ws.id, data);
		const user = DB.users.get(ws.upgradeReq.userID);
		if ( ! user) {
			return sendSystemErrorMessage(ws, WS_ERROR_USER_NOT_FOUND, {wsID: ws.id, userID: ws.upgradeReq.userID});
		}
		if ( ! user.webSockets.includes(ws)) {
			return sendSystemErrorMessage(ws, WS_ERROR_USER_WEB_SOCKET_NOT_FOUND, {wsID: ws.id, userID: ws.upgradeReq.userID});
		}

		const msg = JSON.parse(data) || {};
		const msgTo = msg.to || {};

		const recipientType = msgTo.type;
		if ( ! recipientType) {
			return sendSystemErrorMessage(ws, WS_ERROR_MISSING_RECIPIENT_TYPE, {wsID: ws.id, userID: ws.upgradeReq.userID});
		}

		if (recipientType === 'user') {
			wsMessageToUser(user, ws, msg, flags);
		} else if (recipientType === 'channel') {
			wsMessageToChannel(user, ws, msg, flags);
		} else if (recipientType === 'bot') {
			wsMessageToBot(user, ws, msg, flags);
		} else {
			return sendSystemErrorMessage(ws, WS_ERROR_UNSUPPORTED_RECIPIENT_TYPE, {wsID: ws.id, recipientType: recipientType, userID: ws.upgradeReq.userID});
		}

		// replicate the message to the user's other web sockets
		const msg2 = _.clone(msg);
		msg2.from = {
			type: 'self'
		};
		const data2 = JSON.stringify(msg2);
		for (let each of user.webSockets) {
			if (each !== ws) {
				each.send(data2, _.partial(wsSendCallback, user, each));
			}
		}
	}

	function wsMessageToBot(user, ws, msg, flags) {
		const botID = msg.to.id;
		if ( ! botID) {
			return sendSystemErrorMessage(ws, WS_ERROR_MISSING_BOT_ID, {wsID: ws.id, userID: user.id});
		}

		const bot = DB.bots.get(botID);
		if ( ! bot) {
			return sendSystemErrorMessage(ws, WS_ERROR_BOT_CHANNEL_NOT_FOUND, {wsID: ws.id, botID: botID, userID: user.id});
		}

		const body = msg;
		const userID = body.userId;
		if (userID) {
			// user id is optional, but it must match the websocket user id
			if (userID !== user.id) {
				return sendSystemErrorMessage(ws, WS_ERROR_USER_ID_MISMATCH, {wsID: ws.id, userID: user.id, payloadUserID: userID});
			}
		} else {
			// insert the user id if it is absent
			body.userId = user.id;
		}

		const data = Buffer.from(JSON.stringify(body), 'utf8');

		const headers = {};
		headers[CONTENT_TYPE] = APPLICATION_JSON_UTF8;
		headers[SIGNATURE]    = buildSignatureHeader(data, bot.secretKey);

		const callback = _.partial(botsConnectorPostCallback, ws, bot.uri, user);

		request.post({
			uri: bot.uri,
			headers: headers,
			body: data,
			timeout: NETWORK_TIMEOUT,
			followAllRedirects: true,
			followOriginalHttpMethod: true,
			callback: callback
		});

		console.log('WebSocket[%d]:', ws.id);
		console.log('  Bots Connector POST %s', bot.uri);
		console.log('    Request Headers:\n%s', printObjectAsHeaders(headers, {indent: 6}));
		console.log('    Request Body:\n%s', printObject(body, 6));
	}

	function botsConnectorPostCallback(ws, uri, user, error, response, body) {
		if ( ! error) {
			botsConnectorPostSuccess(ws, uri, user, response, body);
		} else {
			botsConnectorPostError(ws, uri, user, error, response);
		}
	}

	function botsConnectorPostSuccess(ws, uri, user, response, body) {
		if (response.statusCode === 202) {
			console.log('WebSocket[%d]:', ws.id);
			console.log('  Bots Connector response: %d %s', ws.id, response.statusCode, response.statusMessage);
			console.log('    Response Headers:\n%s', printRawHeaders(response.rawHeaders, {indent: 6}));
			if (response.body) {
				console.log('    Response Body: %s', printObject(response.body, 6));
			}
		} else {
			sendSystemErrorMessage(ws, WS_ERROR_UNEXPECTED_BOTS_CONNECTOR_RESPONSE, {wsID: ws.id, statusCode: response.statusCode, statusMessage: response.statusMessage, userID: user.id, headers: printRawHeaders(response.rawHeaders, {indent: 4}), body: printObject(response.body, 4)});
		}
	}

	function botsConnectorPostError(ws, uri, user, error, response) {
		if (error.code === 'ETIMEDOUT') {
			botsConnectorPostTimeout(ws, uri, user, error);
		} else {
			sendSystemErrorMessage(ws, WS_ERROR_BOTS_CONNECTOR_ERROR, {wsID: ws.id, error: error, response: response, userID: user.id});
		}
	}

	function botsConnectorPostTimeout(ws, uri, user, error) {
		if (error.connect) {
			sendSystemErrorMessage(ws, WS_ERROR_BOTS_CONNECTOR_CONNECTION_TIMEOUT, {wsID: ws.id, userID: user.id});
		} else {
			sendSystemErrorMessage(ws, WS_ERROR_BOTS_CONNECTOR_READ_TIMEOUT, {wsID: ws.id, userID: user.id, ms: NETWORK_TIMEOUT});
		}
	}

	function wsMessageToUser(user, ws, msg, flags) {
		// TODO
		sendSystemErrorMessage(ws, WS_ERROR_UNSUPPORTED_FEATURE, {wsID: ws.id, feature: 'User Message', userID: user.id});
	}

	function wsMessageToChannel(user, ws, msg, flags) {
		// TODO
		sendSystemErrorMessage(ws, WS_ERROR_UNSUPPORTED_FEATURE, {wsID: ws.id, feature: 'Channel Message', userID: user.id});
	}

	function sendSystemErrorMessage(ws, error, view) {
		const message = mustache.render(error.template, view);
		console.log('ERROR [%d]: %s', error.code, message);
		const payload = {
			from: {
				type: 'system'
			},
			error: {
				code: error.code,
				message: message
			}
		};
		ws.send(JSON.stringify(payload));
	}

	function wsPing(ws, data, flags) {
		console.log('WebSocket[%d] ping:\n  Data: %s', ws.id, data);
	}

	function wsPong(ws, data, flags) {
		console.log('WebSocket[%d] pong:\n  Data: %s', ws.id, data);
	}

	function wsClose(ws, code, reason) {
		console.log('WebSocket[%d] close:\n  Code: %d\n  Reason: %s', ws.id, code, reason);

		const user = DB.users.get(ws.upgradeReq.userID);
		if ( ! user) {
			return console.log('WebSocket[%d] close: User not found: %s', ws.id, ws.upgradeReq.userID);
		}

		const index = user.webSockets.indexOf(ws);
		if (index === -1) {
			console.log('WebSocket[%d] close: Socket not found for user %s', ws.id, ws.upgradeReq.userID);
		} else {
			user.webSockets.splice(index, 1);
			if (user.webSockets.length === 0) {
				DB.users.delete(ws.upgradeReq.userID);
				saveDB();
				console.log('User removed: %s', ws.upgradeReq.userID);
			}
		}
	}

	function wsUnexpectedResponse(ws, request, response) {
		console.log('WebSocket[%d] unexpected response:\n  Request: %s\n  Response: %s', ws.id, printObject(request, 4), printObject(response, 4));
	}

	function wsError(ws, error) {
		console.log('WebSocket[%d] error: %s', ws.id, printObject(error, 2));
	}

	/********** Bots webhook callback **********/

	const botMessagesRoute = app.route('/bots/:botID/messages');

	botMessagesRoute.all(bodyParser.json({
		verify: verifyBotMessage
	}));

	/*
	 Simply store the raw buffer in the request for later verification.
	 */
	function verifyBotMessage(req, res, buf, encoding) {
		req.rawBody = buf;
		req.encoding = encoding;
	}

	botMessagesRoute.post(postBotMessage);

	function postBotMessage(req, res) {
		const botID = req.params.botID;
		const bot = DB.bots.get(botID);
		if ( ! bot) {
			return res.sendStatus(404);
		}

		if ( ! signatureIsValid(req, bot.secretKey)) {
			return res.sendStatus(403);
		}

		const reqBody = req.body || {};
		const userID = reqBody.userId;
		if ( ! userID) {
			return res.status(400).send('Missing User ID');
		}

		const user = DB.users.get(userID);
		if ( ! user) {
			return res.status(400).send('User not found: ' + userID);
		}

		res.sendStatus(200);

		const msg = {
			from: {
				type: 'bot',
				id: botID
			},
			body: reqBody
		};
		const data = JSON.stringify(msg);
		console.log('WebSocket send to user %s:\n  Data: %s', userID, data);
		for (let ws of user.webSockets) {
			console.log('  WebSocket[%d] send', ws.id);
			ws.send(data, _.partial(wsSendCallback, user, ws));
		}
	}

	function signatureIsValid(req, secretKey) {
		const headerSig = req.get(SIGNATURE);// + 'ff';
		if ( ! headerSig) {
			console.log('Missing signature');
			return false;
		}
		const calculatedSig = buildSignatureHeader(req.rawBody, secretKey);
		if (headerSig !== calculatedSig) {
			console.log('Invalid signature:');
			console.log('  Raw Body: \n"%s"', req.rawBody.toString(req.encoding));
			console.log('  Secret: %s', secretKey);
			console.log('  Calculated sig: %s', calculatedSig);
			console.log('  Header sig:     %s', headerSig);
			return false;
		}
		console.log('Valid signature: %s', headerSig);
		return true;
	}

	function wsSendCallback(user, ws, error) {
		if (error) {
			wsSendError(user, ws, error);
		}
	}

	function wsSendError(user, ws, error) {
		console.log('WebSocket[%d] send to user %s: Error: %s', ws.id, user.id, printObject(error, 2));

		const index = user.webSockets.indexOf(ws);
		if (index === -1) {
			console.log('WebSocket[%d] send to user %s: WebSocket not found: %s', ws.id, user.id);
		} else {
			// TODO
			// user.webSockets.splice(index, 1);
			// if (user.webSockets.length === 0) {
			// 	CHAT_SERVICE.users.delete(userID);
			// 	saveChatService();
			// }
		}
	}

	/********** Misc **********/

	/*
	 'buf' is a Buffer
	 'secret' is a String
	 */
	function buildSignatureHeader(buf, secret) {
		return 'sha256=' + buildSignature(buf, secret);
	}

	/*
	 'buf' is a Buffer
	 'secret' is a String
	 */
	function buildSignature(buf, secret) {
		const hmac = crypto.createHmac('sha256', Buffer.from(secret, 'utf8'));
		hmac.update(buf);
		return hmac.digest('hex');
	}

	function printObject(object, space) {
		if ( ! space) {
			space = 0;
		}
		let result = (space > 2) ? buildSpaces(space - 2) : '';
		result += JSON.stringify(object, null, space);
		if (space > 2) {
			const last = result.charAt(result.length - 1);
			result = result.substring(0, result.length - 1);
			result += buildSpaces(space - 2) + last;
		}
		return result;
	}

	function printObjectAsHeaders(object, options) {
		return printRawHeaders(convertObjectToRawHeaderArray(object), options);
	}

	function convertObjectToRawHeaderArray(object) {
		const result = [];
		for (var p in object) {
			if (object.hasOwnProperty(p)) {
				result.push(p);
				result.push(object[p]);
			}
		}
		return result;
	}

	function printRawHeaders(rawHeaders, options) {
		if ( ! options) {
			options = {};
		}
		const opts = {
			indent: options.indent || 0,
			valueSeparator: options.valueSeparator || ': ',
			headerSeparator: options.headerSeparator || '\n'
		};
		const headers = [];
		let i = 0;
		while (i < rawHeaders.length) {
			const header = {};
			header.name = rawHeaders[i];
			header.upperCaseName = header.name.toUpperCase();
			header.value = rawHeaders[i + 1];
			headers.push(header);
			i += 2;
		}
		let result = '';
		for (let header of headers.sort(compareHeaders)) {
			result += buildSpaces(opts.indent);
			result += header.name;
			result += opts.valueSeparator;
			result += header.value;
			result += opts.headerSeparator;
		}
		return result;
	}

	function compareHeaders(header1, header2) {
		return compareStrings(header1.upperCaseName, header2.upperCaseName);
	}

	function compareStrings(s1, s2) {
		return (s1 < s2) ? -1 : (s1 > s2) ? 1 : 0;
	}

	function buildSpaces(count) {
		switch (count) {
			case 0: return '';
			case 1: return ' ';
			case 2: return '  ';
			case 3: return '   ';
			case 4: return '    ';
		}
		let result = '';
		for (let i = 0; i < count; i++) {
			result += ' ';
		}
		return result;
	}

	/********** Constants **********/

	const NETWORK_TIMEOUT = 60000; // 60 seconds

	const CONTENT_TYPE = 'Content-Type';
	const APPLICATION_JSON_UTF8 = 'application/json; charset=utf-8';
	const SIGNATURE = 'X-Hub-Signature';

	const WS_ERROR_USER_NOT_FOUND                     = {code: 101, template: 'WebSocket[{{wsID}}] message from user {{userID}}: User not found'};
	const WS_ERROR_USER_WEB_SOCKET_NOT_FOUND          = {code: 102, template: 'WebSocket[{{wsID}}] message from user {{userID}}: WebSocket not found'};
	const WS_ERROR_MISSING_RECIPIENT_TYPE             = {code: 103, template: 'WebSocket[{{wsID}}] message from user {{userID}}: Missing recipient type'};
	const WS_ERROR_UNSUPPORTED_RECIPIENT_TYPE         = {code: 104, template: 'WebSocket[{{wsID}}] message from user {{userID}}: Unsupported recipient type: \'{{recipientType}}\''};
	const WS_ERROR_MISSING_BOT_ID                     = {code: 105, template: 'WebSocket[{{wsID}}] message from user {{userID}}: Missing bot ID'};
	const WS_ERROR_BOT_CHANNEL_NOT_FOUND              = {code: 106, template: 'WebSocket[{{wsID}}] message from user {{userID}}: Bot not found: \'{{botID}}\''};
	const WS_ERROR_UNEXPECTED_BOTS_CONNECTOR_RESPONSE = {code: 107, template: 'WebSocket[{{wsID}}] message from user {{userID}}: Unexpected Bots Connector response: {{statusCode}} {{statusMessage}}\n  Response Headers:\n{{headers}}\n  Response Body:\n{{body}}'};
	const WS_ERROR_BOTS_CONNECTOR_ERROR               = {code: 108, template: 'WebSocket[{{wsID}}] message from user {{userID}}: Bots Connector error: {{error}}\n  Response: {{response}}'};
	const WS_ERROR_BOTS_CONNECTOR_CONNECTION_TIMEOUT  = {code: 109, template: 'WebSocket[{{wsID}}] message from user {{userID}}: Bots Connector connection timeout'};
	const WS_ERROR_BOTS_CONNECTOR_READ_TIMEOUT        = {code: 110, template: 'WebSocket[{{wsID}}] message from user {{userID}}: Bots Connector read timeout: {{ms}} ms'};
	const WS_ERROR_USER_ID_MISMATCH                   = {code: 111, template: 'WebSocket[{{wsID}}] message from user {{userID}}: Payload user ID does not match sender ID: \'{{payloadUserID}}\''};

	const WS_ERROR_UNSUPPORTED_FEATURE                = {code: 999, template: 'WebSocket[{{wsID}}] message from user {{userID}}: Unsupported feature: {{feature}}'};

	/*app.locals.endpoints = [];
	app.locals.endpoints.push({
		name: 'chat',
		method: 'websocket',
		endpoint: '/ws'
	});*/
	app.locals.ui = {
		name: 'Admin UI',
		endpoint: '/admin'
	};

	return app;
}

module.exports = {
	init: init
};
