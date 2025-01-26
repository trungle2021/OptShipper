const sendMessage = async (req, res) => {
    const { message } = req.body;
    const response = analyzeMessage(message);
    console.log(response);

    // res.status(200).json({ response });
    // res.status(200).json({ message });
};

module.exports = { sendMessage };
