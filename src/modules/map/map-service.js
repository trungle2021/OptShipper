const HERE_API_KEY = process.env.HERE_API_KEY;
const axios = require('axios');
const USER_STATE_KEY = process.env.USER_STATE_KEY;
const redis = require('../../utils/redis/redis');
const TinyUrlService = require('../shorten_url/tinyurl-service');
const ORDER_SESSION_KEY = process.env.ORDER_SESSION_KEY;


const generateMapLink = async (sender_psid, orders) => {
    try {
        if (!orders || orders.length === 0) {
            throw new Error('No orders provided');
        }

        const sessionKey = ORDER_SESSION_KEY.replace('SENDER_PSID', sender_psid);
        const isSessionExist = await redis.exists(sessionKey);
        if (!isSessionExist) {
            throw new Error('No session found');
        }
        const userStateKey = USER_STATE_KEY.replace('SENDER_PSID', sender_psid);
        const userState = JSON.parse(await redis.get(userStateKey));

        if (userState.mapLink) return userState.mapLink;

        const startAddress = userState?.startAddress;

        if (!startAddress) {
            throw new Error('Start address not found');
        }

        const optimizedOrders = await optimizeRoutes(startAddress, orders);
        await redis.set(sessionKey, JSON.stringify(optimizedOrders));

        const baseURL = "https://www.google.com/maps/dir/?api=1";
        const origin = `&origin=${encodeURIComponent(startAddress.address)}`;
        const destination = `&destination=${encodeURIComponent(optimizedOrders[optimizedOrders.length - 1].address)}`;
        const waypoints = optimizedOrders.slice(0,-1).map(order => encodeURIComponent(order.address)).join('|');
        const travelMode = `&travelmode=driving`;
        const mapLink = `${baseURL}${origin}${destination}&waypoints=${waypoints}${travelMode}`;
        const shortenUrl = await TinyUrlService.shortenUrl(mapLink);
        userState.mapLink = shortenUrl;
        await redis.set(userStateKey, JSON.stringify(userState));
        return await shortenUrl(mapLink);
    } catch (error) {
        console.error('Error generating map link:', error);
        let errorMessage = 'Đã xảy ra lỗi khi tạo liên kết bản đồ. Vui lòng thử lại sau.';
        if (error.message === 'No orders provided') {
            errorMessage = 'Không có đơn hàng nào được cung cấp. Vui lòng thêm đơn hàng trước khi tạo liên kết bản đồ.';
        } else if (error.message === 'No session found') {
            errorMessage = 'Không tìm thấy session nào. Vui lòng bắt đầu gõ /start session mới trước khi tạo liên kết bản đồ.';
        } else if (error.message === 'Start address not found') {
            errorMessage = 'Không tìm thấy địa chỉ bắt đầu. Vui lòng cung cấp địa chỉ bắt đầu trước khi tạo liên kết bản đồ.';
        }
        await webhookService.callSendAPI(sender_psid, { text: errorMessage });
    }
}

const optimizeRoutes = async (originLocation, orders) => {
    try {
        const { lat: latOrigin, lng: lngOrigin } = originLocation;
        const destinationX = orders.map((order, index) => `destination${index}=${order.lat},${order.lng}&`).join('');
        const api = `https://wps.hereapi.com/v8/findsequence2?start=${latOrigin},${lngOrigin}&${destinationX}departure=now&optimize=true&mode=fastest;car&apiKey=${HERE_API_KEY}`;
        const response = await axios.get(api);

        if (!response.data.results || response.data.results.length === 0) {
            throw new Error('No optimization results found');
        }

        const optimizedWaypoints = response.data.results[0].waypoints;
        const newOrders = optimizedWaypoints.slice(1).map(waypoint => {
            return orders.find(order => order.lat === waypoint.lat && order.lng === waypoint.lng);
        });

        return newOrders;
    } catch (error) {
        console.error('Error optimizing routes:', error);
        let errorMessage = 'Đã xảy ra lỗi khi tạo liên kết bản đồ. Vui lòng thử lại sau.';
        if (error.message === 'No optimization results found') {
            errorMessage = 'Không tìm thấy kết quả tối ưu hóa. Vui lòng thử lại sau.';
        }
        await webhookService.callSendAPI(sender_psid, { text: errorMessage });
    }
}

const getLatLngFromAddress = async (address) => {
    const api = `https://geocode.search.hereapi.com/v1/geocode?q=${address}&apiKey=${HERE_API_KEY}`;
    const response = await axios.get(api);
    const {lat, lng} = response.data.items[0].position;
    return {lat, lng};
}



module.exports = {
    generateMapLink,
    getLatLngFromAddress,
}