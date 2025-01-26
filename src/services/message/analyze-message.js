const {openai, modelName} = require('../../models/openai')

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

module.exports = analyzeMessage
