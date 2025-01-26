const analyzeMessage = require('../services/message/analyze-message')
const sendMessage = async (req, res) => {
    const { message } = req.body;
    const response = await analyzeMessage(message);
    console.log(response);
    res.status(200).json({ response });

    // res.status(200).json({ response });
    // res.status(200).json({ message });
};

module.exports = { sendMessage };
