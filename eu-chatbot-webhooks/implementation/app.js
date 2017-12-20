const express = require('express');
const bodyParser = require('body-parser');
const PubSub = require('pubsub-js');
const WebSocket = require('ws');

PubSub.immediateExceptions = true;

function init(config) {

    var app = express();
    app.use(express.static('implementation'));
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    var webhookUtil = require('./webhookUtil');
    var appConfig = require('./botConfig').get();
    var logger = (config ? config.logger : null);
    if (!logger) {
        const log4js = require('log4js');
        logger = log4js.getLogger();
        logger.setLevel('INFO');
        log4js.replaceConsole(logger);
    }

    app.post('/webhooks/:opco/messages', bodyParser.json(), function (req, res) {
        var opco = req.params.opco.toUpperCase();
        var metadata = appConfig.channels[opco].alexa;

        const userID = req.body.userId;
        if (!userID) {
            return res.status(400).send('Missing User ID');
        }
        if (webhookUtil.verifyMessageFromBot(req.get('X-Hub-Signature'), req.body, metadata.channelSecretKey)) {
            res.sendStatus(200);
            logger.info("Publishing to", userID);
            PubSub.publish(userID, req.body);
        } else {
            res.sendStatus(403);
        }
    });

    var alexa_bge_app = require('./eu_alexa').getAlexaApp(appConfig, "BGE", webhookUtil, PubSub, logger);
    alexa_bge_app.express(app, "/", true);

    var alexa_comed_app = require('./eu_alexa').getAlexaApp(appConfig, "COMED", webhookUtil, PubSub, logger);
    alexa_comed_app.express(app, "/", true);

    app.locals.endpoints = [];
    app.locals.endpoints.push({
        name: 'alexaBge',
        method: 'POST',
        endpoint: '/app/bge'
    });
    app.locals.endpoints.push({
        name: 'alexaComed',
        method: 'POST',
        endpoint: '/app/comed'
    });

    // Following code handles bot for Google
    function handleEcho(req, res, botID) {
        sessionId = req.body.sessionId;
        console.log('google session ' + req.body.sessionId);
        speech = req.body.result && req.body.result.parameters && req.body.result.parameters.echoText ? req.body.result.parameters.echoText : "Hello";
        var socketUrl = "wss://" + appConfig.socketHost + "/chat/ws?user=" + sessionId;
        ws = new WebSocket(socketUrl);
        ws.addEventListener('open', function (event) {

            var message = {
                to: {
                    type: 'bot',
                    id: botID
                },
                text: speech
            };

            console.log(JSON.stringify(message));
            ws.send(JSON.stringify(message));
        });
        ws.addEventListener('message', function (event) {
            var displayText;
            try {
                var msg = JSON.parse(event.data);
                console.log(JSON.stringify(msg));
                ws.close();
                if (msg.body.choices) {
                    displayText = msg.body.text + msg.body.choices;
                } else {
                    displayText = msg.body.text;
                }
            } catch (e) {
                displayText = "I'm not able to complete your request right now. Please try again later.";
            } finally {
                return res.json({
                    speech: displayText,
                    displayText: displayText,
                    source: 'google-webhook'
                });
            }
        });
        ws.addEventListener('close', function (event) {
            ws = null;
        });
        ws.addEventListener('error', function (event) {
        });
    }

    app.post('/comed/echo', function (req, res) {
        var botID = appConfig.channels.COMED.google.id;
        handleEcho(req, res, botID);
    });

    app.post('/bge/echo', function (req, res) {
        var botID = appConfig.channels.BGE.google.id;
        handleEcho(req, res, botID);
    });

    return app;
}

module.exports = {
    init: init
};
