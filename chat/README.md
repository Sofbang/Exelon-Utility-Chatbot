#chat server sample

chat server using web socket

# Configuration

[Admin UI](/apps/chat/admin)

1. Navigate to botsui bot's add webhook form.
2. Fill form with you details, in "Outgoing Webhook URI" field put: https://bots-samples-nodejs:8889/apps/chat/bots/channel_id/messages and hit create button
3. Replace "channel_id" in "Outgoing Webhook URI" field with last parameter in url from "Webhook URL" field.
4. Open [Admin UI](/apps/chat/admin) and create new channel with "Secret Key" and "Webhook URL" from web hook form in botsui.
