var MESSAGES = require('./Messages.json');
var moment = require('moment-timezone');
var USTimeZone = "America/Chicago";

module.exports = {

    getMessageForBot: function (msg, estRestore) {
        var CUSTOMER_MESSAGE = "customer(s) are affected by a power outage in your area.";
        var custAffectedIndex = msg.indexOf(CUSTOMER_MESSAGE);
        if (custAffectedIndex != -1) {
            msg = msg.replace("we indicate that", "my records indicate that");
        }
        for (var k in MESSAGES) {
            var MessageToBeReplaced = MESSAGES[k].MessageToBeReplaced;
            var ReplacedMessage = MESSAGES[k].ReplacedMessage;
            var parameters = MESSAGES[k].parameters;
            // Following code is currently not required in case of COMED
            //if (parameters) {
            //    var now = moment().tz(USTimeZone).format("h:mm A") + ' on ' + moment().tz(USTimeZone).format("M/D/YYYY");
            //    MessageToBeReplaced = MessageToBeReplaced.replace("{estRestore}", moment(estRestore).tz(USTimeZone).format("MM/DD/YYYY hh:mm A"));
            //    MessageToBeReplaced = MessageToBeReplaced.replace("{qyCustAffected}", qyCustAffected);
            //    MessageToBeReplaced = MessageToBeReplaced.replace("{now}", now);

            //    ReplacedMessage = ReplacedMessage.replace("{estRestore}", moment(estRestore).tz(USTimeZone).format("MM/DD/YYYY") + ' at ' + moment(estRestore).tz(USTimeZone).format("hh:mm A"));
            //    ReplacedMessage = ReplacedMessage.replace("{qyCustAffected}", qyCustAffected);
            //    ReplacedMessage = ReplacedMessage.replace("{now}", now);
            //}
            //console.log("MessageToBeReplaced: " + JSON.stringify(MessageToBeReplaced));
            //console.log("msg before replacement: " + JSON.stringify(msg));
            msg = msg.replace(MessageToBeReplaced, ReplacedMessage);
            if (msg == ReplacedMessage) {
                break;
            }
        }
        return msg;
    }

}