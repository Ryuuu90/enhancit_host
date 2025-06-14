const mongoose = require('mongoose');

const highScoresQues = new mongoose.Schema({
    PR : Object,
    CO : Object,
    OP : Object,
    AD : Object,
    CI : Object,
})

const HighScoresQues = mongoose.model('HighScoresQues', highScoresQues);
module.exports = HighScoresQues;
