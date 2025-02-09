const {openai, modelName} = require('../../config/ai-models/openai')
const COMMANDS = require('../../utils/commands')
const redis = require('../../utils/redis/redis')
const mapService = require('../map/map-service')
const webhookService = require('../webhook/webhook-service')
const ORDER_SESSION_KEY = process.env.ORDER_SESSION_KEY;

const handleNormalMessage = async (message_content) => {
    try {
        const systemPrompt = 
        `You are an Order Processing Assistant AI Chatbot. Your primary role is to assist users with managing and optimizing their order processing tasks. Follow these guidelines to interact effectively:
        1. Route Optimization Requests:
            If a user inquires about optimizing routes between orders, provide them with the following commands:
                -/start: Inform the user that this command starts a new order session.
                -/go: Explain that this command ends the current session and provides a link to optimized routes.
                -/about: Offer an introduction to the chatbot and its functionalities.
                -/sender-psid: Get the Page-Scoped ID (PSID) of the current user.
                -/cancel: Delete/close the current active order session.
                -/view: Display all orders for the current session.
                -/clear: Remove all orders in the current session.
                -/remove ORDERID: Remove a specific order using its unique order ID 
        2. General Inquiries:
            Respond to any simple questions from users with clear and concise answers.
            Maintain a friendly and helpful tone in all interactions.
        3. User Engagement:
            Encourage users to utilize the commands for efficient order processing.
            Be proactive in offering assistance and clarifying any doubts the user may have.
            Your goal is to ensure users have a smooth and efficient experience while interacting with the chatbot. Always prioritize clarity and helpfulness in your responses.
        
        Additionally, you are an order processing assistant that extracts order information from Vietnamese messages.
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
        {
            "success": true,
            "is_order_valid": true,
            "message": {
                "customer_name": string | null,
                "shipping_fee": number | null,
                "order_details": string | null,
                "total_amount": number | null,
                "delivery_address": string | null,
                "phone_number": string | null,
                "payment_method": string | null,
                "note": string | null
            },
        }
        For invalid orders, return:
        {
            "success": false,
            "message": "Sai định dạng thông tin đơn hàng, vui lòng thử lại hoặc nhập /syntax để xem lại cú pháp"
        }`

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
        const jsonResponse = JSON.parse(response.choices[0].message.content).message;

        if (jsonResponse['success'] && jsonResponse['is_order_valid']){
           return handleOrderMessage(jsonResponse['message'], sender_psid);
        } 


        return jsonResponse;
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
        case COMMANDS.HELP: 
            return handleHelpCommand();
        case COMMANDS.ABOUT: 
            return handleShowAbout();
        case COMMANDS.CANCEL: 
            return handleCancelCurrentOrderSession();
        case COMMANDS.RETRIEVE_ALL_ORDER: 
            return getAllCurrentOrder(sender_psid);
        case COMMANDS.CLEAR_ALL_ORDER: 
            return clearAllOrderInCurrentSession(sender_psid);
        case COMMANDS.REMOVE_ORDER_BY_ORDERID: 
            return removeOrderByOrderID(sender_psid);
        case COMMANDS.GET_SENDER_PSID:
            return `${sender_psid}`;
        default: 
            return 'Incorrect syntax';
    }
}

const handleOrderMessage = async (sender_psid, received_message, sessionKey) => {
    try {
        let response;
        // Get orders array from parent function
        let orders = JSON.parse(await redis.get(sessionKey)) || [];
        const order = received_message
        
        if (!order.success){
            response = {
                "text": order.message
            };
            webhookService.callSendAPI(sender_psid, response);
            return;
        }
        orders.push(order);
        
        // Save to Redis
        await redis.set(sessionKey, JSON.stringify(orders));
        
        response = {
            "text": `Order inserted successfully. Total orders: ${orders.length}`
        };

        webhookService.callSendAPI(sender_psid, response);
    } catch (error) {
        console.error('Error handling order message:', error);
        const errorResponse = {
            "text": "Sorry, there was an error processing your order. Please try again."
        };
        webhookService.callSendAPI(sender_psid, errorResponse);
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

const handleHelpCommand = async () => {

}

const handleCancelCurrentOrderSession = async (sessionKey) => {
    try {
        await redis.del(sessionKey);
        return "Order session cancelled successfully.";
    } catch (error) {
        console.error("Error cancelling order session:", error);
        throw error;
    }
}
const getAllCurrentOrder = async (sessionKey) => {
    try {
        let orders = JSON.parse(await redis.get(sessionKey)) || [];
        if (orders.length === 0) {
            return "No order in current session";
        }

        let responseMessage = "Current orders:\n";
        orders.forEach((order, index) => {
            responseMessage += `${index + 1}. ${order}\n`;
        });

        return responseMessage;
    } catch (error) {
        console.error("Error when retrieving all orders", error);
        throw error;
    }
}
const clearAllOrderInCurrentSession = async (sessionKey) => {
    const existingOrderSession = await redis.get(sessionKey);
    if (existingOrderSession){
        await redis.set(sessionKey, JSON.stringify([]));
        return "All orders in current session have been removed";
    }else{
        return "No order session is opening. Try /start to open session"
    }
}

const removeOrderByOrderID = async (sessionKey, orderID) => {
    try {
        let orders = JSON.parse(await redis.get(sessionKey)) || [];
        if (orders.length === 0) {
            return "No order in current session";
        }

        if (orderID < 1 || orderID > orders.length) {
            return "Invalid order ID";
        }

        orders.splice(orderID - 1, 1);
        await redis.set(sessionKey, JSON.stringify(orders));

        return `Order ${orderID} has been removed`;
    } catch (error) {
        console.error("Error when removing order by order ID", error);
        throw error;
    }
}

module.exports = {
    startOrderSession,
    finishOrderSession,
    handleNormalMessage, 
    handleCommandMessage,
    handleHelpCommand,
    handleCancelCurrentOrderSession,
    getAllCurrentOrder,
    clearAllOrderInCurrentSession,
    removeOrderByOrderID
}
