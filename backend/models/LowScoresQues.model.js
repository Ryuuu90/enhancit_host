const mongoose = require('mongoose');

const lowScoresQues = new mongoose.Schema({
    PR : Object,
    CO : Object,
    OP : Object,
    AD : Object,
    CI : Object,
})

const LowScoresQues = mongoose.model('LowScoresQues', lowScoresQues);
module.exports = LowScoresQues;
