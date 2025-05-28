const { Batch } = require('mongodb');
const {Records, PersonRate, QuestionsRate, Interpretation, InterCompany, Context, HighScoresQues, LowScoresQues} = require('../models/Records');
const ss = require('simple-statistics');
const axios= require('axios');
const path = require('path');
const xlsx = require('xlsx');
const { v4: uuidv4 } = require('uuid');

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { Console } = require('console');
dotenv.config();
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    bufferCommands: false, // prevents operations from being buffered when not connected
    serverSelectionTimeoutMS: 10000, // Adjust based on needs
  });

  isConnected = true;
}

exports.uploadFile = async (req , res) =>{
    const batchId = uuidv4();
    try{
        const data = xlsx.read(req.file.buffer);
        const dataSheet = xlsx.utils.sheet_to_json(data.Sheets[data.SheetNames[0]]);
        if(dataSheet.length === 0)
            return res.status(500).json({success:false, message: 'Upload failed: Data sheet require.'});
        const finalData =  dataSheet.map(row => (
            {
            Gender : row.Gender,
            Management : row.Management,
            Age : row.Age,
            Department : row.Department,
            Industry : row.Industry,
            Sector : row.Sector, 
            Phase : row.Phase,
            Maturity : row.Maturity,
            Questions : {
                PR : {
                    PR01 : row['PR01'],
                    PR02 : row['PR02'],
                    PR03 : row['PR03'],
                    PR04 : row['PR04'],
                    PR05 : row['PR05'],
                    PR06 : row['PR06'],
                    PR07 : row['PR07'],
                    PR08 : row['PR08'],
                    PR09 : row['PR09'],
                    PR10 : row['PR10'],
                    
                },
                CO : {
                    CO01 : row['CO01'],
                    CO02 : row['CO02'],
                    CO03 : row['CO03'],
                    CO04 : row['CO04'],
                    CO05 : row['CO05'],
                    CO06 : row['CO06'],
                    CO07 : row['CO07'],
                    CO08 : row['CO08'],
                    CO09 : row['CO09'],
                    CO10 : row['CO10'],
                    
                },
                OP : {
                    OP01 : row['OP01'],
                    OP02 : row['OP02'],
                    OP03 : row['OP03'],
                    OP04 : row['OP04'],
                    OP05 : row['OP05'],
                    OP06 : row['OP06'],
                    OP07 : row['OP07'],
                    OP08 : row['OP08'],
                    OP09 : row['OP09'],
                    OP10 : row['OP10'],
                    
                },
                AD : {
                    AD01 : row['AD01'],
                    AD02 : row['AD02'],
                    AD03 : row['AD03'],
                    AD04 : row['AD04'],
                    AD05 : row['AD05'],
                    AD06 : row['AD06'],
                    AD07 : row['AD07'],
                    AD08 : row['AD08'],
                    AD09 : row['AD09'],
                    AD10 : row['AD10'],
                    
                },
                CI : {
                    CI01 : row['CI01'],
                    CI02 : row['CI02'],
                    CI03 : row['CI03'],
                    CI04 : row['CI04'],
                    CI05 : row['CI05'],
                    CI06 : row['CI06'],
                    CI07 : row['CI07'],
                    CI08 : row['CI08'],
                    CI09 : row['CI09'],
                    CI10 : row['CI10'],
                    
                }
            },

            Scores : {
                PR : row['Score-Pr'],
                CO : row['Score-Co'],
                OP : row['Score-Op'],
                AD : row['Score-Ad'],
                CI : row['Score-Ci'],
            },
            KBICONSO : row.KBICONSO,
            Trend : row.Trend,
            batchId : batchId, 
        }));

        await connectDB()
        await Records.insertMany(finalData);
        res.status(200).json({success: true, message: 'Data uploaded successfully',  batchId : batchId});
    }
    catch(err)
    {
        console.log(err);
        res.status(500).json({success:false, message: 'Upload failed', error : err.message});
    }
};

const average = (arr) =>{
    if(arr.length === 0)
        return 0;
    const sum = arr.reduce((a,b)=> a + b, 0);
    const avg = sum / arr.length;
    return +avg.toFixed(6);
}


