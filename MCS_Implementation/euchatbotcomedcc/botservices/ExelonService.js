"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var log4js = require('log4js');
var logger = log4js.getLogger();

var moment = require('moment-timezone');
var Promise = require('bluebird');
var opco;

module.exports = {
    getOutageStatus: function getOutageStatus(mobileSdk, accountNumber, PhoneNumber, newAccountNumber) {
        opco = 'comed';
        return mobileSdk.custom.euchatbotapi.get('outage/query?PhoneNumber=' + PhoneNumber + '&AccountNumber=' + accountNumber + '&newAccountNumber=' + newAccountNumber + '&opco=' + opco, null, null).then(
            function (result) {
                var response = JSON.parse(result.result);
                console.log('response:::::: ' + JSON.stringify(response));
                logger.debug('GET OutageStatus Success: ' + JSON.stringify(response));
                return response;
            }, function (error) {
                if (error.error) {
                    error = JSON.parse(error.error);
                }
                console.log('error:::::: ' + JSON.stringify(error));
                logger.debug('GET OutageStatus Error: ' + JSON.stringify(error));
                return error;
            });
    },
    reportOutage: function reportOutage(mobileSdk, accountNumber, PhoneNumber, OutageType) {
        opco = 'comed';
        console.log("getoutageStatus11 in report outage :" + accountNumber);
        return mobileSdk.custom.euchatbotapi.get('outage?PhoneNumber=' + PhoneNumber + '&AccountNumber=' + accountNumber + '&OutageType=' + OutageType + '&opco=' + opco, null, null).then(
            function (result) {
                var response = JSON.parse(result.result);
                console.log('GET Report Outage Success: ' + JSON.stringify(response));
                logger.debug('GET Report Outage Success: ' + JSON.stringify(response));
                return response;
            }, function (error) {
                var error = JSON.parse(error.error);
                console.log('GET Report Outage Error: ' + JSON.stringify(error));
                logger.debug('GET Report Outage Error: ' + JSON.stringify(error));
                return error;
            });
    },
    checkBalance: function checkBalance(mobileSdk, AccountNumber, PhoneNumber, Identifier) {
        opco = 'COMED';
        return mobileSdk.custom.euchatbotapi.get('bill/lookup?PhoneNumber=' + PhoneNumber + '&AccountNumber=' + AccountNumber + '&Identifier=' + Identifier + '&opco=' + opco, null, null).then(
            function (result) {
                var response = JSON.parse(result.result);
                console.log('GET Check balance Success: ' + JSON.stringify(response));
                logger.debug('GET Check balance Success: ' + JSON.stringify(response));
                return response;
            }, function (error) {
                var error = JSON.parse(error.error);
                console.log('GET Check balance Error: ' + JSON.stringify(error));
                logger.debug('GET Check balance Error: ' + JSON.stringify(error));
                return error;
            });
    }
};
