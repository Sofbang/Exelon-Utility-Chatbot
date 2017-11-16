'use strict';

const express = require('express');
const webhookUtil = require('webhook/webhookUtil.js');
const bodyParser = require('body-parser');

const restService = express();

	
restService.use(bodyParser.urlencoded({
    extended: true
}));

restService.use(bodyParser.json());
 var metadata = {
        channelSecretKey: 'EQw8RLUAEW2pCKI0nFX5GF1m3IXE5gW5',
        channelUrl: 'https://69a45d8a.ngrok.io/connectors/v1/tenants/chatbot-tenant/listeners/webhook/channels/83A843A8-27A0-4811-8A2F-396E91FBDFCF'
    };

restService.post('/echo', function(req, res) {
	console.log(JSON.stringify(req.body));
    var speech = req.body.result && req.body.result.parameters && req.body.result.parameters.echoText ? req.body.result.parameters.echoText : "Seems like some problem. Speak again."
    return res.json({
        speech: 'Simarpreet '+speech,
        displayText: speech,
        source: 'google-webhook'
    });
});

restService.listen((process.env.PORT || 8000), function() {
    console.log("Server up and listening");
});
