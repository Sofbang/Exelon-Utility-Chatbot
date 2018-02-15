"use strict";

module.exports = {
    metadata: function metadata() {
        return {
            "name": "LogAnalytics",
            "properties": {
				  "logAnalytics": { "type": "string", "required": false }
            },
            "supportedActions": []
        };
    },

    invoke: function invoke(conversation, done) {
		var logAnalytics=  conversation.properties().logAnalytics;
		console.log("logAnalytics :" + logAnalytics);
		 conversation.transition();
        var isWebhook = conversation._request.message.channelConversation.type == "webhook";
        var clientType = isWebhook ? conversation._request.message.payload.profile.clientType : "facebook";
        var properties = { "ChannelName": clientType.toLowerCase() };
        this.postEvent(conversation.oracleMobile.analytics, "ChannelActivity", properties)
            .then(function (result) {
			    console.log("LogAnalytics: success posting analytics: " + JSON.stringify(result));
                done();
            }, function (error) {
                console.warn('LogAnalytics: error posting analytics.', error.statusCode, error.error);
                done();
            }); 
    },


    /** 
    * Posts a single custom analytics event, with a single custom property.
    * @param {object} analytics the custom code SDK analytics object, usually obtained from conversation.oracleMobile.analytics
    * @param {string} eventName the name of the custom event
    * @param {string} customProperty the name of the custom property
    * @param {string} customValue the value of the custom property
    * @returns {object} a Promise
    */
    postEvent: function (analytics, eventName, properties) {
        const timestamp = (new Date()).toISOString();
        return this.postCustomAnalyticEvents(analytics, {
            "name": eventName,
            "type": "custom",
            "timestamp": timestamp,
            "properties": properties
        }, timestamp);
    },

    /** 
    * Posts custom analytics events.
    * @param {object} analytics the custom code SDK analytics object, usually obtained from conversation.oracleMobile.analytics
    * @param {object} customEvents either a single custom event object or an Array of custom event objects
    * @param {string} sessionStartTimestamp ISO formated String representation of a Date object
    * @param {string} [sessionEndTimestamp] ISO formated String representation of a Date object
    * @returns {object} a Promise
    */
    postCustomAnalyticEvents: function (analytics, customEvents, sessionStartTimestamp, sessionEndTimestamp) {
        const events = [];
        events.push({ "name": "sessionStart", "type": "system", "timestamp": sessionStartTimestamp });
        Array.isArray(customEvents) ? Array.prototype.push.apply(events, customEvents) : events.push(customEvents);
        events.push({
            name: "sessionEnd",
            type: "system",
            "timestamp": sessionEndTimestamp ? sessionEndTimestamp : sessionStartTimestamp
        });
        return analytics.postEvent(events);
    }

};