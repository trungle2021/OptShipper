const getCurrentDateTime = () => {
  return new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
}

module.exports = getCurrentDateTime
