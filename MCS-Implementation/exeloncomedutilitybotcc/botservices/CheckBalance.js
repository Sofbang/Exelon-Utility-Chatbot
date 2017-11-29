"use strict";

var log4js = require('log4js');
var logger = log4js.getLogger();

module.exports = {

	metadata: function metadata() {
        return {
            "name": "CheckBalance",
            "properties": {
                "PhoneNumber": { "type": "string", "required": true },
                "AccountNumber": { "type": "string", "required": true }
            },
            "supportedActions": []
        };
    },

    invoke: function invoke(conversation, done) {
    	var PhoneNumber = conversation.properties().PhoneNumber;
    	var AccountNumber = conversation.properties().AccountNumber;
    	console.log("Account Number is : "+AccountNumber+" and Phone Number is : "+PhoneNumber);
    	conversation.variable("addressFound", "true");
    	conversation.variable("checkBalance_MaskedAddress", "My records indicate that the address associated with this account begins with “masked address");
    	conversation.variable("checkBalance_AccountInfo", "You have $88 due on November 23, 2017. For a full breakdown of your bill, please login to My Account at comed.com or call us at 1-800-EDISON-1.");
        conversation.transition();
        done();
    }

}