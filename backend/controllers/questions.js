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
                // console.log(ques+"==" +val);
                if(typeof val === 'number')
                {
                    if(val === 2)
                        console.log(ques);
                    if(![1, 0, 4, 5].includes(val))
                    {
                        console.log(ques);
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
        console.log(filters);

        if(!batchId)
            return res.status(500).json({success : false,  message: 'Error clustring data'});
        // const workbook = xlsx.readFile(path.join(__dirname, '../public', 'low_scores_ques.xlsx'));
        // const sheet = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        // const categories = ['PR', 'CO', 'OP', 'AD', 'CI'];
        // const interpretation = Object.fromEntries(categories.map(cat => [cat, {}]));
        // sheet.forEach(row => {
        // const { Category, QuesNum, Section , Question, Meaning1, Meaning2, Meaning3, Response1, Response2, Response3, Template} = row;
        // const quesObj = {QuesNum : '',  Section: '', Question: '', Meaning : {}, Response : {}, Template : '' }
        // if (interpretation[Category]) {
        //     quesObj.QuesNum = QuesNum;
        //     quesObj.Section = Section;
        //     quesObj.Question = Question;
        //     quesObj['Meaning'].Meaning1 = Meaning1;
        //     quesObj['Meaning'].Meaning2 = Meaning2;
        //     quesObj['Meaning'].Meaning3 = Meaning3;
        //     quesObj['Response'].Response1 = Response1;
        //     quesObj['Response'].Response2 = Response2;
        //     quesObj['Response'].Response3 = Response3;
        //     quesObj.Template = Template;

        //     interpretation[Category][QuesNum] = quesObj
        //  }
        // });
        // // console.log(interpretation);
        // await LowScoresQues.insertMany(interpretation)
        const records = await Records.find();
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
        const highScoresStr = quesRate.slice(0, 5);
        const lowScoresWeak = quesRate.slice(-5).reverse();
        lowScoresWeak.forEach(weakness=>{;
            lowScoresQues.forEach(row=>{
                const obj = row.toObject();
                Object.entries(obj).forEach((val) => {
                    val.forEach((q)=> {
                        if(q[weakness.question])
                            weakResults[weakness.question] = q[weakness.question]
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
                            strResults[strenght.question] = q[strenght.question]
                    });
                });
            })
        });
        const weaknesses = [];
        Object.entries(weakResults).forEach(([key,res]) =>{
            const vars = {QuesNum : res.QuesNum, Section : res.Section, Question : res.Question, Meaning1 : res.Meaning.Meaning1,
                Meaning2 : res.Meaning.Meaning2, Meaning3 : res.Meaning.Meaning3,  Response1 : res.Response.Response1,
                Response2 : res.Response.Response2, Response3 : res.Response.Response3
            }
            weaknesses.push(renderTemplate(res.Template, vars));
        })
        const strenghts = [];
        Object.entries(strResults).forEach(([key,res]) =>{
            const vars = {QuesNum : res.QuesNum, Section : res.Section, Question : res.Question, Meaning1 : res.Meaning.Meaning1,
                Meaning2 : res.Meaning.Meaning2, Meaning3 : res.Meaning.Meaning3,  Response1 : res.Response.Response1,
                Response2 : res.Response.Response2, Response3 : res.Response.Response3
            }
            strenghts.push(renderTemplate(res.Template, vars));
        })
        
        res.status(200).json({success : true, message : "Clustring data successfully",  weaknesses : weaknesses, strenghts : strenghts} );
    }
    catch (error) {
        res.status(500).json({success : false,  message: 'Error clustring data', error: error.message });
    } 
};

