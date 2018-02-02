/**
 * Created by Gurkirat Singh on 02/02/2018.
 */
var mcsConfig = {
    baseUrl: "https://exeloneumobileapptest-a453576.mobileenv.us2.oraclecloud.com",
    authToken: "YW5vbl90c3Q6NkclUXViQGxaQm1vZ09xJFc4Qlg=",
    backendId: "7ebd1165-aae4-452f-8f7b-6c6cbdd93667",
    userAgent: "ChatBot/1.0"
}

exports.get = function get() {
    return mcsConfig;
}