const Analysing = (data) =>{
        const categories = ['PR', 'CO', 'OP', 'AD', 'CI'];
        const genderData = [];
        const allData = [];
        const managementData = [];
        const ageMap = {};
        const departmentMap = {};
        const kbiArr = [];
        categories.forEach(category =>{
            const genderMap = { Man:[], Woman:[]};
            const managementMap = {Yes:[], No:[]};
            const allScore = [];
            data.forEach(row =>{
                let score;
                if(!ageMap[row.Age])
                    ageMap[row.Age] = {PR : [], CO :[], OP : [], AD : [], CI : []};
                if(!departmentMap[row.Department])
                    departmentMap[row.Department] = {PR : [], CO :[], OP : [], AD : [], CI : []};
                if(row.Scores && row.Scores[category] !== undefined)
                    score = row.Scores[category];
                if(score !== undefined && typeof score === 'number')
                {
                    allScore.push(score);
                    if(row.Gender === 'Man')
                        genderMap.Man.push(score);
                    if(row.Gender === 'Woman')
                        genderMap.Woman.push(score);
                    if(row.Management === 'Yes')
                        managementMap.Yes.push(score);
                    if(row.Management === 'No')
                        managementMap.No.push(score);
                    ageMap[row.Age][category].push(score);
                    departmentMap[row.Department][category].push(score);
                }
            })
            genderData.push({category : `Av-${category}`, Man : average(genderMap.Man), Woman : average(genderMap.Woman)});
            managementData.push({category : `Av-${category}`, Yes : average(managementMap.Yes), No : average(managementMap.No)});
            allData.push({category : `${category}`, average : average(allScore)});
        })
        data.forEach(row => {
            kbiArr.push(row['KBICONSO']);
        })
        // console.log(kbiArr)=
        const ageData = Object.entries(ageMap).map(([age, scores]) => {
            const entry = { age };
            categories.forEach(category => {
                entry[category] = average(scores[category]);
            });
            return entry;
        });
        const departmentData = Object.entries(departmentMap).map(([department, scores]) => {
            const entry = { department };
            categories.forEach(category => {
                entry[category] = average(scores[category]);
            });
            return entry;
        })
        const sortedAgeData = ageData.sort((a, b) => {
            if (a.age === "Over 55") return 1;
            if (b.age === "Over 55") return -1;
            const ageA = parseInt(a.age.split('-')[0]);
            const ageB = parseInt(b.age.split('-')[0]);
            return ageA - ageB;
        });
        return {genderData : genderData, managementData : managementData, allData : allData, sortedAgeData : sortedAgeData, departmentData : departmentData, kbiAv : average(kbiArr)}
}

