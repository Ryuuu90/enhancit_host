const { Batch, UUID } = require('mongodb');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');


const RecordData = new mongoose.Schema({
    Gender : String, 
    Management : String,
    Age : String,
    Department : String,
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

const interpretation = new mongoose.Schema({
    KBICONSO : Object,
    PR : Object,
    CO : Object,
    OP : Object,
    AD : Object,
    CI : Object,
})

const context = new mongoose.Schema({
    Industry : String,
    Data : Object,
})

const interCompany = new mongoose.Schema({
    KBICONSO : Object,
    PR : Object,
    CO : Object,
    OP : Object,
    AD : Object,
    CI : Object,
})

const personRate = new mongoose.Schema({
    personIndex : Number,
    percentLow : Number,
    percentHigh : Number,
    low : Number,
    high : Number,
    totalAnswerd : Number,
    batchId : String

})

const questionsRate = new mongoose.Schema({
    category : String,
    question : String,
    percentLow : Number,
    percentHigh : Number,
    low : Number,
    high : Number,
    total : Number,
    batchId : String
})

const promptCache = new mongoose.Schema({
    prompt : String,
    response : String,
    hash: { type: String, unique: true }
})


const Records = mongoose.model('Records', RecordData);
const PersonRate = mongoose.model('PersonRate', personRate);
const QuestionsRate = mongoose.model('QuestionsRate', questionsRate);
const PromptCache = mongoose.model('PromptCache', promptCache);
const Interpretation = mongoose.model('Interpretation', interpretation);
const InterCompany = mongoose.model('InterCompany', interCompany);
const Context = mongoose.model('Context', context);



module.exports = {
    Records,
    PersonRate, 
    QuestionsRate,
    PromptCache,
    Interpretation,
    InterCompany,
    Context
}