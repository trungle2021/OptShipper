const webhookService = require('../webhook/webhook-service');
const redis = require('../../utils/redis/redis');
const USER_STATE_KEY = process.env.USER_STATE_KEY;

const handlePostBackMessage = async (sender_psid, postback) => {
    try {
        let response;
        const payload = postback.payload;
        const userStateKey = USER_STATE_KEY.replace('SENDER_PSID', sender_psid);

        switch (payload) {
                case "INSERT_START_ADDRESS":
                    response = {
                        "text": "Hãy nhập địa chỉ khởi hành của bạn"
                    };
                    // Store user state in Redis
                    await redis.set(userStateKey, JSON.stringify({ action: ['awaiting_start_address_input'] }));
                    break;
            // case "RETRIEVE_CURRENT_LOCATION":
            //     response = {
            //         text: "Vui lòng chia sẻ vị trí hiện tại của bạn:",
            //         quick_replies: [
            //             {
            //                 "content_type": "location"
            //             }
            //         ]
            //     };
            //     // Store user state in Redis
            //     await redis.set(userStateKey, JSON.stringify({ action: 'retrieving_current_location' }));
            //     break;
            default:
                response = {
                    "text": "Invalid Postback"
                };
        }

        await webhookService.callSendAPI(sender_psid, response);
    } catch (error) {
        console.log("Error in handlePostBackMessage: ", error);
    }
}

module.exports = { handlePostBackMessage };