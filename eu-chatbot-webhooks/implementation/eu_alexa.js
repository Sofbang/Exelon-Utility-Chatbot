
function getAlexaApp(appConfig, opco, webhookUtil, PubSub, logger) {

    var alexa = require("alexa-app");
    var _ = require("underscore");

    var metadata = appConfig.channels[opco].alexa;

    if (metadata.channelUrl && metadata.channelSecretKey) {
        logger.info("Alexa " + opco + " - Using Channel: ", metadata.channelUrl);
    }

    function randomIntInc(low, high) {
        return Math.floor(Math.random() * (high - low + 1) + low);
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
            _.each(resp.choices, function (choice) {
                sentence = sentence + choice + ', ';
            });
        }
        if (resp.attachment) {
            sentence += "An attachment of type " + resp.attachment.type + " is returned."
        }
        return sentence;
    }

    function handleCommandBot(alexa_req, alexa_res) {
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
            var sendToAlexa = function () {
                if (!respondedToAlexa) {
                    respondedToAlexa = true;
                    alexa_res.send();
                    logger.info('Prepare to send to Alexa');
                    PubSub.unsubscribe(userIdTopic);
                } else {
                    logger.info("Already sent response");
                }
            }
            var commandResponse = function (msg, data) {
                logger.info('Received callback message from webhook channel');
                var resp = data;
                console.log("test" + resp.text.includes("address"));
                if (resp.text.includes("address")) {
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
                    _.delay(function () {
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
            webhookUtil.messageToBotWithProperties(metadata.channelUrl, metadata.channelSecretKey, userId, command, additionalProperties, function (err) {
                //webhookUtil.messageToBot(metadata.channelUrl, metadata.channelSecretKey, userId, command, function(err) {
                if (err) {
                    logger.info("Failed sending message to Bot");
                    alexa_res.say("Failed sending message to Bot.  Please review your bot configuration.");
                    alexa_res.send();
                    PubSub.unsubscribe(userIdTopic);
                }
            });
        } else {
            _.defer(function () {
                alexa_res.say("I don't understand. Could you please repeat what you want?");
                alexa_res.send();
            });
        }
        return false;
    }

    function handleStopIntent(alexa_req, alexa_res) {
        alexa_res.shouldEndSession(true);
    };

    function handleLaunchEvent(alexa_req, alexa_res) {
        var session = alexa_req.getSession();
        session.set("startTime", Date.now());
        alexa_res.say("Welcome to " + opco + ".");
    }

    function handlePreEvent(alexa_req, alexa_res, alexa_type) {
        logger.debug(alexa_req.data.session.application.applicationId);
        logger.info(alexa_req.data.session.application.applicationId);
        // change the application id
        if (alexa_req.data.session.application.applicationId != metadata.amzn_appId) {
            logger.error("fail as application id is not valid");
            alexa_res.fail("Invalid applicationId");
        }
        logger.info(JSON.stringify(alexa_req.data, null, 4));
        if (!metadata.channelUrl || !metadata.channelSecretKey) {
            var message = "The " + opco + " cannot respond.  Please check the channel and secret key configuration.";
            alexa_res.fail(message);
            logger.info(message);
        }
    }

    var alexa_app = new alexa.app("app/" + opco.toLowerCase());
    alexa_app.intent("CommandBot", {}, handleCommandBot);
    alexa_app.intent("AMAZON.StopIntent", {}, handleStopIntent);
    alexa_app.launch(handleLaunchEvent);
    alexa_app.pre = handlePreEvent;

    return alexa_app;
};

module.exports = {
    getAlexaApp: getAlexaApp
};