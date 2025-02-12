const { openai, modelName } = require('../../config/ai-models/openai')
const COMMANDS = require('../../utils/commands')
const redis = require('../../utils/redis/redis')
const mapService = require('../map/map-service')
const webhookService = require('../webhook/webhook-service')
const ORDER_SESSION_KEY = process.env.ORDER_SESSION_KEY;
const USER_STATE_KEY = process.env.USER_STATE_KEY;

const handleNormalMessage = async (message_content, sender_psid) => {
    try {
        const systemPrompt =
            `You are an Order Processing Assistant AI Chatbot. Your primary role is to assist users with managing and optimizing their order processing tasks. Follow these guidelines to interact effectively:
### 1. *Route Optimization Requests*  
   If a user inquires about optimizing routes between orders, provide them with the following commands:  
   - */start*: Mở một session mới.  
   - */go*: Kết thúc session và trả về link google map.
   - */syntax*: Hiển thị tất cả các lệnh cú pháp.  
   - */about*: Giới thiệu về chatbot.  
   - */sender-psid*: Lấy Page-Scoped ID (PSID) của user hiện tại.  
   - */cancel*: Xóa session hiện tại.  
   - */view*: Hiển thị tất cả đơn hàng trong session hiện tại.  
   - */clear*: Xóa tất cả đơn hàng trong session hiện tại.  
   - */remove ORDERID*: Xóa đơn hàng theo ORDERID.  

### 2. *General Inquiries*  
   If the user sends a general message *without order-related keywords*, respond naturally in JSON format. The response should be relevant to the user's question.
 Return JSON format:  
  {
    "success": boolean,
    "message": string
  }
### 3. *Order Extraction (Only If Message Contains Order Keywords)*  
   If the message includes order-related keywords like "đơn hàng", "ship", "tổng", "địa chỉ", "SĐT", etc., extract the following information (return "null" if not found):

   - "customer_name": Name from context  
   - "shipping_fee": Delivery fee (number with 'k' suffix)  
   - "order_details": Items ordered  
   - "total_amount": Total price (number with 'k' suffix)  
   - "delivery_address": Complete address  
   - "phone_number": Contact number  
   - "payment_method": 'COD' or 'Ck'  
   - "note": Special delivery instructions  

   *Return JSON format:*  
   {
       "success": true,
       "is_order_valid": true,
       "message": {
           "customer_name": "Trần Thuỵ Ngọc Huyền",
           "shipping_fee": 25,
           "order_details": "2 sợi cay vừa 500gr",
           "total_amount": 1045,
           "delivery_address": "Cổng A Nhà điều hành Đại học Quốc gia TP.HCM, đường Võ Trường Toản, KP6, Phường Linh Trung, Thủ Đức, HCM",
           "phone_number": "0868411097",
           "payment_method": "Ck",
           "note": null
       }
   }`;


        const userPrompt = message_content
        const response = await openai.chat.completions.create({
            model: modelName,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
            response_format: { type: "json_object" }
        })
        const jsonResponse = JSON.parse(response.choices[0].message.content);

        if (jsonResponse['success'] && jsonResponse['is_order_valid']) {
            return handleOrderMessage(sender_psid, jsonResponse.message);
        }

        return jsonResponse.message;
    } catch (error) {
        console.error('Error analyzing message:', error)
        throw error
    }
}

