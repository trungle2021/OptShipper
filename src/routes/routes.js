const express = require('express');
const apiRoutes = express();
const webhookRoute = require('../modules/webhook/webhook-router');

apiRoutes.use('/webhook', webhookRoute);

module.exports = apiRoutes;