const rateAnalysing = async (data, batchId) => {
    const personStates = []
    const quesRate = {}
    data.forEach((person, index) =>{
        const personRate = { personIndex: index + 2, low : 0, high : 0, totalAnswerd : 0};
        Object.entries(person.Questions).forEach(([category, questions]) => {
            Object.entries(questions).forEach(([ques, val]) =>{
                // console.log(ques+"==" +val);
                if(typeof val === 'number')
                {
                    if(![1, 0, 4, 5].includes(val))
                        throw new Error("The answer score must be from 5, 4, 1,0.");
                    if (!quesRate[category]) {
                        quesRate[category] = {ques : {}};
                    }
                    
                    if(!quesRate[category][ques])
                        quesRate[category][ques] = {low : 0, high : 0, total : 0};
                    if(val >= 4)
                    {
                        quesRate[category][ques].high++;
                        personRate.high++;
                    }
                    if(val <= 1)
                    {
                        quesRate[category][ques].low++;
                        personRate.low++;
                    } 
                    quesRate[category][ques].total++;
                    personRate.totalAnswerd++;
                }
                else
                    throw new Error("The answer must be a number.");
            })
        })
        personStates.push({
            personIndex : personRate.personIndex,
            percentLow : (personRate.low / personRate.totalAnswerd).toFixed(2),
            percentHigh : (personRate.high / personRate.totalAnswerd).toFixed(2),
            low : personRate.low,
            high : personRate.high,
            totalAnswerd : personRate.totalAnswerd,
            batchId : batchId
        })

    });
    const quesState = [];
    const quesSheet  = []
    Object.entries(quesRate).forEach(([category,questions])=> {

        Object.entries(questions).forEach(([ques, state]) =>{
            if (ques === 'ques') return;
            quesSheet.push({question : ques, low_rate : (state.low / state.total).toFixed(2), high_rate : (state.high / state.total).toFixed(2)})
            quesState.push({
                category: category,
                question : ques, 
                percentLow : (state.low / state.total).toFixed(2),
                percentHigh : (state.high / state.total).toFixed(2),
                low : state.low,
                high : state.high,
                total : state.total,
                batchId : batchId
            })
        })
    }); 
    await QuestionsRate.insertMany(quesState); 
    await PersonRate.insertMany(personStates);
    // const workbook = xlsx.readFile(path.join(__dirname, '../public', 'data.xlsx'));
    // const sheet = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    // const newSheet = sheet.map(row=>{
    //     const match = personStates.find(val => val.personIndex === row['__EMPTY'] + 2);
    //     return{
    //     ...row,
    //     low_rate_pc :match ? match.percentLow : 'N/A',
    //     high_rate_pc : match ? match.percentHigh : 'N/A',
    // }});
    
    // const newWorkBook = xlsx.utils.json_to_sheet(newSheet);
    // const quesWorkbook = xlsx.utils.json_to_sheet(quesSheet);
    // workbook.Sheets[workbook.SheetNames[0]] = quesWorkbook;
    // const filePath = path.join('/tmp', 'output2.xlsx');
    // xlsx.writeFile(workbook, filePath);

    // return {personState : personStates, quesState : quesState};

}
const getQuartileBin = (score, values) => {
    const sorted = [...values].sort((a,b)=> a-b);
    const Q1 = ss.quantileSorted(sorted, 0.25);
    const Q2 = ss.quantileSorted(sorted, 0.5);
    const Q3 = ss.quantileSorted(sorted, 0.75);
  
    if (score <= Q1) return ["1sh", "a needs improvement"];
    if (score <= Q2) return ["2nd", "an average"];
    if (score <= Q3) return ["3rd", "a good"];
    return ["4th", "an excellent"];
}

const renderTemplate = (template, variables) => {
    return template.replace(/\{(\w+)\}/g, (_, key) => {
      return variables[key] !== undefined ? variables[key] : `{${key}}`;
    });
  }

