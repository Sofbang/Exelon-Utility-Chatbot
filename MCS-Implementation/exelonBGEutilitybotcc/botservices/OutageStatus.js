"use strict";

var log4js = require('log4js');
var logger = log4js.getLogger();
var Promise = require('bluebird');
var moment = require('moment-timezone');
var myTimeZone = "America/Toronto"

var ExelonService = require('./ExelonService');

module.exports = {

    metadata: function metadata() {
        return {
            "name": "OutageStatus",
            "properties": {
                "PhoneNumber": { "type": "string", "required": true },
                "AccountNumber": { "type": "string", "required": true },
                "SelectedMaskedAddress": { "type": "string", "required": false },
                "MultipleAccountInfo": { "type": "string", "required": false }            
            },
            "supportedActions": [
			 "setVariableValues"
			]
        };
    },

    invoke: function invoke(conversation, done) {
        var PhoneNumber = conversation.properties().PhoneNumber;
        var AccountNumber = conversation.properties().AccountNumber;
        var SelectedMaskedAddress = conversation.properties().SelectedMaskedAddress;
        var MultipleAccountInfo = conversation.properties().MultipleAccountInfo;
        var mobileSdk = conversation.oracleMobile;
        var newAccountNumber;
        var newMaskedAddress = [];

        if(SelectedMaskedAddress && MultipleAccountInfo){
            console.log("conversation bot id :" + JSON.stringify(conversation) + conversation.channelType());
                console.log("in if loop selectedMaskedAddress is : "+SelectedMaskedAddress+ " and all info is :{"+JSON.parse(MultipleAccountInfo)+"}");
                var userAccounts = JSON.parse(MultipleAccountInfo);
                var selectedAccountNumber = userAccounts.filter(function(userAccount){
                    return userAccount.data[0].maskedAddress == SelectedMaskedAddress;
                })[0].data[0].accountNumber;
                console.log("selectedAccountNumber :"+selectedAccountNumber);
                AccountNumber = selectedAccountNumber;
                console.log("AccountNumber ::::::::"+AccountNumber);
                var getOutageStatus = ExelonService.getOutageStatus(mobileSdk, selectedAccountNumber, PhoneNumber, newAccountNumber);
                getOutageStatus.then(function (response) {
                    if(response.success){
                        console.log("after success in multiple address if condition :"+JSON.stringify(response));
                        conversation.variable("setStatus", response.data[0].status);
                        if(conversation.channelType == "webhook" && conversation.channelId == "23349155-FCD6-4726-BE43-EB92F4FF140F"){
                            conversation.variable("setOutageReported", 'As of '+moment().tz(myTimeZone).format("hh:mm a")+' on '+moment().tz(myTimeZone).format("Do MMMM YYYY") +' I see that there is a power outage in your area. I currently estimate your power will be restored by '+moment(response.data[0].ETR).format("Do MMMM YYYY")+' at '+moment(response.data[0].ETR).format("hh:mm a")+'. You can also text STAT to MYBGE or 69243 for your current outage status.');
                        }else{
                            conversation.variable("setOutageReported", 'As of '+moment().tz(myTimeZone).format("hh:mm a")+' on '+moment().tz(myTimeZone).format("MM/DD/YYYY") +' I see that there is a power outage in your area. I currently estimate your power will be restored by '+moment(response.data[0].ETR).format("MM, DD, YYYY")+' at '+moment(response.data[0].ETR).format("hh:mm a")+'. You can also text STAT to MYBGE or 69243 for your current outage status.');
                        }
                        conversation.variable("selectedAccountNumber",selectedAccountNumber);
                        conversation.variable("setETR", response.data[0].ETR);
                        conversation.transition('setVariableValues');
                        done();
                    }else{
                        console.log("after error in multiple address else condition :"+JSON.stringify(response));
                        conversation.variable("noAddressFoundMessage", "I’m sorry, but I am unable to find an account associated with that phone number.\nDo you have another phone number or the account number available?");
                        conversation.transition();
                        done();
                    }
                });
        }
        else{
            var getOutageStatus = ExelonService.getOutageStatus(mobileSdk, AccountNumber, PhoneNumber, newAccountNumber);
            getOutageStatus.then(function (response) {
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
                        }
                        Promise.all(promiseArr).then(function (allResult) {
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
                            conversation.variable("maskedAddressFound", 'true');
                            conversation.variable("numberOfAccount", 'multiple');
                            conversation.variable("accountsOptions", newMaskedAddress.toString());
                            conversation.variable("allResult", JSON.stringify(allResult));
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
                        logger.debug('getOutageStatus: outage status retrieved!');
                        console.info('getOutageStatus: outage status retrieved!' + JSON.stringify(response));
                        conversation.variable("user.phoneNumber", PhoneNumber);
                        conversation.variable("user.accountNumber", AccountNumber);
                        var accountAddressArr = [];
                        console.info('data.maskedAddress' + data[0].maskedAddress);
                        if (data[0].maskedAddress) {
                            conversation.variable("setAddress", 'My records indicate that the address associated with this account begins with ' + data[0].maskedAddress);
                            conversation.variable("setStatus", data[0].status);
                            if(conversation.channelType == "webhook" && conversation.channelId == "23349155-FCD6-4726-BE43-EB92F4FF140F"){
                                conversation.variable("setOutageReported", 'As of '+moment().tz(myTimeZone).format("hh:mm a")+' on '+moment().tz(myTimeZone).format("Do MMMM YYYY") +' I see that there is a power outage in your area. I currently estimate your power will be restored by '+moment(data[0].ETR).format("Do MMMM YYYY")+' at '+moment(data[0].ETR).format("hh:mm a")+'. You can also text STAT to MYBGE or 69243 for your current outage status.');
                            }
                            else{
                                conversation.variable("setOutageReported", 'As of '+moment().tz(myTimeZone).format("hh:mm a")+' on '+moment().tz(myTimeZone).format("MM/DD/YYYY") +' I see that there is a power outage in your area. I currently estimate your power will be restored by '+moment(data[0].ETR).format("MM, DD, YYYY")+' at '+moment(data[0].ETR).format("hh:mm a")+'. You can also text STAT to MYBGE or 69243 for your current outage status.');
                            }
                            conversation.variable("setETR", data[0].ETR);
                            conversation.transition('setVariableValues');
                            done();
                        }else{
                            conversation.variable("maskedAddressFound", 'false');
                            conversation.transition();
                            done();

                        }
                    }
                    else {
                        conversation.variable("maskedAddressFound", 'true');
                        conversation.variable("moreThanThreeAccount", "true");
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
            }).catch(function (e) {
                console.log(e);
                conversation.transition();
                done();
                });
        }
    }
};