const handleCommandMessage = async (message_content, sender_psid) => {
    switch (message_content) {
        case COMMANDS.START:
            return startOrderSession(sender_psid);
        case COMMANDS.END:
            return finishOrderSession(sender_psid);
        case COMMANDS.SYNTAX:
            return handleSyntaxCommand();
        case COMMANDS.ABOUT:
            return handleShowAbout();
        case COMMANDS.CANCEL:
            return handleCancelCurrentOrderSession(sender_psid);
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

const handleOrderMessage = async (sender_psid, received_message) => {
    try {
        let response;
        const sessionKey = ORDER_SESSION_KEY.replace("SENDER_PSID", sender_psid);
        // Get orders array from parent function
        let orders = JSON.parse(await redis.get(sessionKey)) || [];
        const { lat, lng } = await mapService.getLatLngFromAddress(received_message.delivery_address);
        const order = {
            address: received_message.delivery_address,
            lat,
            lng
        }

        orders.push(order);

        // Save to Redis
        await redis.set(sessionKey, JSON.stringify(orders));

        response = {
            "text": `Thêm đơn hàng thành công. Tổng cộng: ${orders.length} đơn hàng.`
        };

        webhookService.callSendAPI(sender_psid, response);
    } catch (error) {
        console.error('Error handling order message:', error);
        const errorResponse = {
            "text": "Có lỗi trong quá trình xử lý, vui lòng thử lại."
        };
        webhookService.callSendAPI(sender_psid, errorResponse);
    }
}

const startOrderSession = async (sender_psid) => {
    try {
        const sessionKey = ORDER_SESSION_KEY.replace("SENDER_PSID", sender_psid);
        const orderList = []

        const existingOrderSession = await redis.get(sessionKey);

        if (existingOrderSession) {
            return "Session đã tồn tại. Bạn có thể gửi thông tin đơn hàng. Gõ /end khi hoàn tất."
        }
        // init new session with empty array
        await redis.set(sessionKey, JSON.stringify(orderList));

        const postBackArray = [
            {
                "type": "postback",
                "title": "Nhập địa chỉ khởi hành",
                "payload": "INSERT_START_ADDRESS"
            },
            {
                "type": "postback",
                "title": "Dùng vị trí hiện tại",
                "payload": "RETRIEVE_CURRENT_LOCATION"
            }
        ]
        await webhookService.sendPostbackMessage(sender_psid, "Choose your location", postBackArray);


        return "Bắt đầu session giao hàng. Bạn có thể gửi thông tin đơn hàng. Gõ /end khi hoàn tất.";

    } catch (error) {
        console.error("Error starting new order session", error)
        throw error;
    }
}

const finishOrderSession = async (sender_psid) => {
    const sessionKey = ORDER_SESSION_KEY.replace("SENDER_PSID", sender_psid);

    const existingOrderSession = await redis.get(sessionKey);
    if (existingOrderSession) {
        const orders = JSON.parse(existingOrderSession);

        webhookService.callSendAPI(sender_psid, {
            "text": `Hoàn thành session giao hàng. Đang tối ưu lộ trình cho ${orders.length} đơn hàng.`
        })

        // const mapLink = await mapService.generateMapLink(orders);
        let mapLink = "https://www.google.com/maps";

        return "Sau đây là lộ trình tối ưu cho đơn hàng của bạn: " + mapLink;
    } else {
        return "Hiện tại đang không có session nào. Thử /start để mở session mới."
    }
}

const handleSyntaxCommand = async () => {
    return `
   - */start*: Mở một session mới.  
   - */go*: Kết thúc session và trả về link google map.
   - */syntax*: Hiển thị tất cả các lệnh cú pháp.  
   - */about*: Giới thiệu về chatbot.  
   - */sender-psid*: Lấy Page-Scoped ID (PSID) của user hiện tại.  
   - */cancel*: Xóa session hiện tại.  
   - */view*: Hiển thị tất cả đơn hàng trong session hiện tại.  
   - */clear*: Xóa tất cả đơn hàng trong session hiện tại.  
   - */remove ORDERID*: Xóa đơn hàng theo ORDERID.  
    `
}

const handleCancelCurrentOrderSession = async (sender_psid) => {
    try {
        if (!sender_psid) {
            return "Missing sender PSID";
        }
        const sessionKey = ORDER_SESSION_KEY.replace("SENDER_PSID", sender_psid);
        const existingOrderSession = await redis.get(sessionKey);

        if (!existingOrderSession) {
            return "Hiện tại không có session nào. Thử /start để tạo session mới.";
        }

        await redis.del(sessionKey);
        return "Xóa session thành công.";
    } catch (error) {
        console.error("Error cancelling order session:", error);
        throw error;
    }
}

const getAllCurrentOrder = async (sender_psid) => {
    try {
        if (!sender_psid) {
            return "Missing sender PSID";
        }
        const sessionKey = ORDER_SESSION_KEY.replace("SENDER_PSID", sender_psid);

        let orders = JSON.parse(await redis.get(sessionKey)) || undefined;
        if (orders === undefined) {
            return "Hiện không có session nào đang mở. Thử /start để mở session mới.";
        }

        if (orders.length === 0) {
            return "Hiện không có đơn hàng nào trong session";
        }

        const userStateKey = USER_STATE_KEY.replace('SENDER_PSID', sender_psid);
        const userState = JSON.parse(await redis.get(userStateKey));
        const startAddress = userState?.startAddress?.address || "Chưa có thông tin";

        let responseMessage = "Lộ trình hiện tại:\n";
            responseMessage += `**Điểm khởi hành: ${startAddress}.\n`;
        orders.forEach((order, index) => {
            responseMessage += `${index + 1}. ${order?.address}\n`;
        });

        return responseMessage;
    } catch (error) {
        console.error("Error when retrieving all orders", error);
        throw error;
    }
}

const clearAllOrderInCurrentSession = async (sender_psid) => {
    try {
        if (!sender_psid) {
            return "Missing sender PSID";
        }
        const sessionKey = ORDER_SESSION_KEY.replace("SENDER_PSID", sender_psid);
        const existingOrderSession = await redis.get(sessionKey);

        if (!existingOrderSession) {
            return "Hiện không có session nào đang mở. Thử /start để mở session mới."
        }

        await redis.set(sessionKey, JSON.stringify([]));
        return "Đã xóa toàn bộ đơn hàng trong session hiện tại";
    } catch (error) {
        console.error("Error clearing all orders in current session", error)
        throw error;
    }
}

const removeOrderByOrderID = async (sender_psid, orderID) => {
    try {
        if (!sender_psid) {
            return "Missing sender PSID";
        }
        if (!orderID) {
            return "Missing order ID";
        }
        const sessionKey = ORDER_SESSION_KEY.replace("SENDER_PSID", sender_psid);
        let orders = JSON.parse(await redis.get(sessionKey)) || [];
        if (orders.length === 0) {
            return "Hiện không có đơn hàng nào trong session";
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

const handleAddressMessage = async (message_content, sender_psid) => {
    // Handle address message
    const userStateKey = USER_STATE_KEY.replace('SENDER_PSID', sender_psid);
    const userState = JSON.parse(await redis.get(userStateKey));
    const systemPrompt = `You are an order processing assitant, you will check the address is valid or not. If the address is valid, you will return as json format 
    {
        "success": true,
        "message": {
            "address": string,
            "lat": null,
            "lng": null
        }
    }
    If not, you will return this json format 
    {
        "success": false,
        "message": "Địa chỉ không hợp lệ, vui lòng nhập lại"
    }`;

    const userPrompt = message_content;
    const response = await openai.chat.completions.create({
        model: modelName,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
    })
    const jsonResponse = JSON.parse(response.choices[0].message.content);
    if (jsonResponse['success']) {
        let clonedUserState = { ...userState };
        const {lat, lng} = await mapService.getLatLngFromAddress(message_content);
        const startAddress = {
            address: message_content,
            lat,
            lng
        }
        clonedUserState.action = clonedUserState.action.filter(action => action !== 'awaiting_start_address_input');
        clonedUserState = {
            ...clonedUserState,
            startAddress
        }

        // Save address to Redis
        await redis.set(userStateKey, JSON.stringify(clonedUserState));
        return "Lưu điểm khởi hành thành công, vui lòng tiếp tục thêm các điểm dừng";
    }
    return jsonResponse.message;

}

const handleShowAbout = async () => {
    return `Đây là một chatbot AI giúp người dùng quản lý và tối ưu hóa các tác vụ xử lý đơn hàng của họ. Bot có thể hỗ trợ tối ưu hóa tuyến đường, trích xuất đơn hàng và các yêu cầu chung.`
}

module.exports = {
    handleNormalMessage,
    handleCommandMessage,
    handleAddressMessage
}
