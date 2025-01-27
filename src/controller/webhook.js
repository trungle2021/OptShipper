const analyzeMessage = require('../services/message/analyze-message')
const orderService = require('../services/order-service')

const sendMessage = async (req, res) => {
    const { message } = req.body;
    const order = await analyzeMessage(message);
    const response = await orderService.createOrder(order);
    console.log("response", response);
    console.log(order);
    res.status(200).json({ order });
};

module.exports = { sendMessage };
