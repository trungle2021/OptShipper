const analyzeMessage = require('../services/message/analyze-message')
const createOrder = require('../services/order-service')

const sendMessage = async (req, res) => {
    const { message } = req.body;
    const order = await analyzeMessage(message);
    const response = await createOrder(order);
    console.log(response);
    res.status(200).json({ response });
};

module.exports = { sendMessage };
