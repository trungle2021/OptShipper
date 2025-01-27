const reOrderedProperties = require('../utils/re-ordered-properties')
const googleSheetService = require('./google-sheet-service')
const {SPREADSHEET_ID, CHILD_SHEET_NAME, SHEET_ORDER_WRITABLE_RANGE}  = require('../config/google-sheet/config-field')
const formatOrderItems = require('../utils/format-order-items')
const getCurrentDateTime = require('../utils/get-current-date')

const createOrder = async (originalOrder) => {
  const sheetService = await googleSheetService();
  originalOrder.order_items = formatOrderItems(originalOrder.order_details)
  originalOrder.order_date = getCurrentDateTime()
  const reOrderedObject = await reOrderedProperties(originalOrder, InternationalOrderSheet.DESIRED_ORDER)
  await sheetService.create(reOrderedObject, SPREADSHEET_ID, CHILD_SHEET_NAME, SHEET_ORDER_WRITABLE_RANGE)
  return reOrderedObject
}

module.exports = {
  createOrder
}
