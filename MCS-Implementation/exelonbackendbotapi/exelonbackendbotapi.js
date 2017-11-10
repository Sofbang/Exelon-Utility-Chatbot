/**
 * The ExpressJS namespace.
 * @external ExpressApplicationObject
 * @see {@link http://expressjs.com/3x/api.html#app}
 */

/**
 * Mobile Cloud custom code service entry point.
 * @param {external:ExpressApplicationObject}
 * service 
 */
module.exports = function (service) {

    service.get('/mobile/custom/exelonbackendbotapi/outage/query', function (req, res) {
        var PhoneNumber = req.query["PhoneNumber"];
        var AccountNumber = req.query["AccountNumber"];
        var opco = req.query["opco"];
        var newAccountNumber = req.query["newAccountNumber"];
        var pdata = {}

        if (newAccountNumber != "undefined") {
            pdata = {
                "account_number": newAccountNumber
            };
        }
        else {
            if (AccountNumber != undefined && AccountNumber != "${accountNumber.value.number}") {
                pdata = {
                    "account_number": AccountNumber
                };
            } else {
                pdata = {
                    "phone": PhoneNumber
                };
            }
        }

        console.log("pdata = " + JSON.stringify(pdata));

        var handler = function (error, response, body) {
            if (error) {
                console.log("Request error: " + JSON.stringify(error));
                res.send(500, error.message);
            } else {
                console.log("Request success: " + JSON.stringify(body));
                res.send(response.statusCode, body);
            }
        };

        var request = require("request");

        require("./node_modules/request-debug")(request);

        request({
            url: 'https://exeloneumobileapptest-a453576.mobileenv.us2.oraclecloud.com/mobile/custom/anon/' + opco + '/outage/query',
            method: "POST",
            json: true,
            timeout: 200000,
            headers: {
                "Authorization": "Basic QTQ1MzU3Nl9FWEVMT05FVU1PQklMRUFQUFRFU1RfTU9CSUxFX0FOT05ZTU9VU19BUFBJRDpraG0wQTV5cmtzX3Rkeg==",
                "Content-Type": "application/json",
                "oracle-mobile-backend-id": "7ebd1165-aae4-452f-8f7b-6c6cbdd93667"
            },
            body: pdata
        }, handler);
    });

    service.get('/mobile/custom/exelonbackendbotapi/outage', function (req, res) {

        var PhoneNumber = req.query["PhoneNumber"];
        var AccountNumber = req.query["AccountNumber"];
        var outageType = req.query["OutageType"];
        var opco = req.query["opco"];
        console.log("PhoneNumber: " + PhoneNumber);
        console.log("account_number: " + AccountNumber);
        console.log("opco: " + opco);
        var pdata = {}

        if (AccountNumber != undefined && AccountNumber != "${accountNumber.value.number}") {
            pdata = {
                "account_number": AccountNumber,
                "outage_issue": outageType
            };
        } else {
            pdata = {
                "phone": PhoneNumber,
                "outage_issue": outageType
            };
        }

        console.log("pdata lower= " + JSON.stringify(pdata));

        var handler = function (error, response, body) {
            if (error) {
                console.log("Request error: " + JSON.stringify(error));
                res.send(500, error.message);
            } else {
                console.log("Request success: " + JSON.stringify(body));
                res.send(response.statusCode, body);
            }
        };
        var request = require("request");

        require("./node_modules/request-debug")(request);

        request({
            url: 'https://exeloneumobileapptest-a453576.mobileenv.us2.oraclecloud.com/mobile/custom/anon/' + opco + '/outage',
            method: "POST",
            json: true,
            timeout: 200000,
            headers: {
                "Authorization": "Basic QTQ1MzU3Nl9FWEVMT05FVU1PQklMRUFQUFRFU1RfTU9CSUxFX0FOT05ZTU9VU19BUFBJRDpraG0wQTV5cmtzX3Rkeg==",
                "Content-Type": "application/json",
                "oracle-mobile-backend-id": "7ebd1165-aae4-452f-8f7b-6c6cbdd93667"
            },
            body: pdata
        }, handler);
    });

};
