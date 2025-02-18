const messageController = require('../message/message-controller');
const postBackController = require('../postback/postback-controller');
const redis = require('../../utils/redis/redis');
const ORDER_SESSION_KEY = process.env.ORDER_SESSION_KEY;

const handleWebhookEvent = async (req, res) => {
     try{
         // Parse the request body from the POST
      let body = req.body;

      // Check the webhook event is from a Page subscription
      if (body.object === 'page') {
  
          // Iterate over each entry - there may be multiple if batched
          body.entry.forEach(async function (entry) {
  
              // Get the webhook event. entry.messaging is an array, but 
              // will only ever contain one event, so we get index 0
              let webhook_event = entry.messaging[0];
              console.log(webhook_event);
  
  
              // Get the sender PSID
              let sender_psid = webhook_event.sender.id;
              console.log('Sender PSID: ' + sender_psid);
  
              // Check if the event is a message or postback and
              // pass the event to the appropriate handler function
              if (webhook_event.message) {
                    messageController.handleMessage(sender_psid, webhook_event.message);
              } else if (webhook_event.postback) {
                  postBackController.handlePostBackMessage(sender_psid, webhook_event.postback);
              }
  
          });
          res.status(200).send('EVENT_RECEIVED');
      } else {
          res.sendStatus(404);
      }
     }catch(error){
         console.log("Error in handleWebhookEvent: ", error);
     }
}

module.exports = {
    handleWebhookEvent
}