"use strict";

var log4js = require('log4js');
var logger = log4js.getLogger();
var moment = require('moment-timezone');
var myTimeZone = "America/Chicago"


var ExelonService = require('./ExelonService');

module.exports = {

    metadata: function metadata() {
        return {
            "name": "ReportOutage",
            "properties": {
                "PhoneNumber": { "type": "string", "required": true },
                "AccountNumber": { "type": "string", "required": true },
                "OutageType": { "type": "string", "required": true }
            },
            "supportedActions": []
        };
    },

    invoke: function invoke(conversation, done) {
        var PhoneNumber = conversation.properties().PhoneNumber;
        var AccountNumber = conversation.properties().AccountNumber;
        var OutageType = conversation.properties().OutageType;

        if (OutageType.toLowerCase() == 'full') {
            OutageType = 'allOut';
        }
        else if (OutageType.toLowerCase() == 'partial') {
            OutageType = 'partOut';
        }

        console.log("in report outage custom component phone number is :" + PhoneNumber);
        console.log("in report outage custom component account number is :" + AccountNumber);
        console.log("in report outage custom componentoutage typer is :" + OutageType);
        var mobileSdk = conversation.oracleMobile;
        var reportOutage = ExelonService.reportOutage(mobileSdk, AccountNumber, PhoneNumber, OutageType);
        reportOutage
            .then(function (response) {
                console.log(response);
                if (response.success) {
                    conversation.variable("outageReportProgress", 'Thank you. Your outage has been reported. You can also find the outage map at: comed.com/map or text STAT to COMED or 26633.');
                }
                else {
                    logger.debug('reportOutage: report outage failed!');
                    conversation.variable("outageReportProgress", "I'm not able to complete your request right now. Please try again later.");
                }
                conversation.transition();
                done();
            })
            .catch(function (e) {
                console.log("error in catch" + e);
                conversation.variable("outageReportProgress", "I'm not able to complete your request right now. Please try again later.");
                conversation.transition();
                done();
            });
    }
};
