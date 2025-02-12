const HERE_API_KEY = process.env.HERE_API_KEY;
const axios = require('axios');



const generateMapLink = async (orders) => {
    const routesOptimized = [];


}

const optimizeRoutes = async (originLocation, orders) => {
    const {lat: latOrigin, lng: lngOrigin} = originLocation;
    const api = `https://router.hereapi.com/v8/routes?transportMode=car&origin=${latOrigin},${lngOrigin}&destination=10.794933,106.722052&via=10.780990,106.700085&via=10.773441,106.702692&return=polyline,summary&optimizeWaypoints=true&apiKey=${HERE_API_KEY}`
}

const getLatLngFromAddress = async (address) => {
    const api = `https://geocode.search.hereapi.com/v1/geocode?q=${address}&apiKey=${HERE_API_KEY}`;
    const response = await axios.get(api);
    const {lat, lng} = response.data.items[0].position;
    return {lat, lng};
}

const reverseGeocoding = async (lat, lng) => {
    const api = `https://revgeocode.search.hereapi.com/v1/revgeocode?at=${lat},${lng}&apiKey=${HERE_API_KEY}`
    const response = await axios.get(api);
    const address = response.data.items[0].address.label;
    return address;
}


module.exports = {
    generateMapLink,
    getLatLngFromAddress
}