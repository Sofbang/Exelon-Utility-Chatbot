"use strict";

var log4js = require('log4js');
var logger = log4js.getLogger();
var ExelonService = require('./ExelonService');
var moment = require('moment');

module.exports = {

    metadata: function metadata() {
        return {
            "name": "CheckBalance",
            "properties": {
                "PhoneNumber": { "type": "string", "required": true },
                "Identifier": { "type": "string", "required": true },
                "AccountNumber": { "type": "string", "required": false }
            },
            "supportedActions": []
        };
    },

    invoke: function invoke(conversation, done) {
        var PhoneNumber = conversation.properties().PhoneNumber;
        var AccountNumber = conversation.properties().AccountNumber;
        var Identifier = conversation.properties().Identifier;
        var mobileSdk = conversation.oracleMobile;
        var isWebhook = conversation._request.message.channelConversation.type == "webhook";
        var clientType = isWebhook ? conversation._request.message.payload.profile.clientType : false;
        console.log("Account Number is : " + AccountNumber + " Phone Number is : " + PhoneNumber + " and Identifier is : " + Identifier);
        ExelonService.checkBalance(mobileSdk, AccountNumber, PhoneNumber, Identifier).then(function (response) {
            console.log("response :" + JSON.stringify(response));
            var addressFound;
            var servicesDown;
            if (response.success) {
                if (response.data.address) {
                    servicesDown = "false";
                    addressFound = "true";
                    conversation.variable("multipleAddressFound", "false");
                    if (clientType && (clientType.toLowerCase() == "google" || clientType.toLowerCase() == "alexa")) {
                        conversation.variable("checkBalance_MaskedAddress", "My records indicate that the address associated with this account begins with " + ((response.data.address).replace(/\*/g, '')));
                    } else {
                        conversation.variable("checkBalance_MaskedAddress", "My records indicate that the address associated with this account begins with " + response.data.address);
                    }
                    conversation.variable("checkBalance_AccountInfo", "You have $" + response.data.remainingBalanceDue + " due on " + moment(response.data.dueByDate).format("MMMM DD, YYYY") + ". For a full breakdown of your bill, please login to My Account at bge.com or call us at 1-800-685-0123.");
                } else {
                    servicesDown = "false";
                    addressFound = "false";
                }
            } else {
                var cause = response.meta ? response.meta : (response.error ? response.error : response.code);
                var ERROR_CODE = cause ? (cause.code ? cause.code : cause) : "";
                console.log("ERROR_CODE: " + ERROR_CODE);
                switch (ERROR_CODE) {
                    case "FN-MULTIPLE-ACCOUNTS":
                        addressFound = "true";
                        servicesDown = "false";
                        conversation.variable("multipleAddressFound", "true");
                        break;
                    case "FN-ACCT-NOTFOUND":
                        addressFound = "false";
                        servicesDown = "false";
                        break;
                    case "TC-ACCT-CLOSED":
                        addressFound = "false";
                        servicesDown = "false";
                        break;
                    case "BWENGINE-100029":
                        addressFound = "false";
                        servicesDown = "true";
                        conversation.variable("servicesDownMessage", "Turn off the utility chatbot at this time. ");
                        break;
                    case "ETIMEDOUT":
                        addressFound = "false";
                        servicesDown = "true";
                        conversation.variable("servicesDownMessage", "Turn off the utility chatbot at this time. ");
                        break;
                    default:
                        addressFound = "false";
                        servicesDown = "true";
                        conversation.variable("servicesDownMessage", "I'm not able to complete your request right now. Please try again later.");
                        break;
                }
            }
            conversation.variable("servicesDown", servicesDown);
            conversation.variable("addressFound", addressFound);
            conversation.transition();
            done();
        }).catch(function (err) {
            conversation.variable("servicesDown", "true");
            conversation.variable("servicesDownMessage", "I'm not able to complete your request right now. Please try again later.");
            conversation.transition();
            done();
            console.log("error not handled at checkBalance service :" + err);
        });
    }

}