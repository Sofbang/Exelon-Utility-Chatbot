const alexa = require("alexa-app");
const _ = require("underscore");
const express = require('express');
const bodyParser = require('body-parser');
const PubSub = require('pubsub-js');
const webhookUtil = require('../bots-js-utils/webhook/webhookUtil.js');

PubSub.immediateExceptions = true;

function randomIntInc(low, high) {
    return Math.floor(Math.random() * (high - low + 1) + low);
}

function init(config) {

    var app = express();
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(bodyParser.json());
    var logger = (config ? config.logger : null);
    if (!logger) {
      const log4js = require('log4js');
      logger = log4js.getLogger();
      logger.setLevel('INFO');
      log4js.replaceConsole(logger);
    }

    //replace these settings to point to your webhook channel
    var metadata = {
        waitForMoreResponsesMs: 200,
        //amzn_appId: "amzn1.ask.skill.4ca965fc-0a84-48ef-8b0c-ba7f21eb7743",
	  // channelSecretKey: 'Vu8YgKZLaxj0QphhrBuqPILrAyJEq5ye',
        //channelUrl: 'http://bots-connectors:8000/connectors/v1/tenants/chatbot-tenant/listeners/webhook/channels/6B7DB2BA-CA8F-40FD-9B56-820F6A348EFB'
		
		amzn_appId: "amzn1.ask.skill.78de290d-b2ef-4003-89a5-ebaecbfacbf6",
       channelSecretKey: 'Vu8YgKZLaxj0QphhrBuqPILrAyJEq5ye',
		channelUrl: 'http://bots-connectors:8000/connectors/v1/tenants/chatbot-tenant/listeners/webhook/channels/6B7DB2BA-CA8F-40FD-9B56-820F6A348EFB'
    };

    if (metadata.channelUrl && metadata.channelSecretKey) {
        logger.info('Alexa comed - Using Channel:', metadata.channelUrl);
    }

    function convertRespToSpeech(resp) {
        var sentence = "";
		//console.info("resp: " +resp);
        if (resp.text) {
            sentence = resp.text;
        }
        if (resp.choices) {
            if (resp.choices.length > 0) {
                sentence += '  The following are your choices: ';
            }
            _.each(resp.choices, function(choice) {
                sentence = sentence + choice + ', ';
            });
        }
        if (resp.attachment) {
            sentence += "An attachment of type " + resp.attachment.type + " is returned."
        }
        return sentence;
    }

    app.post('/comedWebhook/messages', bodyParser.json(), function(req, res) {
        //logger.info("Message from webhook channel", req.body);
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

    var alexa_app = new alexa.app("app");

    alexa_app.intent("CommandBot", {},
        function(alexa_req, alexa_res) {
            var command = alexa_req.slot("command");
            var session = alexa_req.getSession();
            var userId = session.get("userId");
            if (!userId) {
                userId = randomIntInc(1000000, 9999999).toString();
                session.set("userId", userId);
            }
            alexa_res.shouldEndSession(false);
            if (metadata.channelUrl && metadata.channelSecretKey && userId && command) {
                const userIdTopic = userId;
                var respondedToAlexa = false;
                var sendToAlexa = function() {
                    if (!respondedToAlexa) {
                        respondedToAlexa=true;
                        alexa_res.send();
                        logger.info('Prepare to send to Alexa');
                        PubSub.unsubscribe(userIdTopic);
                    } else {
                        logger.info("Already sent response");
                    }
                }
                var commandResponse = function(msg, data) {
                    logger.info('Received callback message from webhook channel');
                    var resp = data;
					console.log("test"+resp.text.includes("address"));
					if(resp.text.includes("address")){
					var re = /([0-9])/g; 
					resp.text = resp.text.replace(re, '$& ');
					}
                    logger.info('Parsed Message Body:', resp);
                    if (!respondedToAlexa) {
                        alexa_res.say(convertRespToSpeech(resp));
                    } else {
                        logger.info("Already processed response");
                        return;
                    }
                    if (metadata.waitForMoreResponsesMs) {
                        _.delay(function() {
                            sendToAlexa();
                        }, metadata.waitForMoreResponsesMs);
                    }
                };
                var token = PubSub.subscribe(userIdTopic, commandResponse);
                var additionalProperties = {
                  "userProfile": {
                    "clientType": "alexa"
                  }
                };
                webhookUtil.messageToBotWithProperties(metadata.channelUrl, metadata.channelSecretKey, userId, command, additionalProperties, function(err) {
                //webhookUtil.messageToBot(metadata.channelUrl, metadata.channelSecretKey, userId, command, function(err) {
                    if (err) {
                        logger.info("Failed sending message to Bot");
                        alexa_res.say("Failed sending message to Bot.  Please review your bot configuration.");
                        alexa_res.send();
                        PubSub.unsubscribe(userIdTopic);
                    }
                });
            } else {
                _.defer(function() {
                    alexa_res.say("I don't understand. Could you please repeat what you want?");
                    alexa_res.send();
                });
            }
            return false;
        }
    );

    alexa_app.intent("AMAZON.StopIntent", {},
        function(alexa_req, alexa_res) {
            alexa_res.shouldEndSession(true);
        }
    );

    alexa_app.launch(function(alexa_req, alexa_res) {
        var session = alexa_req.getSession();
        session.set("startTime", Date.now());
        alexa_res.say("Welcome to comed. ");
    });

    alexa_app.pre = function(alexa_req, alexa_res, alexa_type) {
      logger.debug(alexa_req.data.session.application.applicationId);
      logger.info(alexa_req.data.session.application.applicationId);
      // change the application id
      if (alexa_req.data.session.application.applicationId != metadata.amzn_appId) {
        logger.error("fail as application id is not valid");
        alexa_res.fail("Invalid applicationId");
      }
        logger.info(JSON.stringify(alexa_req.data, null, 4));
        if (!metadata.channelUrl || !metadata.channelSecretKey) {
            var message = "The comed cannot respond.  Please check the channel and secret key configuration.";
            alexa_res.fail(message);
            logger.info(message);
        }
    };
    alexa_app.express(app, "/", true);

    app.locals.endpoints = [];
    app.locals.endpoints.push({
      name: 'webhook',
      method: 'POST',
      endpoint: '/comedWebhook/messages'
    });
    app.locals.endpoints.push({
      name: 'alexa',
      method: 'POST',
      endpoint: '/app'
    });

    return app;
}

module.exports = {
    init: init
};
