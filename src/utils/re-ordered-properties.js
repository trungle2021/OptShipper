const reOrderedProperties = async (originalObject, desiredOrder) => {
  return Object.fromEntries(
    desiredOrder.map(key => [key, originalObject[key]])
  )
}

module.exports = reOrderedProperties
