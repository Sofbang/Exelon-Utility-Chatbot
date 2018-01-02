var MESSAGES = require('./Messages.json');
var moment = require('moment-timezone');
var USTimeZone = "America/Chicago";

module.exports = {

    getMessageForBot: function (msg, estRestore, qyCustAffected) {
        for (var k in MESSAGES) {
            var MessageTemplate = MESSAGES[k].MessageToBeReplaced;
            var parameters = MESSAGES[k].parameters;
            var MessageToBeReplaced = MessageTemplate;
            var ReplacedMessage = MESSAGES[k].ReplacedMessage;
            if (parameters) {
                var now = moment().tz(USTimeZone).format("h:mm A") + ' on ' + moment().tz(USTimeZone).format("M/D/YYYY");
                MessageToBeReplaced = MessageToBeReplaced.replace("{estRestore}", moment(estRestore).tz(USTimeZone).format("MM/DD/YYYY hh:mm A"));
                MessageToBeReplaced = MessageToBeReplaced.replace("{qyCustAffected}", qyCustAffected);
                MessageToBeReplaced = MessageToBeReplaced.replace("{now}", now);

                ReplacedMessage = ReplacedMessage.replace("{estRestore}", moment(estRestore).tz(USTimeZone).format("MM/DD/YYYY") + ' at ' + moment(estRestore).tz(USTimeZone).format("hh:mm A"));
                ReplacedMessage = ReplacedMessage.replace("{qyCustAffected}", qyCustAffected);
                ReplacedMessage = ReplacedMessage.replace("{now}", now);
            }
            console.log("MessageToBeReplaced: " + JSON.stringify(MessageToBeReplaced));
            console.log("msg before replacement: " + JSON.stringify(msg));
            msg = msg.replace(MessageToBeReplaced, ReplacedMessage);
            if (msg == ReplacedMessage) {
                break;
            }
        }
        return msg;
    }

}