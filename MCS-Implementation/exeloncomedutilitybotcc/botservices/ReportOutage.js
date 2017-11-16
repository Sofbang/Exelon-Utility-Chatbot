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

        if (OutageType == 'Full') {
            OutageType = 'allOut';
        }
        else if (OutageType == 'Partial') {
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
                console.log(response.data.etr);
                conversation.variable("outageReportProgress", 'Thank you. Your outage has been reported. You can also find the outage map at: comed.com/map or text STAT to COMED or 26633.');
                if(response.data.etr){
                    if(conversation.channelType == "webhook" && conversation.channelId == "23349155-FCD6-4726-BE43-EB92F4FF140F"){
                        conversation.variable("provideETR", 'As of '+moment().tz(myTimeZone).format("hh:mm a")+' on '+moment().tz(myTimeZone).format("MMMM DD YYYY") +' I see that there is a power outage in your area. The cause of the outage is under investigation and I apologize for any inconvenience. I currently estimate your power will be restored by '+moment(response.data.etr).format("MMMM DD YYYY")+' at '+moment(response.data.etr).format("hh:mm a")+'. You can also find the outage map at: comed.com/map or text STAT to COMED or 26633.');
                    }
                    else{
                        conversation.variable("provideETR", 'As of '+moment().tz(myTimeZone).format("hh:mm a")+' on '+moment().tz(myTimeZone).format("MM/DD/YYYY") +' I see that there is a power outage in your area. The cause of the outage is under investigation and I apologize for any inconvenience. I currently estimate your power will be restored by '+moment(response.data.etr).format("MM, DD, YYYY")+' at '+moment(response.data.etr).format("hh:mm a")+'. You can also find the outage map at: comed.com/map or text STAT to COMED or 26633.');
                    }
                }else{
                    if(conversation.channelType == "webhook" && conversation.channelId == "23349155-FCD6-4726-BE43-EB92F4FF140F"){
                        conversation.variable("provideETR", 'As of '+moment().tz(myTimeZone).format("hh:mm a")+' on '+moment().tz(myTimeZone).format("MMMM DD YYYY") +' I see that there is a power outage in your area. The cause of the outage is under investigation and I apologize for any inconvenience. I am currently in the process of estimating when your service will be restored. You can also find the outage map at: comed.com/map or text STAT to COMED or 26633.');
                    }
                    else{
                        conversation.variable("provideETR", 'As of '+moment().tz(myTimeZone).format("hh:mm a")+' on '+moment().tz(myTimeZone).format("MM/DD/YYYY") +' I see that there is a power outage in your area. The cause of the outage is under investigation and I apologize for any inconvenience. I am currently in the process of estimating when your service will be restored. You can also find the outage map at: comed.com/map or text STAT to COMED or 26633.');
                    }
                }
            }
            else {
                logger.debug('reportOutage: report outage failed!');
                conversation.variable("outageReportProgress", "I'm not able to complete your request right now. Please try again later.");
            }
            conversation.transition();
            done();
        })
    .catch(function (e) {
        console.log(e);
        conversation.transition();
        done();
    });
    }
};
