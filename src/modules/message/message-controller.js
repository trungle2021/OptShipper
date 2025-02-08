const COMMANDS = require('../../utils/commands');
const messageService = require('./message-service');
const webhookService = require('../webhook/webhook-service')

const handleMessage = async (sender_psid, received_message) => {
    let response;
    const message_content = received_message.text.trim();
    
    // Check if the message contains text
    if (message_content) {    
        if (Object.values(COMMANDS).some(command => command === message_content)){
            response = {
                "text": await messageService.handleCommandMessage(message_content)
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

const handleOrderMessage = async (sender_psid, received_message) => {
    let response;
    const message_content = received_message.text.trim();
    response = {
        "text": await messageService.analyzeMessage(message_content)
    };

    webhookService.callSendAPI(sender_psid, response);  
}

module.exports = { handleMessage, handleOrderMessage}