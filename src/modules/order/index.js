const reOrderedProperties = require('../../utils/re-ordered-properties')
const googleSheetService = require('../google_sheet/index')
const {SPREADSHEET_ID, CHILD_SHEET_NAME, SHEET_ORDER_WRITABLE_RANGE, DESIRED_ORDER}  = require('../../config/google-sheet/config-field')
const formatOrderItems = require('../../utils/format-order-items')
const getCurrentDateTime = require('../../utils/get-current-date')
const axiosInstance_forward_geocode = require('../../config/axios/axiosInstance_HERE_geocode_search')
const HERE_API_KEY = process.env.HERE_API_KEY

const createOrder = async (originalOrder) => {
  try{
    const {delivery_address} = originalOrder;

    originalOrder.order_details = formatOrderItems(originalOrder.order_details)
    originalOrder.order_date = getCurrentDateTime()
    
    const response = await axiosInstance_forward_geocode.get(`/geocode?q=${delivery_address}&apiKey=${HERE_API_KEY}`)
    const item = response?.data?.items[0];
    const lat = item?.position.lat;
    const lng = item?.position.lng;
    originalOrder['lat_lng'] = `${lat},${lng}`;

    // const sheetService = await googleSheetService;
    // forward geocode - convert address to latitute and longtitude

    // const reOrderedObject = await reOrderedProperties(originalOrder, DESIRED_ORDER)
    // await sheetService.create(reOrderedObject, SPREADSHEET_ID, CHILD_SHEET_NAME, SHEET_ORDER_WRITABLE_RANGE)
    // return reOrderedObject
   
  } catch (error) {
    console.error("Error creating order", error);
    throw error;
  }
}

module.exports = {
  createOrder
}
