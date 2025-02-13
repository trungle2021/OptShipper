const COMMANDS = require('../../utils/commands');
const messageService = require('./message-service');
const webhookService = require('../webhook/webhook-service');
const USER_STATE_KEY = process.env.USER_STATE_KEY;
const redis = require('../../utils/redis/redis');

const handleMessage = async (sender_psid, received_message) => {
    try {
        let response;
        const message_content = received_message.text;

        // Check if the message contains text
        if (message_content) {
            const isCommand = Object.values(COMMANDS).some(command => command === message_content)

            if (isCommand) {
                response = {
                    "text": await messageService.handleCommandMessage(message_content, sender_psid)
                };
            } else {
                const userStateKey = USER_STATE_KEY.replace('SENDER_PSID', sender_psid);
                const userState = await redis.get(userStateKey)
                const userStateObj = JSON.parse(userState);
                let isAwaitingStartAddressInput = false;

                if (userStateObj && Array.isArray(userStateObj.action)) {
                    for (const action of userStateObj.action) {
                        if (action === 'awaiting_start_address_input') {
                            isAwaitingStartAddressInput = true;
                            break;
                        }
                    }
                }
                
                if (isAwaitingStartAddressInput) {
                    response = {
                        "text": await messageService.handleAddressMessage(message_content, sender_psid)
                    };
                    webhookService.callSendAPI(sender_psid, response);
                    return;
                } 
                response = {
                    "text": await messageService.handleNormalMessage(message_content, sender_psid)
                };
            }
        }

        console.log("The response: ", response)
        webhookService.callSendAPI(sender_psid, response);
    } catch (error) {
        console.log("Error in handleMessage: ", error)
    }
}



module.exports = { handleMessage }