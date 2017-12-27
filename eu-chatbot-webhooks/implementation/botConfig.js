/**
 * Created by Gurkirat Singh on 11/12/2017.
 */
var appConfig = {
    port: Number(process.env.PORT || 8080),
    logLevel: 'INFO',
    socketHost: process.env.SOCKET_HOST || 'sfbdemo4.ngrok.io',
    channels: {
        COMED: {
            google: {
                id: process.env.GOOGLE_COMED || 'E83BDF42-702D-42EA-9D56-7E979D184695'
            },
            alexa: {
                waitForMoreResponsesMs: process.env.WAIT_TIME || 200,
                amzn_appId: process.env.ALEXA_COMED_APP_ID || "amzn1.ask.skill.ae00ef8d-e0ff-4c13-af86-07c520c289c4",
                channelSecretKey: process.env.COMED_CHANNEL_SECRET || 'V1sCIK2cc7qDRocj3rUnPEtkLmuWMR7D',
                channelUrl: process.env.COMED_CHANNEL_URL || 'https://sfbdemo2.ngrok.io/connectors/v1/tenants/chatbot-tenant/listeners/webhook/channels/1B8BD904-E775-4637-8DAA-E9CB27DC7CE7'
            }
        },
        BGE: {
            google: {
                id: process.env.GOOGLE_BGE || '85E7C890-B6D4-4CE8-9452-C468F89E1E6D'
            },
            alexa: {
                waitForMoreResponsesMs: process.env.WAIT_TIME || 200,
                amzn_appId: process.env.ALEXA_BGE_APP_ID || "amzn1.ask.skill.698a7a2b-804f-4da4-b85a-7c1c8a70fdee",
                channelSecretKey: process.env.BGE_CHANNEL_SECRET || 'cabgaAZ5oi15m6oT8zukMMMvwNoPMWvP',
                channelUrl: process.env.BGE_CHANNEL_URL || 'https://sfbdemo2.ngrok.io/connectors/v1/tenants/chatbot-tenant/listeners/webhook/channels/E7C634DF-725B-4A3C-91A0-E90F44582D7D'
            }
        }
    }
}

exports.get = function get() {
    return appConfig;
}