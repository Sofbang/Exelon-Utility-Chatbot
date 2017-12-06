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
                    conversation.variable("checkBalance_MaskedAddress", "My records indicate that the address associated with this account begins with 1617 PROS***");
                    conversation.variable("checkBalance_AccountInfo", "You have $"+response.data.remainingBalanceDue+" due on "+moment(response.data.dueByDate).format("MMMM DD, YYYY")+". For a full breakdown of your bill, please login to My Account at bge.com or call us at 1-800-685-0123.");
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
                    conversation.variable("servicesDown","false");
                    conversation.variable("addressFound","false");
                    conversation.transition();
                    done();                     
                }
            }
        }).catch(function(err){
                    conversation.variable("servicesDown","true");
                    conversation.transition();
                    done(); 
                    console.log("error not handled at checkBalance service :"+ err);
        });
    }

}