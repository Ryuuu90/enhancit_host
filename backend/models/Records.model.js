const mongoose = require('mongoose');

const RecordData = new mongoose.Schema({
    userId :  {
        type: String,
        required: true,
        index: true
    },
    Gender : String, 
    Management : String,
    Age : String,
    Department : String,
    Company : String,
    Industry : String,
    Sector : String,
    Phase : String,
    Maturity : String,
    Questions : Object,
    Scores : Object,
    KBICONSO : Number,
    Trend : Number,
    batchId : String
})

const Records =  mongoose.model('Records', RecordData);
module.exports = Records;