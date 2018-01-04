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
        console.log("Account Number is : "+AccountNumber+" Phone Number is : "+PhoneNumber+" and Identifier is : "+Identifier);
        ExelonService.checkBalance(mobileSdk, AccountNumber, PhoneNumber, Identifier).then(function (response) {
            console.log("response :"+JSON.stringify(response));
            if(response.success){
                    conversation.variable("servicesDown","false");
                    conversation.variable("addressFound","true");
                    conversation.variable("multipleAddressFound","false");
                    conversation.variable("checkBalance_MaskedAddress", "My records indicate that the address associated with this account begins with "+ response.data.address);
                    conversation.variable("checkBalance_AccountInfo", "You have $"+response.data.remainingBalanceDue+" due on "+moment(response.data.dueByDate).format("MMMM DD, YYYY")+". For a full breakdown of your bill, please login to My Account at comed.com or call us at 1-800-EDISON-1.");
                    conversation.transition();
                    done(); 
            }else{
                if(response.meta.code == "FN-MULTIPLE-ACCOUNTS"){
                            conversation.variable("servicesDown","false");
                            conversation.variable("addressFound","true");
                            conversation.variable("multipleAddressFound","true");
                            conversation.transition();
                            done();  
                } else {
                        var cause = response.meta ? response.meta : response.error;
                        var ERROR_CODE = cause ? cause.code : "";
                        var log;
                        var addressFound;
                        var servicesDown;
                        console.log("ERROR_CODE: " + ERROR_CODE);
                        switch (ERROR_CODE) {
                            case "FN-ACCT-NOTFOUND":
                            case "TC-ACCT-CLOSED":
                                log = "account not found";
                                addressFound = "false";
                                servicesDown = "false";
                                break;
                            case "BWENGINE-100029":
                            case "ETIMEDOUT":
                                log = "check balance request failed!";
                                addressFound = "false";
                                servicesDown = "true";
                                conversation.variable("servicesDownMessage", "Turn off the utility chatbot at this time. ");
                                break;
                            default:
                                log = "getCheckBalance: check balance request failed!";
                                addressFound = "false";
                                servicesDown = "true";
                                conversation.variable("servicesDownMessage", "I'm not able to complete your request right now. Please try again later.");
                                break;
                        }
                        logger.debug('getCheckBalance: ' + log);
                        conversation.variable("servicesDown", servicesDown);
                        conversation.variable("addressFound", addressFound);
                        conversation.transition();
                        done();           
                }
            }
        }).catch(function(err){
                    conversation.variable("servicesDown","true");
                    conversation.variable("servicesDownMessage", "I'm not able to complete your request right now. Please try again later.");
                    conversation.transition();
                    done(); 
                    console.log("error not handled at checkBalance service :"+ err);
        });
    }

}