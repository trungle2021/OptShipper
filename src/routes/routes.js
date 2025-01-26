const express = require('express');
const apiRoutes = express();
const webhookRoute = require('./webhook-routes');

apiRoutes.use('/webhook', webhookRoute);

module.exports = apiRoutes;

