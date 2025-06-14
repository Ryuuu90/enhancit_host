const mongoose = require('mongoose');

const interCompany = new mongoose.Schema({
    KBICONSO : Object,
    PR : Object,
    CO : Object,
    OP : Object,
    AD : Object,
    CI : Object,
})

const InterCompany = mongoose.model('InterCompany', interCompany);
module.exports = InterCompany;
