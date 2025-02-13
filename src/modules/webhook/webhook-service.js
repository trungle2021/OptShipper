const request = require('request');

// Sends response messages via the Send API
const callSendAPI = async (sender_psid, response) => {
    // Construct the message body
    let request_body = {
      "recipient": {
        "id": sender_psid
      },
      "messaging_type": "RESPONSE",
      "message": response
    }
  
    // Send the HTTP request to the Messenger Platform
    request({
      "uri": "https://graph.facebook.com/v22.0/me/messages",
      "qs": { "access_token": process.env.PAGE_ACCESS_TOKEN },
      "method": "POST",
      "json": request_body
    }, (err, res, body) => {
      if (!err) {
        console.log('message sent!')
      } else {
        console.error("Unable to send message:" + err);
      }
    }); 
}

const sendPostbackMessage = async (sender_psid, postBackText, postBackArray) => {
    const response = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": postBackText,
                "buttons": postBackArray
            }
        }
    };

    await callSendAPI(sender_psid, response);
}

module.exports = {
    callSendAPI,
    sendPostbackMessage
}