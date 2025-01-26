const express = require('express');
const dotenv = require('dotenv');
const routes = require('./routes/routes');

dotenv.config();

const app = require('./app');


app.use(express.json());
app.use('/api', routes);

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
});

