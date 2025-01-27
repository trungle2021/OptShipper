function formatOrderItems (orderItemsInputString) {
  return orderItemsInputString.split(/[\r\n,.]+/).map(item => {
    return item.trim()
  }).join('\n').toString()
}

module.exports = formatOrderItems
