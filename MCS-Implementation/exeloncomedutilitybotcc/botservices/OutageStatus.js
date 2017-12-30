"use strict";

var log4js = require('log4js');
var logger = log4js.getLogger();
var Promise = require('bluebird');
var moment = require('moment-timezone');
var myTimeZone = "America/Chicago"

var ExelonService = require('./ExelonService');

module.exports = {

    metadata: function metadata() {
        return {
            "name": "OutageStatus",
            "properties": {
                "PhoneNumber": {
                    "type": "string",
                    "required": true
                },
                "AccountNumber": {
                    "type": "string",
                    "required": true
                },
                "SelectedMaskedAddress": {
                    "type": "string",
                    "required": false
                },
                "MultipleAccountInfo": {
                    "type": "string",
                    "required": false
                }
            },
            "supportedActions": [
                "setVariableValues"
            ]
        };
    },

    invoke: function invoke(conversation, done) {
        try {
            var PhoneNumber = conversation.properties().PhoneNumber;
            var AccountNumber = conversation.properties().AccountNumber;
            var SelectedMaskedAddress = conversation.properties().SelectedMaskedAddress;
            var MultipleAccountInfo = conversation.properties().MultipleAccountInfo;
            var mobileSdk = conversation.oracleMobile;
            var newAccountNumber;
            var newMaskedAddress = [];
            if (SelectedMaskedAddress && MultipleAccountInfo) {
                console.log("in if loop selectedMaskedAddress is : " + SelectedMaskedAddress + " and all info is :{" + JSON.parse(MultipleAccountInfo) + "}");
                var userAccounts = JSON.parse(MultipleAccountInfo);
                var filteredUserAccounts = [];
                var clientType = conversation._request.message.payload.profile.clientType;
                console.log("conversation : " + conversation);
                if (clientType && (clientType.toLowerCase() == "google" || clientType.toLowerCase() == "alexa")) {
                    console.log("in if condition of client type google/alexa");
                    if (!isNaN(SelectedMaskedAddress) && parseInt(SelectedMaskedAddress) <= userAccounts.length && parseInt(SelectedMaskedAddress) > 0) {
                        filteredUserAccounts.push(userAccounts[parseInt(SelectedMaskedAddress) - 1]);
                    }
                } else {
                    filteredUserAccounts = userAccounts.filter(function(userAccount) {
                        return (userAccount.data[0].maskedAddress).toLowerCase() == SelectedMaskedAddress.toLowerCase();
                    });
                }
                var selectedAccountNumber;
                if (filteredUserAccounts.length > 0) {
                    selectedAccountNumber = filteredUserAccounts[0].data[0].accountNumber;
                    console.log("selectedAccountNumber :" + selectedAccountNumber);
                    AccountNumber = selectedAccountNumber;
                    console.log("AccountNumber ::::::::" + AccountNumber);
                    var getOutageStatus = ExelonService.getOutageStatus(mobileSdk, selectedAccountNumber, PhoneNumber, newAccountNumber);
                    getOutageStatus.then(function(response) {
                        if (response.success) {
                            conversation.variable("errorInMultipleAddress", "false");
                            console.log("after success in multiple address if condition :" + JSON.stringify(response));
                            conversation.variable("setStatus", response.data[0].status);
                            conversation.variable("setOutageReported", response.data[0].outageReported);
                            conversation.variable("setReportOutageReported", response.data[0].outageReported);
                            conversation.variable("selectedAccountNumber", selectedAccountNumber);
                            conversation.variable("setETR", response.data[0].ETR);
                            conversation.transition('setVariableValues');
                            done();
                        } else {
                            console.log("after error in multiple address else condition :" + JSON.stringify(response));
                            conversation.variable("errorInMultipleAddress", "true");
                            conversation.variable("noAddressFoundMessage", "I’m sorry, but I am unable to find an account associated with that phone number. \nDo you have another phone number or the account number available?");
                            conversation.transition();
                            done();
                        }
                    });
                } else {
                    console.log("in else condition when filteredUserAccounts is not match with the list item");
                    conversation.variable("errorInMultipleAddress", "true");
                    conversation.variable("noAddressFoundMessage", "I’m sorry, but I am unable to find an account associated with that phone number. \nDo you have another phone number or the account number available?");
                    conversation.transition();
                    done();
                }
            } else {
                console.log("conversation : " + conversation);
                var getOutageStatus = ExelonService.getOutageStatus(mobileSdk, AccountNumber, PhoneNumber, newAccountNumber);
                getOutageStatus.then(function(response) {
                    if (response.success) {
                        console.log("after if success: " + JSON.stringify(response));
                        var data = response.data;
                        if (data.length > 1 && data.length <= 3) {
                            var count = 0;
                            var numberOfAddress = [];
                            var promiseArr = [];
                            for (var k in data) {
                                newAccountNumber = data[k].accountNumber;
                                console.log("newAccountNumber " + k + ':' + newAccountNumber);
                                AccountNumber = "";
                                PhoneNumber = "";
                                getOutageStatus = ExelonService.getOutageStatus(mobileSdk, AccountNumber, PhoneNumber, newAccountNumber);
                                promiseArr.push(getOutageStatus);
                            }
                            Promise.all(promiseArr).then(function(allResult) {
                                if (clientType && (clientType.toLowerCase() == "google" || clientType.toLowerCase() == "alexa")) {
                                    count = 1;
                                    var addressFound = "yes";
                                    for (var i in allResult) {
                                        var res = allResult[i];
                                        if (res.success) {
                                            var address = "Address " + count + ". " + res.data[0].maskedAddress;
                                            newMaskedAddress.push(address);
                                            numberOfAddress.push(count);
                                            console.log("numberOfAddress :"+numberOfAddress);
                                            count++;
                                            console.log("address: " + address + " and count is: " + count);
                                        } else {
                                            addressFound = "no";
                                        }
                                    }
                                } else {
                                    var addressFound = "yes";
                                    for (var i in allResult) {
                                        console.log("allResult " + i + " :" + JSON.stringify(allResult[i]));
                                        var res = allResult[i];
                                        if (res.success) {
                                            var address = res.data[0].maskedAddress;
                                            newMaskedAddress.push(address);
                                            count++;
                                            console.log("address: " + address + " and count is: " + count);
                                        } else {
                                            addressFound = "no";
                                        }
                                    }
                                }
                                conversation.variable("addressFound", addressFound);
                                conversation.variable("noAddressFoundMessage", "I'm not able to complete your request right now. Please try again later.");
                                conversation.variable("numberOfAccount", 'multiple');
                                conversation.variable("accountsOptions", newMaskedAddress.toString());
                                if (clientType && clientType.toLowerCase() == "alexa") {
                                    conversation.variable("multipleAccountMessage", "My records indicate that there are multiple addresses associated with the phone number provided. Please select the correct address. Your choices are :" + numberOfAddress + ". ");
                                } else if(clientType && clientType.toLowerCase() == "google"){
                                    conversation.variable("multipleAccountMessage", "My records indicate that there are multiple addresses associated with the phone number provided. Your choices are :" + numberOfAddress + ". Please select the correct address from the following options. ");
                                } else {
                                    conversation.variable("multipleAccountMessage", "My records indicate that there are multiple addresses associated with the phone number provided. Please select the correct address:");
                                }
                                conversation.variable("allResult", JSON.stringify(allResult));
                                conversation.transition('setVariableValues');
                                done();
                            }).catch(function(err) {
                                console.log("err : " + err);
                                conversation.variable("addressFound", "no");
                                logger.debug('getOutageStatus: outage status request failed!');
                                conversation.transition();
                                done();
                            });
                        } else if (data.length == 1) {
                            conversation.variable("addressFound", "yes");
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
                                conversation.variable("setOutageReported", data[0].outageReported);
                                conversation.variable("setReportOutageReported", data[0].outageReported);
                                conversation.variable("setETR", data[0].ETR);
                                conversation.transition('setVariableValues');
                                done();
                            }
                        } else {
                            conversation.variable("addressFound", "yes");
                            conversation.variable("moreThanThreeAccount", "true");
                            conversation.transition();
                            done();
                        }

                    } else {
                        if (response.meta.code == "FN-ACCT-NOTFOUND") {
                            logger.debug('getOutageStatus: account not found');
                            conversation.variable("addressFound", "no");
                            conversation.variable("accountNotFound", "true");
                            conversation.transition();
                            done();
                        } else if (response.meta.code == "BWENGINE-100029") {
                            logger.debug('getOutageStatus: outage status request failed!');
                            conversation.variable("addressFound", "no");
                            conversation.variable("accountNotFound", "false");
                            conversation.variable("noAddressFoundMessage", "Turn off the utility chatbot at that time");
                            conversation.transition();
                            done();
                        } else {
                            logger.debug('getOutageStatus: outage status request failed!');
                            conversation.variable("addressFound", "no");
                            conversation.variable("accountNotFound", "false");
                            conversation.variable("noAddressFoundMessage", "I'm not able to complete your request right now. Please try again later.");
                            conversation.transition();
                            done();
                        }
                    }
                }).catch(function(e) {
                    console.log(e);
                    conversation.variable("addressFound", "no");
                    conversation.variable("accountNotFound", "false");
                    conversation.variable("noAddressFoundMessage", "I'm not able to complete your request right now. Please try again later.");
                    conversation.transition();
                    done();
                });
            }
        } catch (e) {
            console.log(e);
        }
    }
};