/**
 * Created by Gurkirat Singh on 02/02/2018.
 */
var mcsConfig = {
    baseUrl: "https://exelonmobileapp-a453576.mobileenv.us2.oraclecloud.com:443",
    authToken: "YW5vbl9wcmQ6Y0Y4UiF4MXVCb1pvbGQ0WTFEdSM=",
    backendId: "6681b1e8-bf86-40c2-8faf-66b140c76cea",
    userAgent: "ChatBot/1.0"
}

exports.get = function get() {
    return mcsConfig;
}
