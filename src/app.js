const express = require("express");
const app = express();
const cors = require('cors');
const apiRoutes = require("./routes/routes");
const ErrorController = require('./error/error-controller');
const AppError = require('./utils/error/app-error');
const path = require('path');
const morganMiddleware = require('./middleware/morgan');

app.use(cors());
app.use(morganMiddleware);
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// router
app.use('/api/v1', apiRoutes);

app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
  });
  
app.use(ErrorController);

module.exports = app;
