const express = require('express')
const router = express.Router()
const OrderController = require('../order/order-controller')

router.route('/')
  .get(OrderController.showInfo)
  .post(OrderController.createOrder)

module.exports = router
