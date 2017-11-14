"use strict";

var log4js = require('log4js');
var logger = log4js.getLogger();
var Promise = require('bluebird');

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

    invoke: function invoke(conversation, done) {
        var PhoneNumber = conversation.properties().PhoneNumber;
        var AccountNumber = conversation.properties().AccountNumber;
        var mobileSdk = conversation.oracleMobile;
        var newAccountNumber;
        var newMaskedAddress = [];
        var getOutageStatus = ExelonService.getOutageStatus(mobileSdk, AccountNumber, PhoneNumber, newAccountNumber);
        getOutageStatus.then(function (response) {
            console.log(response);
            if (response.success) {
                console.log("after if success: " + JSON.stringify(response));
                conversation.variable("addressFound", "yes");
                var data = response.data;
                if (data.length > 1 && data.length <= 3) {
                    var count = 0;
                    var promiseArr = [];
                    for (var k in data) {
                        newAccountNumber = data[k].accountNumber;
                        console.log("newAccountNumber " + k + ':' + newAccountNumber);
                        AccountNumber = "";
                        PhoneNumber = "";
                        getOutageStatus = ExelonService.getOutageStatus(mobileSdk, AccountNumber, PhoneNumber, newAccountNumber);
                        promiseArr.push(getOutageStatus);
                        console.log("promiseArr :" + promiseArr)
                    }
                    Promise.all(promiseArr).then(function (allResult) {
                        console.log("allResult : " + allResult);
                        for (var i in allResult) {
                            console.log("allResult " + i + " :" + JSON.stringify(allResult[i]));
                            var res = allResult[i];
                            if (res.success) {
                                var address = res.data[0].maskedAddress;
                                newMaskedAddress.push(address);
                                count++;
                                console.log("address: " + address + " and count is: " + count);
                            }
                        }
                        conversation.variable("numberOfAccount", 'multiple');
                        conversation.variable("accountsOptions", newMaskedAddress.toString());
                        conversation.transition('setVariableValues');
                        done();
                    }).catch(function (err) {
                        console.log("err : " + err);
                        logger.debug('getOutageStatus: outage status request failed!');
                        conversation.transition();
                        done();
                    });
                }
                else if (data.length == 1) {
                    conversation.variable("numberOfAccount", 'single');
                    console.info('datadata' + data[0].maskedAddress);
                    logger.debug('getOutageStatus: outage status retrieved!');
                    console.info('getOutageStatus: outage status retrieved!' + JSON.stringify(response));
                    conversation.variable("user.phoneNumber", PhoneNumber);
                    conversation.variable("user.accountNumber", AccountNumber);
                    var accountAddressArr = [];
                    console.info('data.maskedAddress' + data[0].maskedAddress);

                    if (data[0].maskedAddress) {
                        conversation.variable("setAddress", 'My records indicate that the address associated with this account begins with ' + data[0].maskedAddress);
                        conversation.variable("setStatus", data[0].status);
                        conversation.variable("setOutageReported", data[0].outageReported);
                        conversation.variable("setETR", data[0].ETR);
                        conversation.transition('setVariableValues');
                        done();
                    }
                }
                else {
                    conversation.reply({ text: 'My records indicate that there are several addresses associated with this account. Please call us at 1-800-EDISON-1 for further assistance.' });
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
        .catch(function (e) {
            console.log(e);
            conversation.transition();
            done();
        });
    }
};
