const {Records, Interpretation, InterCompany, Context, UserResponse} = require('../models/index');

const ss = require('simple-statistics');
const axios= require('axios');
const path = require('path');
const xlsx = require('xlsx');
const { v4: uuidv4 } = require('uuid');

const dotenv = require('dotenv');
const mongoose = require('mongoose');
dotenv.config();
let isConnected = false;

const DEFAULT_CLIENT_ID = '666abc123def4567890abcde';

const connectDB = async () => {
  if (isConnected) return;
  
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    bufferCommands: false, 
    serverSelectionTimeoutMS: 10000,
  }).then(console.log("connect to nhancit database too"));

  isConnected = true;
}


const average = (arr) =>{
    if(arr.length === 0)
        return 0;
    const sum = arr.reduce((a,b)=> a + b, 0);
    const avg = sum / arr.length;
    return +avg.toFixed(1);
}


const Analysing = (data, allAnalysis) =>{
        const categories = ['PR', 'CO', 'OP', 'AD', 'CI'];
        const genderData = [];
        const allData = [];
        const managementData = [];
        const ageMap = {};
        const sectorMap = {};
        const kbiArr = [];
        categories.forEach(category =>{
            const genderMap = { Man:[], Woman:[]};
            const managementMap = {Yes:[], No:[]};
            const allScore = [];
            data.forEach(row =>{
                let score;
                if(!ageMap[row.Age])
                    ageMap[row.Age] = {PR : [], CO :[], OP : [], AD : [], CI : []};
                if(!sectorMap[row.Sector])
                    sectorMap[row.Sector] = {PR : [], CO :[], OP : [], AD : [], CI : []};
                if(row.Scores && row.Scores[category] !== undefined)
                    score = row.Scores[category];
                if(score !== undefined && typeof score === 'number')
                {
                    allScore.push(score);
                    if(allAnalysis)
                    {
                        if(row.Gender === 'Man')
                            genderMap.Man.push(score);
                        if(row.Gender === 'Woman')
                            genderMap.Woman.push(score);
                        if(row.Management === 'Yes')
                            managementMap.Yes.push(score);
                        if(row.Management === 'No')
                            managementMap.No.push(score);
                        ageMap[row.Age][category].push(score);
                        sectorMap[row.Sector][category].push(score);
                    }
                }
            })
            if(allAnalysis)
            {
                genderData.push({category : `Av-${category}`, Man : average(genderMap.Man), Woman : average(genderMap.Woman)});
                managementData.push({category : `Av-${category}`, Yes : average(managementMap.Yes), No : average(managementMap.No)});
            }
            allData.push({category : `${category}`, average : average(allScore)});
        })

        data.forEach(row => {
            kbiArr.push(row['KBICONSO']);
        })
        if(allAnalysis)
        {
            const ageData = Object.entries(ageMap).map(([age, scores]) => {
                const entry = { age };
                categories.forEach(category => {
                    entry[category] = average(scores[category]);
                });
                return entry;
            });
            const sectorData = Object.entries(sectorMap).map(([sector, scores]) => {
                const entry = { sector };
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
            return {genderData : genderData, managementData : managementData, allData : allData, sortedAgeData : sortedAgeData, sectorData : sectorData, kbiAv : average(kbiArr)}
        }
        return {allData : allData, kbiAv : average(kbiArr)}

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
const percentage = num;
return Number.isInteger(percentage)
    ? `${percentage}%`
    : `${percentage.toFixed(1)}%`;
};
const companyContext = async (data) => {
    const context = await Context.findOne({Industry : data[0].Sector});
    const variables = {Sector : data[0].Sector, Maturity : data[0].Maturity, Phase : data[0].Phase, Priorities : context.Data.Priorities,
        Key1 : context.Data.Key1, Key2 : context.Data.Key2, Key3 : context.Data.Key3 };
    const result = renderTemplate(context.Data.Paragraph, variables);
    return result;
}
const analysisInterpretation = async (data, scores, isIndiv) =>{
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

const normalDistribution = (scoresPer, idScore) => {
        const scores = scoresPer.map(s => s / 100);
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
        const Qmax = parseFloat((q3 + 1.5 * iqr).toFixed(2))
        const Qoutliers = scores.filter(score => (score < Qmin || score > Qmax))
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
            points.push({ x: (x * 100).toFixed(1) , y: pdf(x) });
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
            kpoints.push({ x: (x * 100).toFixed(1), y: densityAt(x) });
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
function transformSurveyData(inputData) {

    const demographicInfo = {};
    const questionCategories = { PR: {}, CO: {}, OP: {}, AD: {}, CI: {} };
    
    inputData.responses.forEach(response => {
      const { questionId, answerTextAng, score, categoryAngShort } = response;
      
    if (questionId <= 9) {
        switch (questionId)
        {
            case 1:
                demographicInfo.Gender = answerTextAng;
                break;
            case 2:
                demographicInfo.Management = answerTextAng;
                break;
            case 3:
                demographicInfo.Age = answerTextAng;
                break;
            case 4:
                demographicInfo.Department = answerTextAng;
                break;
            case 5 :
                demographicInfo.Company = answerTextAng;
                break;
            case 6:
                demographicInfo.Sector = answerTextAng.trim();
                break;
            case 8:
                demographicInfo.Phase = answerTextAng.toLowerCase();
                break;
            case 9:
                demographicInfo.Maturity = answerTextAng;
                break;
        }
      } else {
        const categoryShort = categoryAngShort.toUpperCase();
        const categoryShortLow = categoryAngShort;

        if (questionCategories[categoryShort]) {
          const categoryQuestions = inputData.responses.filter(r => 
            r.categoryAngShort === categoryShortLow && r.questionId >= 10
          );
          const sortedCategoryQuestions = categoryQuestions.sort((a, b) => a.questionId - b.questionId);
          const questionIndex = sortedCategoryQuestions.findIndex(q => q.questionId === questionId) + 1;
          
          const questionKey = `${categoryShort}${questionIndex.toString().padStart(2, '0')}`;
          questionCategories[categoryShort][questionKey] = score;
        }
      }
    });
  
    const normalizedScores = {};
    inputData.categoryScores.forEach(category => {
      const categoryShort = category.categoryAngShort.toUpperCase();
      normalizedScores[categoryShort] = +(category.score).toFixed(1)
    });
  
    const overallKBICONSO = +(inputData.score).toFixed(1)
  
    const transformedData = {
      userId: inputData.userId || 'Unknown',
      clientId: inputData.clientId || DEFAULT_CLIENT_ID,
      Gender: demographicInfo.Gender || 'Unknown',
      Management: demographicInfo.Management || 'Unknown',
      Age: demographicInfo.Age || 'Unknown',
      Department: demographicInfo.Department || 'Unknown',
      Company : demographicInfo.Company || 'Unknown',
      Sector: demographicInfo.Sector || 'Unknown',
      Phase: demographicInfo.Phase || 'Unknown',
      Maturity: demographicInfo.Maturity || 'Unknown',
      Questions: questionCategories,
      Scores: normalizedScores,
      KBICONSO: overallKBICONSO,
    };
  
    return transformedData;
  }

exports.analyseData = async (req, res) => {
    try {
        const { batchId } = req.query;
        const { clientId, filters, id } = req.body;
        if (!batchId)
            return res.status(500).json({ success: false, message: 'Batch ID is required' });
        
        await connectDB();

        const records = []
        const people = await UserResponse.find();
        people.forEach(data => {
            const person = data.toObject();
            records.push(transformSurveyData(person));
        })
        const operations = records.map(record => ({
            updateOne: {
              filter: { userId: record.userId,
                 clientId: record.clientId },
              update: { $setOnInsert: record },
              upsert: true
            }
          }));

        await Records.bulkWrite(operations);
        const filteredData = records.filter(row => String(row.clientId) === String(batchId))
        const fullData = records.filter(row => String(row.clientId) !== String(batchId))

        const sectorData = records.filter(row=> row.Sector === filteredData[0].Sector);
        const filteredAnalysis = Analysing(filteredData, true);
        const pr = filteredData.map(r => r.Scores.PR);
        const co = filteredData.map(r => r.Scores.CO);
        const op = filteredData.map(r => r.Scores.OP);
        const ad = filteredData.map(r => r.Scores.AD);
        const ci = filteredData.map(r => r.Scores.CI);
        const kbi = filteredData.map(r => r['KBICONSO']);
        const scores = { PR: pr, CO: co, OP: op, AD: ad, CI: ci, KBICONSO: kbi };
        
        const sectorAnalysis = Analysing(sectorData, false);
        const prSec = sectorData.map(r => r.Scores.PR);
        const coSec = sectorData.map(r => r.Scores.CO);
        const opSec = sectorData.map(r => r.Scores.OP);
        const adSec = sectorData.map(r => r.Scores.AD);
        const ciSec = sectorData.map(r => r.Scores.CI);
        const kbiSec = records.map(r => r['KBICONSO']);


        const fullAnalysis = Analysing(fullData, false);
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
        res.status(200).json({
            success: true,
            message: 'Analysed all and filtered data successfully',
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
                sectorData: filteredAnalysis.sectorData,
                context : context
            },
            fullData: {
                interpretation: interpretationId,
                interCompany: interpretationAll,
                allData: fullAnalysis.allData,

            },
            sectorData : {
                allData: sectorAnalysis.allData,
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



