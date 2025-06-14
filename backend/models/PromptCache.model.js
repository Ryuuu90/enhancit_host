const mongoose = require('mongoose');

const promptCache = new mongoose.Schema({
    prompt : String,
    response : String,
    hash: { type: String, unique: true }
})

const PromptCache = mongoose.model('PromptCache', promptCache);
module.exports = PromptCache;
