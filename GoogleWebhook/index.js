'use strict';

const express = require('express');
const webhookUtil = require('./webhook/webhookUtil.js');
const bodyParser = require('body-parser');
const WebSocket = require('ws');

const restService = express();

restService.use(bodyParser.urlencoded({
    extended: true
}));

restService.use(bodyParser.json());

var speech;
var sessionId;
var metadata = {
    channelSecretKey: 'EQw8RLUAEW2pCKI0nFX5GF1m3IXE5gW5',
    channelUrl: 'https://sfbdemo3.ngrok.io/connectors/v1/tenants/chatbot-tenant/listeners/webhook/channels/83A843A8-27A0-4811-8A2F-396E91FBDFCF'
};
restService.post('/echo', function (req, res) {
    sessionId = req.body.sessionId;
    console.log('google session ' + req.body.sessionId);
    speech = req.body.result && req.body.result.parameters && req.body.result.parameters.echoText ? req.body.result.parameters.echoText : "Seems like some problem. Speak again.";

	var ws;

    ws = new WebSocket('wss://sfbdemo2.ngrok.io/chat/ws?user=' + sessionId);
    ws.addEventListener('open', function (event) {
        var message = {
            to: {
                type: 'bot',
                id: '0790802F-43A9-47A4-9AE9-34C7611B78C6'
            },
            text: speech
        };

        ws.send(JSON.stringify(message));
    });
    ws.addEventListener('message', function (event) {
        var msg = JSON.parse(event.data);
        console.log(JSON.stringify(msg));
		ws.close();
		if(msg.body.choices)
		{
            return res.json({
                speech: 'Simarpreet ' + msg.body.text + msg.body.choices,
                displayText: speech,
                source: 'google-webhook'
            });
		}
		else
		{
            return res.json({
                speech: 'Simarpreet ' + msg.body.text,
                displayText: speech,
                source: 'google-webhook'
            });
		}
    });
    ws.addEventListener('close', function (event) {
        ws = null;
    });
    ws.addEventListener('error', function (event) {
    });


	//webhookUtil.messageToBotWithProperties(metadata.channelUrl, metadata.channelSecretKey, '123433', speech, additionalProperties, function(err) {

	//if (err) {
	//	console.log("Failed sending message to Bot");
	//}
	//else {
	//	console.log("success");


	//	}
	//});

});


restService.post('/echowebhook', function (req, res) {
    console.log("echowebhook" + speech);

    //console.log('google req '+req.body.userProfile.clientType);
    return res.json({
        speech: 'Simarpreet ' + speech,
        displayText: speech,
        source: 'google-webhook'
    });

});

restService.listen((process.env.PORT || 9100), function () {
    console.log("Server up and listening");
});
