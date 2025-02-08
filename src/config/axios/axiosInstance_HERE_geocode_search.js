const axios = require('axios')
const axiosRetry = require('axios-retry').default

const axiosInstance_forward_geocode = axios.create({
    baseURL: 'https://geocode.search.hereapi.com/v1',
    timeout: 10000
})

// Configure axios-retry
axiosRetry(axiosInstance_forward_geocode, {
    retries: 3,
    retryDelay: (retryCount) => {
        return retryCount * 1000; // Time between retries in milliseconds
    },
    retryCondition: (error) => {
        // Retry on network errors or 5xx status codes
        return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.response.status >= 500;
    },
})

module.exports = axiosInstance_forward_geocode;