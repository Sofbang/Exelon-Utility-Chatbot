const Joi = require('joi');
const MessageModel = require('../lib/messageModel/MessageModel.js')(Joi);
const messageModelUtil = require('../lib/messageModel/messageModelUtil.js');
const botUtil = require('../lib/util/botUtil.js');

function getAlexaApp(appConfig, opco, webhookUtil, PubSub, logger) {

    var alexa = require("alexa-app");
    var _ = require("underscore");

    var metadata = appConfig.channels[opco].alexa;

    if (metadata.channelUrl && metadata.channelSecretKey) {
        logger.info("Alexa " + opco + " - Using Channel: ", metadata.channelUrl);
    }
    
    // compile the list of actions, global actions and other menu options
    function menuResponseMap(resp, card) {
        var responseMap = {};
        function addToMap(label, type, action) {
            responseMap[label] = { type: type, action: action };
        }
        if (!card) {
            if (resp.globalActions && resp.globalActions.length > 0) {
                resp.globalActions.forEach(function (gAction) {
                    addToMap(gAction.label, 'global', gAction);
                });
            }
            if (resp.actions && resp.actions.length > 0) {
                resp.actions.forEach(function (action) {
                    addToMap(action.label, 'message', action);
                });
            }
            if (resp.type === 'card' && resp.cards && resp.cards.length > 0) {
                resp.cards.forEach(function (card) {
                    //special menu option to navigate to card detail
                    addToMap('Card ' + card.title, 'card', { type: 'custom', value: { type: 'card', value: card } });
                });
            }
        } else {
            if (card.actions && card.actions.length > 0) {
                card.actions.forEach(function (action) {
                    addToMap(action.label, 'message', action);
                });
            }
            //special menu option to return to main message from the card
            addToMap('Return', 'cardReturn', { type: 'custom', value: { type: 'messagePayload', value: resp } });
        }
        return responseMap;
    }

    function randomIntInc(low, high) {
        return Math.floor(Math.random() * (high - low + 1) + low);
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
            var additionalProperties = {
                "profile": {
                    "clientType": "alexa"
                }
            };
            var sendToAlexa = function () {
                if (!respondedToAlexa) {
                    respondedToAlexa = true;
                    logger.info('Prepare to send to Alexa');
                    alexa_res.send();
                    PubSub.unsubscribe(userIdTopic);
                } else {
                    logger.info("Already sent response");
                }
            };
            // compose text response to alexa, and also save botMessages and botMenuResponseMap to alexa session so they can be used to control menu responses next
            var navigableResponseToAlexa = function (resp) {
                var respModel;
                if (resp.messagePayload) {
                    respModel = new MessageModel(resp.messagePayload);
                } else {
                    // handle 1.0 webhook format as well
                    respModel = new MessageModel(resp);
                }
                var botMessages = session.get("botMessages");
                if (!Array.isArray(botMessages)) {
                    botMessages = [];
                }
                var botMenuResponseMap = session.get("botMenuResponseMap");
                if (typeof botMenuResponseMap !== 'object') {
                    botMenuResponseMap = {};
                }
                botMessages.push(respModel.messagePayload());
                session.set("botMessages", botMessages);
                session.set("botMenuResponseMap", Object.assign(botMenuResponseMap || {}, menuResponseMap(respModel.messagePayload())));
                alexa_res.say(messageModelUtil.convertRespToText(respModel.messagePayload()));
            };
            var commandResponse = function (msg, data) {
                logger.info('Received callback message from webhook channel');
                var resp = data;
                console.log("test" + resp.messagePayload.text.includes("address"));
                if (resp.messagePayload.text.includes("address")) {
                    var re = /([0-9])/g;
                    resp.messagePayload.text = resp.messagePayload.text.replace(re, '$& ');
                }
                if (resp.messagePayload.text.includes("bge.com")) {
                    resp.messagePayload.text = resp.messagePayload.text.replace("bge.com", 'b g e.com');
                }
                if (resp.messagePayload.text.includes("comed.com")) {
                    resp.messagePayload.text = resp.messagePayload.text.replace("comed.com", 'com ed.com');
                }
                logger.info('Parsed Message Body:', resp);
                if (!respondedToAlexa) {
                    navigableResponseToAlexa(resp);
                    if (resp.messagePayload.text.includes("feedback")) {
                        alexa_res.shouldEndSession(true);
                    }
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
            var sendMessageToBot = function (messagePayload) {
                return function () {
                    var token = PubSub.subscribe(userIdTopic, commandResponse);
                    webhookUtil.messageToBotWithProperties(metadata.channelUrl, metadata.channelSecretKey, userId, messagePayload, additionalProperties, function (err) {
                        if (err) {
                            logger.info("Failed sending message to Bot");
                            alexa_res.say("Failed sending message to Bot.  Please review your bot configuration.");
                            alexa_res.send();
                            PubSub.unsubscribe(userIdTopic);
                        }
                    });
                };
            };
            var handleMenuInput = function (input) {
                var botMenuResponseMap = session.get("botMenuResponseMap");
                if (typeof botMenuResponseMap !== 'object') {
                    botMenuResponseMap = {};
                }
                var menuResponse = botUtil.approxTextMatch(input, _.keys(botMenuResponseMap), true, true, 7);
                //if command is a menu action
                if (menuResponse) {
                    var menu = botMenuResponseMap[menuResponse.item];
                    // if it is global action or message level action
                    if (['global', 'message'].includes(menu.type)) {
                        var action = menu.action;
                        session.set("botMessages", []);
                        session.set("botMenuResponseMap", {});
                        if (action.type == 'postback') {
                            var postbackMsg = MessageModel.postbackConversationMessage(action.postback);
                            sendMessageToBot(postbackMsg)();
                        } else if (action.type == 'location') {
                            logger.info('Sending a predefined location to bot');
                            sendMessageToBot(MessageModel.locationConversationMessage(37.2900055, -121.906558))();
                        }
                        // if it is navigating to card detail
                    } else if (menu.type === 'card') {
                        var selectedCard;
                        if (menu.action && menu.action.type && menu.action.type === 'custom' && menu.action.value && menu.action.value.type === 'card') {
                            selectedCard = _.clone(menu.action.value.value);
                        }
                        if (selectedCard) {
                            var botMessages = session.get("botMessages");
                            if (!Array.isArray(botMessages)) {
                                botMessages = [];
                            }
                            var selectedMessage;
                            if (botMessages.length === 1) {
                                selectedMessage = botMessages[0];
                            } else {
                                selectedMessage = _.find(botMessages, function (botMessage) {
                                    if (botMessage.type === 'card') {
                                        return _.some(botMessage.cards, function (card) {
                                            return (card.title === selectedCard.title);
                                        });
                                    } else {
                                        return false;
                                    }
                                });
                            }
                            if (selectedMessage) {
                                session.set("botMessages", [selectedMessage]);
                                session.set("botMenuResponseMap", menuResponseMap(selectedMessage, selectedCard));
                                _.defer(function () {
                                    alexa_res.say(messageModelUtil.cardToText(selectedCard, 'Card'));
                                    alexa_res.send();
                                });
                            }
                        }
                        // if it is navigating back from card detail
                    } else if (menu.type === 'cardReturn') {
                        var returnMessage;
                        if (menu.action && menu.action.type && menu.action.type === 'custom' && menu.action.value && menu.action.value.type === 'messagePayload') {
                            returnMessage = _.clone(menu.action.value.value);
                        }
                        if (returnMessage) {
                            session.set("botMessages", [returnMessage]);
                            session.set("botMenuResponseMap", menuResponseMap(returnMessage));
                            _.defer(function () {
                                alexa_res.say(messageModelUtil.convertRespToText(returnMessage));
                                alexa_res.send();
                            });
                        }
                    }
                    return true;
                } else {
                    return false;
                }
            };
            // if it is not a menu action
            if (!handleMenuInput(command)) {
                var commandMsg = MessageModel.textConversationMessage(command);
                sendMessageToBot(commandMsg)();
            }
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
        var welcomeText = "How may I help you today? You can Check Outage Status, Report an Outage or Check Account Balance. Please pick one option.";
        alexa_res.say("Welcome to " + opco + ". " + welcomeText);
        alexa_res.shouldEndSession(false);
    }

    function handlePreEvent(alexa_req, alexa_res, alexa_type) {
        logger.debug(alexa_req.data.session.application.applicationId);
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