const reOrderedProperties = require('../utils/re-ordered-properties')
const googleSheetService = require('./google-sheet-service')
const InternationalOrderSheet = require('../google_sheet/config/sheets/international_order/config')
const formatOrderItems = require('../utils/format-order-items')
const getCurrentDateTime = require('../utils/get-current-date')
const orderStatus = require('../models/order/order-status')

const createOrder = async (originalOrder) => {
  const sheetService = await googleSheetService
  originalOrder.order_items = formatOrderItems(originalOrder.order_items)
  originalOrder.order_date = getCurrentDateTime()
  originalOrder.status = orderStatus.IN_PROGRESS
  const reOrderedObject = await reOrderedProperties(originalOrder, InternationalOrderSheet.DESIRED_ORDER)
  await sheetService.create(reOrderedObject, InternationalOrderSheet.SPREADSHEET_ID, InternationalOrderSheet.CHILD_SHEET_NAME, InternationalOrderSheet.SHEET_ORDER_WRITABLE_RANGE)
  return reOrderedObject
}

module.exports = {
  createOrder
}
