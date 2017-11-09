"use strict";

var log4js = require('log4js');
var logger = log4js.getLogger();

var ExelonService = require('./ExelonService');

module.exports = {

    metadata: function metadata() {
        return {
            "name": "ReportOutage",
            "properties": {
                "PhoneNumber": { "type": "string", "required": true },
                "AccountNumber": { "type": "string", "required": true }
            },
            "supportedActions": []
        };
    },

    invoke: function invoke(conversation, done) {
      var PhoneNumber = conversation.properties().PhoneNumber;
	  var accountNumber = = conversation.properties().AccountNumber;
	  console.log("in report outage custom component account number is :" + accountNumber);
	  var mobileSdk = conversation.oracleMobile;
      var getOutageStatus = ExelonService.getOutageStatus(mobileSdk, accountNumber, PhoneNumber);
      getOutageStatus
      .then(function(response)
	  {
        console.log(response);
        if (response.success) 
		{
			var data = response.data;
			console.log("data "+JSON.stringify(data));
			console.log("maskedAccountNumber "+maskedAddress);
				for(var k in data)
				{
					var  accountData = data[k];
						console.log("accountData:::"+ JSON.stringify(accountData));
						if(accountData.maskedAccountNumber == maskedAccountNumber)
						{
							console.log("inside if");
							accountNumber = accountData.accountNumber;
						}
				} 
		}
		  console.log("accountNumber "+accountNumber);
		  var reportOutage = ExelonService.reportOutage(mobileSdk, accountNumber, PhoneNumber);
		  reportOutage
		  .then(function(response){
			console.log(response);
			if (response.success) {
				
				conversation.reply({ text: ' Thank you. Your outage has been reported. Your service request number is ' + response.data.confirmationNumber + '. My crew is working as quickly and safely as possible to restore power. For outage status updates, please visit: comed.com/map or text STAT to COMED or 26633.' });
				//conversation.reply({ text: 'All done! Your service request number is ' + response.data.confirmationNumber + '. What else can I do for you?' });
			} else {
				logger.debug('reportOutage: report outage failed!');
					if (response.meta.code === 'FN-TOO-MANY-ACCOUNTS')
						
				{ ExelonService.getOutageStatus(mobileSdk, PhoneNumber).then(function(response)	{
					
				conversation.reply({text:response.data.accountNumber +response.data.maskedAccountNumber});
				
				});	}
		
				else {
				conversation.reply({ text: 'Sorry, Outage reporting could not be done for Phone Number ' + PhoneNumber + '.' });}
			}
			conversation.transition();
			done();
		  })
	  
      })
      .catch(function(e) {
        console.log(e);
        conversation.transition();
        done();
      });
    }
};
