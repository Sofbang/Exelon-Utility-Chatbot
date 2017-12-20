/**
 * Created by Gurkirat Singh on 11/12/2017.
 */
var appConfig = {
    port: Number(process.env.PORT || 8080),
    logLevel: 'INFO',
    socketHost: process.env.SOCKET_HOST || 'euwebsocketapp-sofbangmobile.uscom-central-1.oraclecloud.com',
    channels: {
        COMED: {
            google: {
                id: process.env.GOOGLE_COMED || '8501F9A5-E719-4716-BD0C-A397F1A0EAAE',
                name: 'ExelonCOMEDUtilityTest'
            },
            alexa: {
                waitForMoreResponsesMs: Number(process.env.WAIT_TIME || 200),
                amzn_appId: process.env.ALEXA_COMED_APP_ID || "amzn1.ask.skill.78de290d-b2ef-4003-89a5-ebaecbfacbf6",
                channelSecretKey: process.env.COMED_CHANNEL_SECRET || 'WmPsDhl1zhSYZ69r1Tvt9woDjafAaXZu',
                channelUrl: process.env.COMED_CHANNEL_URL || 'https://devomceBOTSCON-sofbangomce.uscom-central-1.oraclecloud.com:443/connectors/v1/tenants/idcs-b36382730d49427eb3b31e7f99a5aa84/listeners/webhook/channels/C4925EDD-1CCD-4904-B745-936681AF24E0'
            }
        },
        BGE: {
            google: {
                id: process.env.GOOGLE_BGE || '4F0A34BB-9620-492B-8827-2A1B37C5E2CB',
                name: 'ExelonBGEUtilityTest'
            },
            alexa: {
                waitForMoreResponsesMs: process.env.WAIT_TIME || 200,
                amzn_appId: process.env.ALEXA_BGE_APP_ID || "amzn1.ask.skill.1a558578-efd6-4c3a-b094-40f5868b7334",
                channelSecretKey: process.env.BGE_CHANNEL_SECRET || 'eGVPnxk9JbXLeol1cIS5aOhCC3UPoNVN',
                channelUrl: process.env.BGE_CHANNEL_URL || 'https://devomceBOTSCON-sofbangomce.uscom-central-1.oraclecloud.com:443/connectors/v1/tenants/idcs-b36382730d49427eb3b31e7f99a5aa84/listeners/webhook/channels/4098EEF6-E0CE-4103-B9DC-D21753C3DCFC'
            }
        }
    }
}

exports.get = function get() {
    return appConfig;
}