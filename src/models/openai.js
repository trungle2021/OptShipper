const OpenAI = require("openai");
const modelName = 'gpt-3.5-turbo';
const apiKey = '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';

const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true
});

module.exports = { openai, modelName };