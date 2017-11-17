'use strict';

const express = require('express');
const webhookUtil = require('./webhook/webhookUtil.js');
const bodyParser = require('body-parser');

const restService = express();


restService.use(bodyParser.urlencoded({
	extended: true
}));

restService.use(bodyParser.json());
var metadata = {
	channelSecretKey: 'VD7RHEyN4Qi73BH3MYI8f0wWpfDYBkkp',
	channelUrl: 'https://sfbdemo3.ngrok.io/connectors/v1/tenants/chatbot-tenant/listeners/webhook/channels/C800CBDA-7ACC-4CDA-8E78-E9CF1CDDB1F3'
};
var speech;

	restService.post('/echo', function(req, res) {
	speech = req.body.result && req.body.result.parameters && req.body.result.parameters.echoText ? req.body.result.parameters.echoText : "Seems like some problem. Speak again.";

	var additionalProperties =
	{
		"userProfile":
		{
			"clientType": "google"
		}
	};

console.log('google speech '+speech);
	webhookUtil.messageToBotWithProperties(metadata.channelUrl, metadata.channelSecretKey, '123433', 'hi', additionalProperties, function(err) {

		if (err) {
			console.log("Failed sending message to Bot");
		}
		else {
			console.log("success");
		}
	});
});


restService.post('/echowebhook', function(req, res) {
	console.log("echowebhook" + speech);

	return res.json({
		speech: 'Simarpreet '+speech,
		displayText: speech,
		source: 'google-webhook'
	});

});

restService.listen((process.env.PORT || 9100), function() {
	console.log("Server up and listening");
});
