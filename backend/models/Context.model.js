const mongoose = require('mongoose');

const context = new mongoose.Schema({
    Industry : String,
    Data : Object,
})

const Context = mongoose.model('Context', context);
module.exports = Context;
