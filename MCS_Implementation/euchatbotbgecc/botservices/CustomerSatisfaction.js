"use strict";

var log4js = require('log4js');
var logger = log4js.getLogger();
var Analytics = require('./LogAnalytics');

module.exports = {

    metadata: function metadata() {
        return {
            "name": "CustomerSatisfaction",
            "properties": {
                "SatisfactionRate": { "type": "string", "required": true },
                "PhoneNumber": { "type": "string", "required": false },
                "AccountNumber": { "type": "string", "required": false }
            },
            "supportedActions": []
        };
    },

    invoke: function invoke(conversation, done) {
        var PhoneNumber = conversation.properties().PhoneNumber;
        var AccountNumber = conversation.properties().AccountNumber;
        var SatisfactionRate = conversation.properties().SatisfactionRate;
        var mobileSdk = conversation.oracleMobile;

        console.log("PhoneNumber :" + PhoneNumber + "+ AccountNumber :" + AccountNumber + "SatisfactionRate :" + SatisfactionRate);
        conversation.transition();

        var isWebhook = conversation._request.message.channelConversation.type == "webhook";
        var clientType = isWebhook ? conversation._request.message.payload.profile.clientType : "facebook";

        var properties = {
           "Satisfaction": SatisfactionRate.toString()
        };
        Analytics.postEvent(conversation.oracleMobile.analytics, "CustomerSurvey", properties)
           .then(function (result) {
			   console.log("LogAnalytics: success posting analytics: " + JSON.stringify(result));
                done();
            }, function (error) {
               console.warn('LogAnalytics: error posting analytics.', error.statusCode, error.error);
               done();
            }); 
    }
}