const formatScore = (num) => {
const percentage = num * 100;
return Number.isInteger(percentage)
    ? `${percentage}%`
    : `${percentage.toFixed(2)}%`;
};
const companyContext = async (data) => {
    // const workbook = xlsx.readFile(path.join(__dirname, '../public', 'Company_Context.xlsx'));
    // const sheet = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    // sheet.forEach(async (row) => {
    // const { Sector, Priorities, Key1 , Key2, Key3, Paragraph } = row;
    //     await Context.create({ Industry : Sector, Data : {Priorities : Priorities, Key1 : Key1, Key2 : Key2, Key3 : Key3, Paragraph : Paragraph}})
    // });
    const context = await Context.findOne({Industry : data[0].Sector});
    const variables = {Sector : data[0].Sector, Maturity : data[0].Maturity, Phase : data[0].Phase, Priorities : context.Data.Priorities,
        Key1 : context.Data.Key1, Key2 : context.Data.Key2, Key3 : context.Data.Key3 };
    const result = renderTemplate(context.Data.Paragraph, variables);
    return result;
}
const analysisInterpretation = async (data, scores, isIndiv) =>{
    // const workbook = xlsx.readFile(path.join(__dirname, '../public', 'inter_com.xlsx'));
    // const sheet = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    // const categories = ['KBICONSO', 'PR', 'CO', 'OP', 'AD', 'CI'];
    // const interpretation = Object.fromEntries(categories.map(cat => [cat, { low: '', high: '', exp  : '' }]));
    // sheet.forEach(row => {
    // const { category, low, high , exp} = row;
    // if (interpretation[category]) {
    //     interpretation[category].low = low;
    //     interpretation[category].high = high;
    //     interpretation[category].exp = exp;

    // }
    // });
    // console.log(interpretation);
    // await InterCompany.create(interpretation)
    let inter;
    if(isIndiv)
        inter = await Interpretation.find();
    else
        inter = await InterCompany.find();
    const kbiVars = {Score : formatScore(data['KBICONSO']) , Quartile : getQuartileBin(data['KBICONSO'], scores['KBICONSO'])[0], Performance : getQuartileBin(data['KBICONSO'], scores['KBICONSO'])[1]}
    const prVars = {Score : formatScore(data.Scores.PR) , Quartile : getQuartileBin(data.Scores.PR, scores.PR)[0], Performance : getQuartileBin(data.Scores.PR, scores.PR)[1]}
    const coVars = {Score : formatScore(data.Scores.CO) , Quartile : getQuartileBin(data.Scores.CO, scores.CO)[0], Performance : getQuartileBin(data.Scores.CO, scores.CO)[1]}
    const opVars = {Score : formatScore(data.Scores.OP) , Quartile : getQuartileBin(data.Scores.OP, scores.OP)[0], Performance : getQuartileBin(data.Scores.OP, scores.OP)[1]}
    const adVars = {Score : formatScore(data.Scores.AD) , Quartile : getQuartileBin(data.Scores.AD, scores.AD)[0], Performance : getQuartileBin(data.Scores.AD, scores.AD)[1]}
    const ciVars = {Score : formatScore(data.Scores.CI) , Quartile : getQuartileBin(data.Scores.CI, scores.CI)[0], Performance : getQuartileBin(data.Scores.CI, scores.CI)[1]}
    const prRes = ['1st', '2nd'].includes(prVars.Quartile) ? renderTemplate(inter[0]['PR'].low, prVars) : renderTemplate(inter[0]['PR'].high, prVars) ;
    const coRes = ['1st', '2nd'].includes(coVars.Quartile) ? renderTemplate(inter[0]['CO'].low, coVars) : renderTemplate(inter[0]['CO'].high, coVars) ;
    const opRes = ['1st', '2nd'].includes(opVars.Quartile) ? renderTemplate(inter[0]['OP'].low, opVars) : renderTemplate(inter[0]['OP'].high, opVars) ;
    const adRes = ['1st', '2nd'].includes(adVars.Quartile) ? renderTemplate(inter[0]['AD'].low, adVars) : renderTemplate(inter[0]['AD'].high, adVars) ;
    const ciRes = ['1st', '2nd'].includes(ciVars.Quartile) ? renderTemplate(inter[0]['CI'].low, ciVars) : renderTemplate(inter[0]['CI'].high, ciVars) ;
    const kbiRes = ['1st', '2nd'].includes(kbiVars.Quartile) ? renderTemplate(inter[0]['KBICONSO'].low, kbiVars) : renderTemplate(inter[0]['KBICONSO'].high, kbiVars) ;
    
    const results = {
        PR : {res : prRes, exp : inter[0]['PR'].exp},
        CO : {res : coRes, exp : inter[0]['CO'].exp},
        OP : {res : opRes, exp : inter[0]['OP'].exp},
        AD : {res : adRes, exp : inter[0]['AD'].exp},
        CI : {res : ciRes, exp : inter[0]['PR'].exp},
        KBICONSO : {res : kbiRes, exp: ''}
    };
    
    return results;

}

const normalDistribution = (scores, idScore) => {
        const mean = ss.mean(scores);
        const median = ss.median(scores);
        const variance = ss.variance(scores);
        const stdDev = ss.standardDeviation(scores);
        const sorted = [...scores].sort((a,b)=> a-b);
        const max = ss.max(sorted);
        const min = ss.min(sorted);
        const q1 = ss.quantileSorted(sorted, 0.25);
        const q3 = ss.quantileSorted(sorted, 0.75);
        const iqr = q3 - q1;
        const Qmin = parseFloat((q1 - 1.5 * iqr).toFixed(2))
        const Qoutliers = scores.filter(score => (score < Qmin))
        const Zoutliers = scores.filter(score => {
            const z = (score - mean) / stdDev;
            return Math.abs(z) > 3;
        })
        const outliers = Qoutliers.filter(val => Zoutliers.includes(val));
        const pdf = (x) => {
            return (
            (1 / (stdDev * Math.sqrt(2 * Math.PI))) *
            Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2))
            );
        };
        const points = [];
        for (let x = 0; x <= max +0.01 ; x += 0.01) {
            points.push({ x: x.toFixed(2), y: pdf(x) });
        }
        

        const bandwidth = 1.06 * ss.standardDeviation(sorted) * Math.pow(sorted.length, -1/5);

        const kernel = (u) => (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * u * u);
    
        const densityAt = (x) => {
            let sum = 0;
            for (let i = 0; i < sorted.length; i++) {
                sum += kernel((x - sorted[i]) / bandwidth);
            }
            return sum / (sorted.length * bandwidth);
        };
        
        const kpoints = [];
        for (let x = 0; x <= max + 0.01; x+=0.01) {
            kpoints.push({ x: x, y: densityAt(x) });
        }
        const idKpoint = {x : idScore, y : densityAt(idScore)};
        return {
            mean,
            median,
            variance,
            stdDev,
            points,
            kpoints,
            max,
            min,
            q1,
            q3,
            outliers, 
            Qoutliers,
            idKpoint,
        };
}

