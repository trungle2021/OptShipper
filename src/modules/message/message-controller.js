const COMMANDS = require('../../utils/commands');
const messageService = require('./message-service');
const webhookService = require('../webhook/webhook-service');
const redis = require('../../utils/redis/redis');

const handleMessage = async (sender_psid, received_message) => {
    let response;
    const message_content = received_message.text.trim();
    
    // Check if the message contains text
    if (message_content) {
        const isCommand = Object.values(COMMANDS).some(command => command === message_content)
       
        if (isCommand){
            response = {
                "text": await messageService.handleCommandMessage(message_content, sender_psid)
            };
        }else{
            response = {
                "text": await messageService.handleNormalMessage(message_content)
            };
        }
    }else{
        response = {
            "text": "How can i help you ?"
        };
    }
    console.log("The response: ", response)
    webhookService.callSendAPI(sender_psid, response);  
}



module.exports = { handleMessage}