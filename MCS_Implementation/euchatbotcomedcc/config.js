/**
 * Created by Gurkirat Singh on 02/02/2018.
 */
var mcsConfig = {
    baseUrl: "https://exelonmobileapp-a453576.mobileenv.us2.oraclecloud.com:443",
    authToken: "YW5vbl9wcmQ6Y0Y4UiF4MXVCb1pvbGQ0WTFEdSM=",
    backendId: "e4018111-369f-418e-9d31-e95377170d0e",
    userAgent: "ChatBot/1.0"
}

exports.get = function get() {
    return mcsConfig;
}
