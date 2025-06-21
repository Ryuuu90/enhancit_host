const {Records, HighScoresQues, LowScoresQues} = require('../models/index');
const xlsx = require('xlsx');
const path = require('path');

const renderTemplate = (template, variables) => {
    return template.replace(/\{(\w+)\}/g, (_, key) => {
      return variables[key] !== undefined ? variables[key] : `{${key}}`;
    });
  }

const rateAnalysing = (data) => {

    const quesRate = {}
    data.forEach((person, index) =>{
        Object.entries(person.Questions).forEach(([category, questions]) => {
            Object.entries(questions).forEach(([ques, val]) =>{
                if(typeof val === 'number')
                {
                    if(![1, 0, 4, 5].includes(val))
                    {
                        throw new Error("The answer score must be from 5, 4, 1,0.");
                    }
                    if (!quesRate[category]) {
                        quesRate[category] = {};
                    }
                    
                    if(!quesRate[category][ques])
                        quesRate[category][ques] = {low : 0, high : 0, total : 0};
                    if(val >= 4)
                    {
                        quesRate[category][ques].high++;
                    }
                    if(val <= 1)
                    {
                        quesRate[category][ques].low++;
                    } 
                    quesRate[category][ques].total++;
                }
                else
                    throw new Error("The answer must be a number.");
            })
        })

    });
    const quesState = [];

    Object.entries(quesRate).forEach(([category,questions])=> {
        Object.entries(questions).forEach(([ques, state]) =>{
            quesState.push({
                category: category,
                question : ques, 
                percentLow : (state.low / state.total).toFixed(2),
                percentHigh : (state.high / state.total).toFixed(2),
                low : state.low,
                high : state.high,
                total : state.total,
            })
        })
    }); 
    return quesState

}

exports.questions = async (req, res) => {
    try{

        
        const {batchId} = req.query;
        const {filters} = req.body

        if(!batchId)
            return res.status(500).json({success : false,  message: 'Error clustring data'});
        const records = await Records.find({clientId : batchId});
        const filteredData = filters
        ? records.filter(row =>
            (!filters.Department || row.Department === filters.Department) &&
            (!filters.Gender || row.Gender === filters.Gender) &&
            (!filters.Age || row.Age === filters.Age) &&
            (!filters.Phase || row.Phase === filters.Phase) &&
            (!filters.Maturity || row.Maturity === filters.Maturity) &&
            (!filters.Management || row.Management === filters.Management)
        )
        : records;
        const highScoresQues = await HighScoresQues.find();
        const lowScoresQues = await LowScoresQues.find();

        const quesRate = rateAnalysing(filteredData);
        const weakResults = {}
        const strResults = {}

        quesRate.sort((a, b) => a.percentLow - b.percentLow);
        const highScoresStr = quesRate.slice(0, 3);
        const lowScoresWeak = quesRate.slice(-3).reverse();
        lowScoresWeak.forEach(weakness=>{;
            lowScoresQues.forEach(row=>{
                const obj = row.toObject();
                Object.entries(obj).forEach((val) => {
                    val.forEach((q)=> {
                        if(q[weakness.question])
                        {
                            weakResults[weakness.question] = q[weakness.question]
                            weakResults[weakness.question]["score"] = weakness.percentLow;

                        }
                    });
                });
            })
        });
        highScoresStr.forEach(strenght=>{;
            highScoresQues.forEach(row=>{
                const obj = row.toObject();
                Object.entries(obj).forEach((val) => {
                    val.forEach((q)=> {
                        if(q[strenght.question])
                        {
                            strResults[strenght.question] = q[strenght.question];
                            strResults[strenght.question]["score"] = strenght.percentHigh;

                        }
                    });
                });
            })
        });
        const WeakResults = Object.values(weakResults).map(({ Template, ...rest }) => rest);

        
        res.status(200).json({success : true, message : "Clustring data successfully",  weaknesses : WeakResults, strenghts : null} );
    }
    catch (error) {
        res.status(500).json({success : false,  message: 'Error clustring data', error: error.message });
    } 
};

