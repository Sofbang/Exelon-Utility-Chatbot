/**
 * Created by Gurkirat Singh on 11/12/2017.
 */
var appConfig = {
    dev: {
        port: Number(process.env.PORT || 8080),
        logLevel: 'INFO',
        socketHost: 'sfbdemo2.ngrok.io',
        channels: {
            COMED: {
                google: {
                    id: 'E83BDF42-702D-42EA-9D56-7E979D184695',
                    name: 'ExelonCOMEDUtilityDev'
                },
                alexa: {
                    waitForMoreResponsesMs: 200,
                    amzn_appId: "amzn1.ask.skill.ae00ef8d-e0ff-4c13-af86-07c520c289c4",
                    channelSecretKey: 'V1sCIK2cc7qDRocj3rUnPEtkLmuWMR7D',
                    channelUrl: 'https://sfbdemo3.ngrok.io/connectors/v1/tenants/chatbot-tenant/listeners/webhook/channels/1B8BD904-E775-4637-8DAA-E9CB27DC7CE7'
                }
            },
            BGE: {
                google: {
                    id: '85E7C890-B6D4-4CE8-9452-C468F89E1E6D',
                    name: 'ExelonBGEUtilityDev'
                },
                alexa: {
                    waitForMoreResponsesMs: 200,
                    amzn_appId: "amzn1.ask.skill.698a7a2b-804f-4da4-b85a-7c1c8a70fdee",
                    channelSecretKey: 'cabgaAZ5oi15m6oT8zukMMMvwNoPMWvP',
                    channelUrl: 'http://sfbdemo3.ngrok.io/connectors/v1/tenants/chatbot-tenant/listeners/webhook/channels/E7C634DF-725B-4A3C-91A0-E90F44582D7D'
                }
            }
        }
    },
    stage: {
        port: Number(process.env.PORT || 8080),
        logLevel: 'INFO',
        socketHost: 'euwebsocketapp-sofbangmobile.uscom-central-1.oraclecloud.com',
        channels: {
            COMED: {
                google: {
                    id: '8501F9A5-E719-4716-BD0C-A397F1A0EAAE',
                    name: 'ExelonCOMEDUtilityTest'
                },
                alexa: {
                    waitForMoreResponsesMs: 200,
                    amzn_appId: "amzn1.ask.skill.78de290d-b2ef-4003-89a5-ebaecbfacbf6",
                    channelSecretKey: 'g4aLDEy27eCfUYfxVfAN7mSMiQLMWTkE',
                    channelUrl: 'https://sfbdemo3.ngrok.io/connectors/v1/tenants/chatbot-tenant/listeners/webhook/channels/F1B81354-F139-4909-AFF5-B9D77F55CEA0'
                }
            },
            BGE: {
                google: {
                    id: '8C7AD0C9-437F-48F2-AC95-1955ACC9908D',
                    name: 'ExelonBGEUtilityTest'
                },
                alexa: {
                    waitForMoreResponsesMs: 200,
                    amzn_appId: "amzn1.ask.skill.1a558578-efd6-4c3a-b094-40f5868b7334",
                    channelSecretKey: 'Jv6Iyq02P582B6wpOgd2Z1tnl1a52Suc',
                    channelUrl: 'https://sfbdemo3.ngrok.io/connectors/v1/tenants/chatbot-tenant/listeners/webhook/channels/54955993-8196-4FB9-9285-43B48783EE12'
                }
            }
        }
    },
    prod: {
        port: 9000,
        logLevel: 'INFO',
        channels: {
            COMED: {
                google: {
                    id: '6B7DB2BA-CA8F-40FD-9B56-820F6A348EFB',
                    name: 'ExelonCOMEDUtilityTest'
                },
                alexa: {
                    waitForMoreResponsesMs: 200,
                    amzn_appId: "amzn1.ask.skill.08d961b6-ab5b-4859-a1ad-b02df9b0f82c",
                    channelSecretKey: 'iw2IkuMRId4f4YRfcL2obrk41pJ1fqQK',
                    channelUrl: 'http://bots-connectors:8000/connectors/v1/tenants/chatbot-tenant/listeners/webhook/channels/23349155-FCD6-4726-BE43-EB92F4FF140F'
                }
            },
            BGE: {
                google: {
                    id: '77CCE6DA-2E05-4DED-87D9-25EE1167E29C',
                    name: 'ExelonBGEUtilityTest'
                },
                alexa: {
                    waitForMoreResponsesMs: 200,
                    amzn_appId: "amzn1.ask.skill.08d961b6-ab5b-4859-a1ad-b02df9b0f82c",
                    channelSecretKey: 'iw2IkuMRId4f4YRfcL2obrk41pJ1fqQK',
                    channelUrl: 'http://bots-connectors:8000/connectors/v1/tenants/chatbot-tenant/listeners/webhook/channels/23349155-FCD6-4726-BE43-EB92F4FF140F'
                }
            }
        }
    }
}

exports.get = function get(env) {
    return appConfig[env] || appConfig.dev;
}