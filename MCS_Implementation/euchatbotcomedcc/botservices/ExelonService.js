"use strict";

var Promise = require('bluebird');
var opco = 'COMED';
var request = require("request");
require("../node_modules/request-debug")(request);
const mcsConfig = require('../config').get();
var BASE_URL = mcsConfig.baseUrl;
var AUTH_TOKEN = mcsConfig.authToken;
var BACKEND_ID = mcsConfig.backendId;
var USER_AGENT = mcsConfig.userAgent;

module.exports = {
    getOutageStatus: function getOutageStatus(mobileSdk, AccountNumber, PhoneNumber, newAccountNumber) {
        return new Promise(function (resolve, reject) {
            var pdata = {};
            AccountNumber = AccountNumber && AccountNumber != "${accountNumber.value}" ? AccountNumber : newAccountNumber;
            console.log("AccountNumber in getOutageStatus: " + AccountNumber);
            if (AccountNumber && AccountNumber != "undefined") {
                pdata["account_number"] = AccountNumber;
            } else {
                pdata["phone"] = PhoneNumber;
            }

            console.log("pdata = " + JSON.stringify(pdata));

            var handler = function (error, response, body) {
                if (error) {
                    console.log("Request error: " + JSON.stringify(error));
                    resolve(error);
                } else {
                    console.log("Request success: " + JSON.stringify(body));
                    resolve(body);
                }
            };

            request({
                url: BASE_URL + '/mobile/custom/anon_v2/' + opco + '/outage/query',
                method: "POST",
                json: true,
                timeout: 200000,
                headers: {
                    "Authorization": "Basic " + AUTH_TOKEN,
                    "Content-Type": "application/json",
                    "oracle-mobile-backend-id": BACKEND_ID,
                    "User-Agent": USER_AGENT
                },
                body: pdata
            }, handler);
        });
    },
    reportOutage: function reportOutage(mobileSdk, AccountNumber, PhoneNumber, outageType) {
        return new Promise(function (resolve, reject) {

            console.log("PhoneNumber: " + PhoneNumber);
            console.log("account_number: " + AccountNumber);
            console.log("opco: " + opco);
            var pdata = {
                "outage_issue": outageType,
                "account_number": AccountNumber,
                "phone": PhoneNumber
            };
            console.log("pdata lower= " + JSON.stringify(pdata));
            var handler = function (error, response, body) {
                if (error) {
                    console.log("Request error: " + JSON.stringify(error));
                    resolve(error);
                } else {
                    console.log("Request success: " + JSON.stringify(body));
                    resolve(body);
                }
            };

            request({
                url: BASE_URL + '/mobile/custom/anon_v2/' + opco + '/outage',
                method: "POST",
                json: true,
                timeout: 200000,
                headers: {
                    "Authorization": "Basic " + AUTH_TOKEN,
                    "Content-Type": "application/json",
                    "oracle-mobile-backend-id": BACKEND_ID,
                    "User-Agent": USER_AGENT
                },
                body: pdata
            }, handler);
        });
    },
    checkBalance: function checkBalance(mobileSdk, AccountNumber, PhoneNumber, Identifier) {
        return new Promise(function (resolve, reject) {
            console.log("PhoneNumber: " + PhoneNumber + "AccountNumber: " + AccountNumber + "Identifier: " + Identifier + "opco: " + opco);
            var pdata = {
                "phone": PhoneNumber,
                "identifier": Identifier
            };
            if (AccountNumber != "undefined" && AccountNumber != "${accountNumber.value.number}") {
                pdata["account_num"] = AccountNumber;
            }
            console.log("pdata = " + JSON.stringify(pdata));
            var handler = function (error, response, body) {
                if (error) {
                    console.log("Request error: " + JSON.stringify(error));
                    resolve(error);
                } else {
                    console.log("Request success: " + JSON.stringify(body));
                    resolve(body);
                }
            };

            request({
                url: BASE_URL + '/mobile/custom/anonbots/' + opco + '/bill/lookup',
                method: "POST",
                json: true,
                timeout: 200000,
                headers: {
                    "Authorization": "Basic " + AUTH_TOKEN,
                    "Content-Type": "application/json",
                    "oracle-mobile-backend-id": BACKEND_ID,
                    "User-Agent": USER_AGENT
                },
                body: pdata
            }, handler);
        });
    }
};
