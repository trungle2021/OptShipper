const express = require('express');
const router = express.Router();
const { sendMessage, handleMessage, handlePostback } = require('./webhook-service');
const webhookController = require('./webhook-controller');

// router.post('/send-message', sendMessage);
router.post('/', webhookController.handleWebhookEvent);

router.get('/', (req, res) => {
    const VERIFY_TOKEN = 'abc';

    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    }
});

module.exports = router;