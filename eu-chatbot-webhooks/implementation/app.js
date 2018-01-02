const express = require('express');
const bodyParser = require('body-parser');
const PubSub = require('pubsub-js');
const WebSocket = require('ws');
const botUtil = require('../lib/util/botUtil');

PubSub.immediateExceptions = true;

function init(config) {

    var app = express();
    var alexaRouter = express.Router();
    alexaRouter.use(bodyParser.json());
    app.use('/alexa', alexaRouter);
    app.use(express.static('implementation'));
    var webhookUtil = require('../lib/webhook/webhookUtil.js');
    var appConfig = require('./botConfig').get();
    var logger = (config ? config.logger : null);
    if (!logger) {
        const log4js = require('log4js');
        logger = log4js.getLogger();
        logger.setLevel('INFO');
        log4js.replaceConsole(logger);
    }

    app.post('/webhooks/:opco/messages', bodyParser.json({
        verify: webhookUtil.bodyParserRawMessageVerify
    }), function (req, res) {
        var opco = req.params.opco.toUpperCase();
        var metadata = appConfig.channels[opco].alexa;
        logger.info("Message from webhook channel", req.body);
        const userID = req.body.userId;
        if (!userID) {
            return res.status(400).send('Missing User ID');
        }
        if (webhookUtil.verifyMessageFromBot(req.get('X-Hub-Signature'), req.rawBody, req.encoding, metadata.channelSecretKey)) {
            res.sendStatus(200);
            logger.info("Publishing to", userID);
            PubSub.publish(userID, req.body);
        } else {
            res.sendStatus(403);
        }
    });

    var alexa_bge_app = require('./eu_alexa').getAlexaApp(appConfig, "BGE", webhookUtil, PubSub, logger);
    alexa_bge_app.express(alexaRouter, "/", true);

    var alexa_comed_app = require('./eu_alexa').getAlexaApp(appConfig, "COMED", webhookUtil, PubSub, logger);
    alexa_comed_app.express(alexaRouter, "/", true);

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
        console.log('Body received: ' + JSON.stringify(req.body));
        speech = req.body.result.parameters.echoText;
        if (speech && speech != ""){
            var socketUrl = "wss://" + appConfig.socketHost + "/chat/ws?user=" + sessionId;
            ws = new WebSocket(socketUrl);

            ws.addEventListener('open', function (event) {
                speech = botUtil.trimIfHasNumber(speech);
                var message = {
                    "to": {
                        "type": "bot",
                        "id": botID
                    },
                    "messagePayload": {
                        "type": "text",
                        "text": speech
                    },
                    "userProfile": { "clientType": "google" },
                    "profile": { "clientType": "google" }
                };

                console.log(JSON.stringify(message));
                ws.send(JSON.stringify(message));
            });
            ws.addEventListener('message', function (event) {
                var displayText;
                try {
                    var msg = JSON.parse(event.data);
                    ws.close();
                    if (msg.body.messagePayload.actions) {
                        var choices = msg.body.messagePayload.actions.map(function (action) { return action.label });
                        displayText = msg.body.messagePayload.text + ' ' + choices;
                    } else {
                        displayText = msg.body.messagePayload.text;
                    }
                    var speech = displayText;
                    console.log("Includes 'address': " + msg.body.messagePayload.text.includes("address"));
                    if (speech.includes("address")) {
                        var re = /([0-9])/g;
                        speech = speech.replace(re, '$& ');
                    }
                    console.log("displayText: " + JSON.stringify(displayText));
                    console.log("speech: " + JSON.stringify(speech));
                } catch (e) {
                    displayText = "I'm not able to complete your request right now. Please try again later.";
                } finally {
                    return res.json({
                        speech: speech,
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
        } else {
            return res.json({
                speech: speech,
                displayText: displayText,
                source: 'google-webhook'
            });
        }
    }

    app.post('/comed/echo', bodyParser.json({
        verify: webhookUtil.bodyParserRawMessageVerify
    }), function (req, res) {
        var botID = appConfig.channels.COMED.google.id;
        handleEcho(req, res, botID);
    });

    app.post('/bge/echo', bodyParser.json({
        verify: webhookUtil.bodyParserRawMessageVerify
    }), function (req, res) {
        var botID = appConfig.channels.BGE.google.id;
        handleEcho(req, res, botID);
    });

    return app;
}

module.exports = {
    init: init
};
