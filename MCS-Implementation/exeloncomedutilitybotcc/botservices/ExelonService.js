"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var log4js = require('log4js');
var logger = log4js.getLogger();

var moment = require('moment');
var Promise = require('bluebird');

module.exports = {
    getOutageStatus: function getOutageStatus(mobileSdk, accountNumber, PhoneNumber) {
		console.log("getoutageStatus :"+ PhoneNumber);
		console.log("getoutageStatus11 :"+ accountNumber);
			return mobileSdk.custom.exelonbackendbotapi.get('outage/query?PhoneNumber='+ PhoneNumber+'&AccountNumber='+ accountNumber, null, null).then(
			function (result) {
				var response = JSON.parse(result.result);
				console.log('response:::::: '+JSON.stringify(response));
				logger.debug('GET OutageStatus Success: ' + JSON.stringify(response));
				return response;
			},function(error) {
				var error = JSON.parse(error.error);
				console.log('error:::::: '+JSON.stringify(error));
				logger.debug('GET OutageStatus Error: ' + JSON.stringify(error));
				return error;
			});		
    },
    reportOutage: function reportOutage(mobileSdk, accountNumber, PhoneNumber) {
        return mobileSdk.custom.exelonbackendbotapi.get('outage?PhoneNumber='+ PhoneNumber+'&AccountNumber='+ accountNumber, null, null).then(
		function (result) {
			var response = JSON.parse(result.result);
			console.log('GET Report Outage Success: ' + JSON.stringify(response));
			logger.debug('GET Report Outage Success: ' + JSON.stringify(response));
			return response;
		},function(error) {
			var error = JSON.parse(error.error);
			console.log('GET Report Outage Error: ' + JSON.stringify(error));
			logger.debug('GET Report Outage Error: ' + JSON.stringify(error));
			return error;
		});
    }
};
