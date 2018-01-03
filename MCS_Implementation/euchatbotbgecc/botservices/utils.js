var MESSAGES = require('./Messages.json');
var moment = require('moment-timezone');
var USTimeZone = "America/Toronto";

module.exports = {

    getMessageForBot: function (msg, estRestore) {
        for (var k in MESSAGES) {
            var MessageToBeReplaced = MESSAGES[k].MessageToBeReplaced;
            var ReplacedMessage = MESSAGES[k].ReplacedMessage;
            var parameters = MESSAGES[k].parameters;
            if (parameters) {
                var now = moment().tz(USTimeZone).format("hh:mm A") + ' on ' + moment().tz(USTimeZone).format("MM/DD/YYYY");
                MessageToBeReplaced = MessageToBeReplaced.replace("{estRestore}", moment(estRestore).tz(USTimeZone).format("MM/DD/YYYY hh:mm A"));

                ReplacedMessage = ReplacedMessage.replace("{estRestore}", moment(estRestore).tz(USTimeZone).format("MM/DD/YYYY") + ' at ' + moment(estRestore).tz(USTimeZone).format("hh:mm A"));
            }
            msg = msg.replace(MessageToBeReplaced, ReplacedMessage);
            if (msg == ReplacedMessage) {
                break;
            }
        }
        return msg;
    }

}