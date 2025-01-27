const OpenAI = require("openai");
const modelName = 'gpt-3.5-turbo';
const apiKey = process.env.OPENAI_API_KEY;
console.log("apiKey", apiKey);

const openai = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true
});

module.exports = { openai, modelName };