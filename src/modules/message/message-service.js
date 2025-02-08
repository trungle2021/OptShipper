const {openai, modelName} = require('../../config/ai-models/openai')
const COMMANDS = require('../../utils/commands')
const redis = require('../../utils/redis/redis')
const mapService = require('../map/map-service')
const webhookService = require('../webhook/webhook-service')
const ORDER_SESSION_KEY = process.env.ORDER_SESSION_KEY;


const analyzeMessage = async (message) => {
    try {
        const systemPrompt = 
        `You are an order processing assistant that extracts order information from Vietnamese messages.
            Example order formats:
            1. "Đơn hàng của chị
            2 sợi cay vừa 500gr 1020k
            Ship 25k
            Tổng 1045k
            Địa chỉ: Homyland 3 Nguyễn Duy Trinh - Quận 2
            Sđt: +84383234234
            Đã Ck"

            2. "Thông tin giao hàng:
            Trần Thuỵ Ngọc Huyền
            SĐT: 0868411097
            ĐC: Cổng A Nhà điều hành Đại học Quốc gia TP.HCM, đường Võ Trường Toản, KP6, Phường Linh Trung, Thủ Đức, HCM"

            Extract the following information (return null if not found):
            - customer_name: Name from context
            - shipping_fee: Delivery fee (number with 'k' suffix)
            - order_details: Items ordered
            - total_amount: Total price (number with 'k' suffix)
            - delivery_address: Complete address
            - phone_number: Contact number
            - payment_method: 'COD' or 'Ck'
            - note: Special delivery instructions

            Return valid JSON with exact field names. Use numbers for amounts, not strings.
            Return "Incorrect order format, please try again or type /syntax to see more" for english user and "Sai định dạng thông tin đơn hàng, vui lòng thử lại hoặc nhập /syntax để xem lại cú pháp" for vietnamese user if input is not order-related.`
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

const handleCommandMessage = async (message_content, sender_psid) => {
    switch (message_content){
        case COMMANDS.START: 
            return startOrderSession(sender_psid);
        case COMMANDS.END: 
            return finishOrderSession(sender_psid);
        case COMMANDS.ABOUT: 
            return handleShowAbout();
    }
}

const startOrderSession = async (sender_psid) => {
    try{
        const sessionKey = ORDER_SESSION_KEY.replace("SENDER_PSID", sender_psid);
        const orderList = []
 
        const existingOrderSession = await redis.get(sessionKey);
        
        if (existingOrderSession){
            return "Order session already opened. You can now send your orders. Type /end when finished."
        }
        // init new session with empty array
        await redis.set(sessionKey, JSON.stringify(orderList));
        
        return "Started new order session. You can now send your orders. Type /end when finished.";

    }catch(error){
        console.error("Error starting new order session", error)
        throw error;
    }
}

const finishOrderSession = async (sender_psid) => {
    const sessionKey = ORDER_SESSION_KEY.replace("SENDER_PSID", sender_psid);

    const existingOrderSession = await redis.get(sessionKey);
    if (existingOrderSession){
        const orders = JSON.parse(existingOrderSession);

        webhookService.callSendAPI(sender_psid, {
            "text": `Order session completed. Processing ${orders.length} orders.`
        })

        return await mapService.handleGenerateMapLink(orders);
    }else{
        return "No order session is opening. Try /start to open session"
    }
}

module.exports = {
    analyzeMessage,
    startOrderSession,
    finishOrderSession,
    handleNormalMessage, 
    handleCommandMessage,
}
