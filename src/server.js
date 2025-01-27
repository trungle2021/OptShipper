const dotenv = require('dotenv');
dotenv.config();
  

const express = require('express');
const routes = require('./routes/routes');


const app = require('./app');


app.use(express.json());
app.use('/api', routes);

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
});

