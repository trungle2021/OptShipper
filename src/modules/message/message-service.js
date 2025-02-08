const {openai, modelName} = require('../../config/ai-models/openai')

const analyzeMessage = async (message) => {
    try {
        const systemPrompt = 
        `You are an order processing assistant that extracts order information from Vietnamese messages.
        Please analyze the input message and extract the following information:
        - customer_name: Extract from context or mark as "Unknown" if not found
        - shipping_fee: Extract shipping/delivery fee (the shipping fee usually a number has the word "k" at the end, if not found, mark as null)
        - order_details: Extract order details
        - total_amount: Extract total amount (number only, the total amount usually a number has the word "k" at the end, if not found, mark as null)
        - delivery_address: Extract full address
        - phone_number: Extract phone number
        - payment_method: Identify if it's COD (cash on delivery) or Ck
        - note: Extract any special notes about delivery time or other requirements

        Return the data in valid JSON format with these exact field names. 
        Numbers should be returned as numbers, not strings.
    If any field is not found, use null as the value.`
    const userPrompt = message
    const response = await openai.chat.completions.create({
        model: modelName,
        messages: [
            {role: 'system', content: systemPrompt},
            {role: 'user', content: userPrompt}
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
    })
    return JSON.parse(response.choices[0].message.content)
    } catch (error) {
        console.error('Error analyzing message:', error)
        throw error
    }
}

const handleNormalMessage = async (message_content) => {
    try {
        const systemPrompt = 
        `You are an Order Processing Assistant AI Chatbot. Your primary role is to assist users with managing and optimizing their order processing tasks. Follow these guidelines to interact effectively:
        1. Route Optimization Requests:
            If a user inquires about optimizing routes between orders, provide them with the following commands:
                -/start: Inform the user that this command starts a new order session.
                -/go: Explain that this command ends the current session and provides a link to optimized routes.
                -/about: Offer an introduction to the chatbot and its functionalities.
        2. General Inquiries:
            Respond to any simple questions from users with clear and concise answers.
            Maintain a friendly and helpful tone in all interactions.
        3. User Engagement:
            Encourage users to utilize the commands for efficient order processing.
            Be proactive in offering assistance and clarifying any doubts the user may have.
            Your goal is to ensure users have a smooth and efficient experience while interacting with the chatbot. Always prioritize clarity and helpfulness in your responses.
        Return the response as a message in JSON format.`
    const userPrompt = message_content
    const response = await openai.chat.completions.create({
        model: modelName,
        messages: [
            {role: 'system', content: systemPrompt},
            {role: 'user', content: userPrompt}
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
    })
    const jsonResponse = JSON.parse(response.choices[0].message.content);
    return jsonResponse['message'];
    } catch (error) {
        console.error('Error analyzing message:', error)
        throw error
    }
}

const handleCommandMessage = async (message_content) => {
    switch (message_content){
        case COMMANDS.START: 
        case COMMANDS.GO: 
        case COMMANDS.HELP: 
        case COMMANDS.ABOUT: 
    }
}

module.exports = {analyzeMessage, handleNormalMessage, handleCommandMessage}
