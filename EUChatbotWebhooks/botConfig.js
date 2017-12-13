/**
 * Created by Gurkirat Singh on 2017-02-21.
 */
var appConfig = {
    dev: {
        port: 9200,
        logLevel: 'INFO',
        alexa: {
            waitForMoreResponsesMs: 200,
            amzn_appId: "amzn1.ask.skill.08d961b6-ab5b-4859-a1ad-b02df9b0f82c",
            channelSecretKey: 'iw2IkuMRId4f4YRfcL2obrk41pJ1fqQK',
            channelUrl: 'http://bots-connectors:8000/connectors/v1/tenants/chatbot-tenant/listeners/webhook/channels/23349155-FCD6-4726-BE43-EB92F4FF140F'
        },
        google: {
        },
        oracle: {
            channels: {
                COMED: {
                    id: '9B81EAA4-64C1-46B7-ACAC-9C047EAB7C35',
                    name: 'ExelonCOMEDUtilityDev'
                },
                BGE: {
                    id: '0790802F-43A9-47A4-9AE9-34C7611B78C6',
                    name: 'ExelonBGEUtilityDev'
                }
            }
        }
    },
    stage: {
        port: 9100,
        logLevel: 'INFO',
        alexa: {
            waitForMoreResponsesMs: 200,
            amzn_appId: "amzn1.ask.skill.08d961b6-ab5b-4859-a1ad-b02df9b0f82c",
            channelSecretKey: 'iw2IkuMRId4f4YRfcL2obrk41pJ1fqQK',
            channelUrl: 'http://bots-connectors:8000/connectors/v1/tenants/chatbot-tenant/listeners/webhook/channels/23349155-FCD6-4726-BE43-EB92F4FF140F'
        },
        google: {
        },
        oracle: {
            channels: {
                COMED: {
                    id: '6B7DB2BA-CA8F-40FD-9B56-820F6A348EFB',
                    name: 'ExelonCOMEDUtilityTest'
                },
                BGE: {
                    id: '77CCE6DA-2E05-4DED-87D9-25EE1167E29C',
                    name: 'ExelonBGEUtilityTest'
                }
            }
        }
    },
    prod: {
        port: 9000,
        logLevel: 'INFO',
        alexa: {
            waitForMoreResponsesMs: 200,
            amzn_appId: "amzn1.ask.skill.08d961b6-ab5b-4859-a1ad-b02df9b0f82c",
            channelSecretKey: 'iw2IkuMRId4f4YRfcL2obrk41pJ1fqQK',
            channelUrl: 'http://bots-connectors:8000/connectors/v1/tenants/chatbot-tenant/listeners/webhook/channels/23349155-FCD6-4726-BE43-EB92F4FF140F'
        },
        google: {
        },
        oracle: {
            channels: {
                COMED: {
                    id: '9B81EAA4-64C1-46B7-ACAC-9C047EAB7C35'
                },
                BGE: {
                    id: '0790802F-43A9-47A4-9AE9-34C7611B78C6'
                }
            }
        }
    }
}

exports.get = function get(env) {
    return config[env] || config.default;
}