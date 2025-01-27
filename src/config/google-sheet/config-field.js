const CHILD_SHEET_NAME = 'ORDER'
const SPREADSHEET_ID = '1-1YNQ-UG1nl2Ev4IkFZ_cD-7quq-6Fv55b8CKOwEHrI'
const DESIRED_ORDER = [
  'order_date',
  'id',
  'customer_name',
  'shipping_fee',
  'order_details',
  'total_amount',
  'delivery_address',
  'phone_number',
  'payment_method',
  'note'
] // A-I range

const SHEET_ORDER_WRITABLE_RANGE = 'A:I'

module.exports = {
  CHILD_SHEET_NAME,
  SPREADSHEET_ID,
  DESIRED_ORDER,
  SHEET_ORDER_WRITABLE_RANGE
}
