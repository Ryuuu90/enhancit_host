const mongoose = require('mongoose');
const { analysisConnection } = require('../db/db');

const interpretation = new mongoose.Schema({
    KBICONSO : Object,
    PR : Object,
    CO : Object,
    OP : Object,
    AD : Object,
    CI : Object,
})

const Interpretation = mongoose.model('Interpretation', interpretation);
module.exports = Interpretation;