exports.analyseData = async (req, res) => {
    try {
        const { batchId } = req.query;
        const { filters, id } = req.body;

        if (!batchId)
            return res.status(500).json({ success: false, message: 'Batch ID is required' });

        await connectDB();

        const records = await Records.find({ batchId });

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
        
        const filteredId = uuidv4();
        const sectorData = records.filter(row=> row.Sector === filteredData[0].Sector);
        await rateAnalysing(filteredData, filteredId);
        const filteredAnalysis = Analysing(filteredData);
        const pr = filteredData.map(r => r.Scores.PR);
        const co = filteredData.map(r => r.Scores.CO);
        const op = filteredData.map(r => r.Scores.OP);
        const ad = filteredData.map(r => r.Scores.AD);
        const ci = filteredData.map(r => r.Scores.CI);
        const kbi = filteredData.map(r => r['KBICONSO']);
        const scores = { PR: pr, CO: co, OP: op, AD: ad, CI: ci, KBICONSO: kbi };
        
        const sectorAnalysis = Analysing(sectorData);
        const prSec = sectorData.map(r => r.Scores.PR);
        const coSec = sectorData.map(r => r.Scores.CO);
        const opSec = sectorData.map(r => r.Scores.OP);
        const adSec = sectorData.map(r => r.Scores.AD);
        const ciSec = sectorData.map(r => r.Scores.CI);
        const kbiSec = records.map(r => r['KBICONSO']);


        const fullAnalysis = Analysing(records);
        const prAll = records.map(r => r.Scores.PR);
        const coAll = records.map(r => r.Scores.CO);
        const opAll = records.map(r => r.Scores.OP);
        const adAll = records.map(r => r.Scores.AD);
        const ciAll = records.map(r => r.Scores.CI);
        const kbiAll = records.map(r => r['KBICONSO']);
        const scoresAll = { PR: prAll, CO: coAll, OP: opAll, AD: adAll, CI: ciAll, KBICONSO: kbiAll };
        
        const avScores = {KBICONSO : filteredAnalysis.kbiAv, Scores : {PR: 0, CO: 0, OP: 0, AD: 0, CI: 0 }};
        filteredAnalysis.allData.forEach(row => {
            if (avScores.Scores.hasOwnProperty(row.category)) {
                avScores.Scores[row.category] = row.average;
            }
        });
        let interpretationId = {};
        const context = await companyContext(filteredData);
        if (!isNaN(id) && filteredData[id]) {
            interpretationId = await analysisInterpretation(filteredData[id], scores, true);
        }
        const interpretationAll = await analysisInterpretation(avScores, scoresAll, false);
        // console.log(interpretationAll);
        res.status(200).json({
            success: true,
            message: 'Analysed all and filtered data successfully',
            filterd: filteredId,
            filteredData: {
                records: records,
                data: filteredData,
                PR: normalDistribution(pr, filteredData[id]?.Scores?.PR),
                CO: normalDistribution(co, filteredData[id]?.Scores?.CO),
                OP: normalDistribution(op, filteredData[id]?.Scores?.OP),
                AD: normalDistribution(ad, filteredData[id]?.Scores?.AD),
                CI: normalDistribution(ci, filteredData[id]?.Scores?.CI),
                allData: filteredAnalysis.allData,
                genderData: filteredAnalysis.genderData,
                ageData: filteredAnalysis.sortedAgeData,
                managementData: filteredAnalysis.managementData,
                departmentData: filteredAnalysis.departmentData,
                context : context
            },
            fullData: {
                PR: normalDistribution(prAll, records[id]?.Scores?.PR),
                CO: normalDistribution(coAll, records[id]?.Scores?.CO),
                OP: normalDistribution(opAll, records[id]?.Scores?.OP),
                AD: normalDistribution(adAll, records[id]?.Scores?.AD),
                CI: normalDistribution(ciAll, records[id]?.Scores?.CI),
                interpretation: interpretationId,
                interCompany: interpretationAll,
                allData: fullAnalysis.allData,
                genderData: fullAnalysis.genderData,
                ageData: fullAnalysis.sortedAgeData,
                managementData: fullAnalysis.managementData,
                departmentData: fullAnalysis.departmentData
            },
            sectorData : {
                PR: normalDistribution(prSec, sectorData[id]?.Scores?.PR),
                CO: normalDistribution(coSec, sectorData[id]?.Scores?.CO),
                OP: normalDistribution(opSec, sectorData[id]?.Scores?.OP),
                AD: normalDistribution(adSec, sectorData[id]?.Scores?.AD),
                CI: normalDistribution(ciSec, sectorData[id]?.Scores?.CI),
                allData: sectorAnalysis.allData,
                genderData: sectorAnalysis.genderData,
                ageData: sectorAnalysis.sortedAgeData,
                managementData: sectorAnalysis.managementData,
                departmentData: sectorAnalysis.departmentData
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error analysing data',
            error: error.message
        });
    }
};


let RatePercent = (count, quesNum) =>(
   ( count * 100) / quesNum

)

exports.questions = async (req, res) => {
    try{

        
        const {batchId} = req.query;

        if(!batchId)
            return res.status(500).json({success : false,  message: 'Error clustring data'});
        // const workbook = xlsx.readFile(path.join(__dirname, '../public', 'high_scores_ques.xlsx'));
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
        // await HighScoresQues.insertMany(interpretation)
        const highScoresQues = await HighScoresQues.find();
        const lowScoresQues = await LowScoresQues.find();
        const quesRate = await QuestionsRate.find({batchId});
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
    //     const ciVars = {Score : formatScore(data.Scores.CI)}
    // const prRes = ['1st', '2nd'].includes(prVars.Quartile) ? renderTemplate(inter[0]['PR'].low, prVars) : renderTemplate(inter[0]['PR'].high, prVars) ;
        
        res.status(200).json({success : true, message : "Clustring data successfully",  weaknesses : weaknesses, strenghts : strenghts} );
    }
    catch (error) {
        res.status(500).json({success : false,  message: 'Error clustring data', error: error.message });
    } 
};

// exports.questionsClustering = async (req, res) => {
//     try{

//         const { prevQuesLowPercent, category} = req.body;
//         const {batchId} = req.query;

//         if(!batchId)
//             return res.status(500).json({success : false,  message: 'Error clustring data'});
//         const quesRate = await QuestionsRate.find({batchId});
//         // console.log(quesRate);
//         quesRate.sort((a, b) => a.percentLow - b.percentLow);

//         const workbook = xlsx.readFile(path.join(__dirname, '../public', 'high_scores_ques.xlsx'));
//         const sheet = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
//         const categories = ['PR', 'CO', 'OP', 'AD', 'CI'];
//         const interpretation = Object.fromEntries(categories.map(cat => [cat, {QuesNum : '',  Section: '', Question: '', Meaning : {}, Response : {} , Template : ''}]));
//         sheet.forEach(row => {
//             const { Category, QuesNum, Section , Question, Meaning1, Meaning2, Meaning3, Response1, Response2, Response3, Template} = row;
//             if (interpretation[Category]) {
//                 interpretation[Category].QuesNum = QuesNum;
//                 interpretation[Category].Section = Section;
//                 interpretation[Category].Question = Question;
//                 interpretation[Category]['Meaning'].Meaning1 = Meaning1;
//                 interpretation[Category]['Meaning'].Meaning2 = Meaning2;
//                 interpretation[Category]['Meaning'].Meaning3 = Meaning3;
//                 interpretation[Category]['Response'].Response1 = Response1;
//                 interpretation[Category]['Response'].Response2 = Response2;
//                 interpretation[Category]['Response'].Response3 = Response3;
//                 interpretation[Category].Template = Template;


//             }
//         });
//         console.log(interpretation);
//         const quesFiltered = quesRate.filter(row => {
//             return(!category || row.category === category);
//         })
//         const [lowRateQuestions, lowRateVal] = [[], [], 0];
//         const [midRateQuestions, midRateVal] = [[], [], 0];
//         const [highRateQuestions, highRateVal] = [[], [], 0];
//         const totalRate = [];
//         let rowPrecentLow = 0;
//         let [quesNum, lowRateCount , midRateCount, highRateCount] = [0, 0, 0, 0, 0];
//         quesFiltered.forEach(row =>{
//             rowPrecentLow = row.percentLow * 100;
//             quesNum++;
//             if(rowPrecentLow >= 0 && rowPrecentLow < prevQuesLowPercent / 2)
//             {
//                 highRateQuestions.push(row);
//                 highRateVal.push(row.percentLow);
//                 highRateCount++;
//             }
//             if(rowPrecentLow >= prevQuesLowPercent / 2 && rowPrecentLow < prevQuesLowPercent)
//             {
//                 midRateQuestions.push(row);
//                 midRateVal.push(row.percentLow);
//                 midRateCount++;
//             }
//             if(rowPrecentLow >= prevQuesLowPercent)
//             {
//                 lowRateQuestions.push(row);
//                 lowRateVal.push(row.percentLow);
//                 lowRateCount++;
//             }
//         })
//         const highRateCluster = {name : "high-Rate",  quesData : highRateQuestions, avRate : average(highRateVal), ratePercent : RatePercent(highRateCount, quesNum)};
//         const midRateCluster = {name : "mid-Rate",quesData : midRateQuestions, avRate : average(midRateVal), ratePercent : RatePercent(midRateCount, quesNum)};
//         const lowRateCluster = {name : "low-Rate",quesData : lowRateQuestions, avRate : average(lowRateVal), ratePercent : RatePercent(lowRateCount, quesNum)};

//         res.status(200).json({success : true, message : "Clustring data successfully", highRateCluster : highRateCluster, 
//             midRateCluster : midRateCluster, lowRateCluster: lowRateCluster});
//     }
//     catch (error) {
//         res.status(500).json({success : false,  message: 'Error clustring data', error: error.message });
//     } 
// };


// exports.personClustering = async (req, res) => {
//     try{

//         const { prevPersLowPercent} = req.body;
//         const {batchId} = req.query;

//         if(!batchId)
//             return res.status(500).json({success : false,  message: 'Error clustring data'});
//         const persRate = await PersonRate.find({batchId});
//         const [lowRatePerson, lowRateVal] = [[], [], 0];
//         const [midRatePerson, midRateVal] = [[], [], 0];
//         const [highRatePerson, highRateVal] = [[], [], 0];
//         persRate.sort((a, b) => a.percentLow - b.percentLow);
//         let rowPrecentLow = 0;
//         let [persNum, lowRateCount , midRateCount, highRateCount] = [0, 0, 0, 0, 0];
//         persRate.forEach(row =>{
//             rowPrecentLow = row.percentLow * 100;
//             persNum++;
//             if(rowPrecentLow >= 0 && rowPrecentLow < prevPersLowPercent / 2)
//             {
//                 highRatePerson.push(row);
//                 highRateVal.push(row.percentLow);
//                 highRateCount++;
//             }
//             if(rowPrecentLow >= prevPersLowPercent / 2 && rowPrecentLow < prevPersLowPercent)
//             {
//                 midRatePerson.push(row);
//                 midRateVal.push(row.percentLow);
//                 midRateCount++;
//             }
//             if(rowPrecentLow >= prevPersLowPercent)
//             {
//                 lowRatePerson.push(row);
//                 lowRateVal.push(row.percentLow);
//                 lowRateCount++;
//             }
//         })
//         const highRateCluster = {name : "high-Rate",  persData : highRatePerson, avRate : average(highRateVal), ratePercent : RatePercent(highRateCount, persNum)};
//         const midRateCluster = {name : "mid-Rate",persData : midRatePerson, avRate : average(midRateVal), ratePercent : RatePercent(midRateCount, persNum)};
//         const lowRateCluster = {name : "low-Rate",persData : lowRatePerson, avRate : average(lowRateVal), ratePercent : RatePercent(lowRateCount, persNum)};
//         res.status(200).json({success : true, message : "Clustring data successfully", highRateCluster : highRateCluster, 
//             midRateCluster : midRateCluster, lowRateCluster: lowRateCluster});
//     }
//     catch (error) {
//         res.status(500).json({success : false,  message: 'Error clustring data', error: error.message });
//     } 
// };
