"use strict";

var Promise = require('bluebird');
var opco = 'COMED';
var request = require("request");
require("../node_modules/request-debug")(request);

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
                url: 'https://exeloneumobileapptest-a453576.mobileenv.us2.oraclecloud.com/mobile/custom/anon/' + opco + '/outage/query',
                method: "POST",
                json: true,
                timeout: 200000,
                headers: {
                    "Authorization": "Basic YW5vbl90c3Q6NkclUXViQGxaQm1vZ09xJFc4Qlg=",
                    "Content-Type": "application/json",
                    "oracle-mobile-backend-id": "7ebd1165-aae4-452f-8f7b-6c6cbdd93667",
                    "User-Agent": "ChatBot/1.0"
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
                "outage_issue": outageType
            };

            if (AccountNumber != undefined && AccountNumber != "${accountNumber.value}") {
                pdata["account_number"] = AccountNumber;
            } else {
                pdata["phone"] = PhoneNumber;
            }

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
                url: 'https://exeloneumobileapptest-a453576.mobileenv.us2.oraclecloud.com/mobile/custom/anon/' + opco + '/outage',
                method: "POST",
                json: true,
                timeout: 200000,
                headers: {
                    "Authorization": "Basic YW5vbl90c3Q6NkclUXViQGxaQm1vZ09xJFc4Qlg=",
                    "Content-Type": "application/json",
                    "oracle-mobile-backend-id": "7ebd1165-aae4-452f-8f7b-6c6cbdd93667",
                    "User-Agent": "ChatBot/1.0"
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
                url: 'https://exeloneumobileapptest-a453576.mobileenv.us2.oraclecloud.com/mobile/custom/anonbots/' + opco + '/bill/lookup',
                method: "POST",
                json: true,
                timeout: 200000,
                headers: {
                    "Authorization": "Basic YW5vbl90c3Q6NkclUXViQGxaQm1vZ09xJFc4Qlg=",
                    "Content-Type": "application/json",
                    "oracle-mobile-backend-id": "7ebd1165-aae4-452f-8f7b-6c6cbdd93667",
                    "User-Agent": "ChatBot/1.0"
                },
                body: pdata
            }, handler);
        });
    }
};
