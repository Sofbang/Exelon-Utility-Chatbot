"use strict";

var log4js = require('log4js');
var logger = log4js.getLogger();

var ExelonService = require('./ExelonService');

module.exports = {

    metadata: function metadata() {
        return {
            "name": "OutageStatus",
            "properties": {
                "PhoneNumber": { "type": "string", "required": true },
                "AccountNumber": { "type": "string", "required": true }
            },
            "supportedActions": [
			 "setVariableValues"
			]
        };
    },

    invoke: function invoke(conversation, done) 
	{
      var PhoneNumber = conversation.properties().PhoneNumber;
	  console.log("phoneNumber :"+ PhoneNumber);
      var AccountNumber = conversation.properties().AccountNumber;
	  var mobileSdk = conversation.oracleMobile;
	  
      var getOutageStatus = ExelonService.getOutageStatus(mobileSdk, AccountNumber, PhoneNumber);
      getOutageStatus
      .then(function(response){
        console.log(response);
        if (response.success) 
		{
			console.log("after if success: "+response);
		 conversation.variable("addressFound", "yes")
		 var data = response.data;
			console.info('datadata' + data[0].maskedAddress);
				logger.debug('getOutageStatus: outage status retrieved!');
				console.info('getOutageStatus: outage status retrieved!' + JSON.stringify(response));
				conversation.variable("user.phoneNumber" , PhoneNumber);
				conversation.variable("user.accountNumber" , AccountNumber);
				var accountAddressArr = [];
				console.info('data.maskedAddress' + data[0].maskedAddress);
					
				if(data[0].maskedAddress)
					{
							conversation.variable("setAddress", 'My records indicate that the address associated with this account begins with '+ data[0].maskedAddress);
							conversation.variable("setStatus", data[0].status);
							conversation.variable("setOutageReported", data[0].outageReported);
							conversation.variable("setETR", data[0].ETR);
							conversation.transition('setVariableValues');
							done();
					}
				else
					{
						conversation.reply({text:'My records indicate that there are several addresses associated with this account. Please call us at 1-800-EDISON-1 for further assistance.'});
						conversation.transition();
						done();
					}
		}
		else {
            logger.debug('getOutageStatus: outage status request failed!');
			conversation.variable("addressFound", "no");
            conversation.variable("noAddressFoundMessage", "I’m sorry, but I am unable to find an account associated with that phone number.\nDo you have another phone number or the account number available?");
			conversation.transition();
			done();
        }
      })
      .catch(function(e) {
        console.log(e);
        conversation.transition();
        done();
      });
    }
};
