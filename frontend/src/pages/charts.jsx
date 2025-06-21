import React, {useState, Suspense, useEffect} from "react";
import {BsCloudUpload} from 'react-icons/bs'
import { motion, AnimatePresence } from "framer-motion";
import {toast} from "react-toastify"
import useDeepCompareEffect from 'use-deep-compare-effect';
import axios from 'axios';
import "./charts.css"
import InterpretationComponent from "../components/insights/InterpretationComponent";
import ContextDisplay from "../components/insights/ContextDisplay";
import { Translations } from "../components/language/datalang";
import LanguageSwitcher from "../components/language/languageSwitcher";
const RadarChartComponent = React.lazy(() => import("../components/charts/RadarChartComponent"));
const BoxPlotComponent = React.lazy(() => import("../components/charts/BoxPlotComponent"));
const PCACluster = React.lazy(() => import("../components/charts/PcaCluster"));
const DistributionChartComp = React.lazy(() => import("../components/charts/DistributionChartComp"));
const DistributionChartScores = React.lazy(() => import("../components/charts/DistributionChartScores"));
const QuestionRateComponent = React.lazy(() => import("../components/insights/QuestionRateComponent"));
const HeatmapComponent = React.lazy(() => import("../components/charts/HeatmapComponent"));
const BubbleChartComponent = React.lazy(() => import("../components/charts/BubbleChartComponent"));




const URL = process.env.REACT_APP_BACKEND_URL;
const clientId = '68484bb6b0653865b23f878f';


const UploadAndDashboardPage = () => {
    const [genderStats, setGenderStats] = useState([]);
    const [ManagementStats, setManagementStats] = useState([]);
    const [ageStats, setAgeStats] = useState([]);
    const [dataLoaded, setDataLoaded] = useState(false);
    const [records, setRecords] = useState([]);
    const [batchId, setBatchId] = useState('');
    const [isloaded, setIsloaded] = useState(false);
    const [Questions, setQuestions] = useState({weaknesses : [], strenghts : []});
    const [Groups, setGroups] = useState({ageGroups : [], sectorGroups : []});
    const [domains, setDomains] = useState({radar :{min : 0, max : 0}, sector :{min : 0, max : 0}, age :{min : 0, max : 0}, management :{min : 0, max : 0}, gender :{min : 0, max : 0}});
    const [normalDistributions, setNormalDistributions] = useState({});
    const [dataState, setDataState] = useState({});
    const [CompanyData, setCompanyData] = useState([]);
    const [clustering, serClustering] = useState({pca : [], heatmap : {}, clustersProfile : {}});
    const [reportType, setReportType] = useState("company");
    const [language, setLanguage] = useState(() => {
        const savedLanguage = localStorage.getItem('preferredLanguage');
        return savedLanguage || 'fr';
      });
    const [processAllData, setProccesAllData] = useState({allDataStats : [], normalDistributions : {}, secNormalDistributions : {}, interpretation : {}, interCompany : {}, context : ''})


    const [filters, setFilters] = useState({Sector : '', Age : '', Gender : '', Phase : '',  Maturity : '', Management : ''});
    const translations = Translations;
    const t = translations[language];
    useEffect(() => {
        localStorage.setItem('preferredLanguage', language);
        window.dispatchEvent(new Event('languageChanged'));
      }, [language]);
    const processData = (analysis, fullData, sectorData)=>{
        const dataState = analysis.allData.map(row => ({category : row.category, Company_Av : row.average, Individual_Av : analysis.records[1].Scores[row.category]}));
        dataState.forEach( item =>
        {
            const match = fullData.allData.find( fItem => fItem.category === item.category);
            const match2 = sectorData.allData.find( sItem => sItem.category === item.category);
            item['All_Av'] = match.average;
            item['Sector_Av'] = match2.average;
        }
        )


        const keys = ["PR", "CO", "OP", "AD", "CI"];
        const ageGroups = analysis.ageData.map(d => d.age);
        const ageD = keys.map(key => {
            const obj = { category: `Av-${key}` };
            analysis.ageData.forEach(d => {
                obj[d.age] = d[key];
            });
            return obj;
        });
        
        const sectorGroups = analysis.sectorData.map(d => d.sector);
        const sectorD = keys.map(key => {
            const obj = { category: `Av-${key}` };
            analysis.sectorData.forEach(d => {
                obj[d.sector] = d[key];
            });
            return obj;
        });
        const radarValues = dataState.flatMap(row => [
            row.Company_Av,
            row.All_Av,
            row.Sector_Av,
        ]);
        const sectorValues = analysis.sectorData.flatMap(row =>[
            row['PR'],
            row['CO'],
            row['AD'],
            row['CI'],
            row['OP'],
        ])
        const ageValues = analysis.ageData.flatMap(row =>[
            row['PR'],
            row['CO'],
            row['AD'],
            row['CI'],
            row['OP'],
        ]) 
        const managementValues = analysis.managementData.flatMap(row =>[
            row.Yes,
            row.No
        ])
        const genderValues = analysis.genderData.flatMap(row =>[
            row.Woman,
            row.Man
        ])
        setDomains({radar :{min : Math.min(radarValues), max : Math.max(radarValues)}, age : {min : Math.min(ageValues), max : Math.max(ageValues)}, management : {min : Math.min(managementValues), max : Math.max(managementValues)}, gender : {min : Math.min(genderValues), max : Math.max(genderValues)}, sector : {min : Math.min(sectorValues), max : Math.max(sectorValues)}});
        setGroups({ageGroups : ageGroups, sectorGroups : sectorGroups})
        setGenderStats(analysis.genderData);
        setAgeStats(ageD);
        setDataState(dataState)
        setManagementStats(analysis.managementData);
        setDataLoaded(true);
        setNormalDistributions({OP : analysis.OP, CO : analysis.CO,  PR: analysis.PR, AD: analysis.AD, CI : analysis.CI});

    }
    const fileUpload = async(e) =>
    {

        try{
            setBatchId(2);
        }
        catch(error)
        {
            if (error.response?.data?.message) {
                toast.error(error.response.data.message);
                console.error(error.response.data.message);
            } else {
                console.error(error.response || error);
            }
        }
    }

    useDeepCompareEffect(()=>{
        const fetchRates = async () =>{
            try{
                const rates = await axios.post(`${URL}/api/questions?batchId=${clientId}`, {filters});
                setQuestions({weaknesses : rates.data.weaknesses, strenghts : rates.data.strenghts});

            }
            catch(error)
            {
                if (error.response?.data?.message) {
                    toast.error(error.response.data.message);
                    console.error(error.response.data.message);
                } else {
                    console.error(error.response || error);
                }
            }
        
        }
        if(isloaded)
            fetchRates();
    },[filters, isloaded])
    useDeepCompareEffect(()=>{
        const fetchAnalysis = async () =>{
            try
            {
                const id = 1;
                const analysis = await axios.post(`${URL}/api/analysis?batchId=${clientId}`, { filters, id});
                processData(analysis.data.filteredData, analysis.data.fullData, analysis.data.sectorData);
                setProccesAllData({allDataStats : analysis.data.fullData.allData,
                                    normalDistributions : {OP : analysis.data.fullData.OP, CO : analysis.data.fullData.CO,  PR: analysis.data.fullData.PR, AD: analysis.data.fullData.AD, CI : analysis.data.fullData.CI}, 
                                    interpretation : analysis.data.fullData.interpretation, interCompany : analysis.data.fullData.interCompany,
                                    secNormalDistributions :  {OP : analysis.data.sectorData.OP, CO : analysis.data.sectorData.CO,  PR: analysis.data.sectorData.PR, AD: analysis.data.sectorData.AD, CI : analysis.data.sectorData.CI}, 
                                    context : analysis.data.filteredData.context});
                setRecords(analysis.data.filteredData.records)
                setCompanyData(analysis.data.filteredData.data)
                setIsloaded(true);
            }
            catch(error)
            {
                if (error.response?.data?.message) {
                    toast.error(error.response.data.message);
                    console.error(error.response.data.message);
                } else {
                    console.error(error.response || error);
                }
            
            }
        }
        if (batchId !== '')
        {
            fetchAnalysis();
        }
    }, [filters, batchId]);
    useDeepCompareEffect(() => {
        const fetchClusters = async () => {
          try {
            const response = await axios.post(`${URL}/clustering`, CompanyData);
            serClustering({pca : response.data.pca, heatmap : response.data.heatmap, clustersProfile : response.data.clusterProfile});
          } catch (error) {
            console.error('Error fetching clusters:', error);
          }
        };
      
        if (CompanyData.length > 0) {
          fetchClusters();
        }
      }, [CompanyData]);
    return(
        
        <div className="min-h-screen bg-[black] ">
        <div className="max-w-5xl mx-auto text-center">
            <div className="absolute top-4 right-4">
            <LanguageSwitcher language={language} setLanguage={setLanguage} />
            </div>
            <p className="text-5xl text-[#f9f9f9] font-bold text-shadow">Data Analysis</p>
            <p className="text-7xl mt-2 font-bold text-gray-600"><span className="bg-gradient-to-r from-red-500 to-yellow-500 bg-clip-text text-transparent">Charts</span></p>
            <AnimatePresence mode="wait">
            {!dataLoaded ? (
            <motion.div key="upload" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
                <div className="min-h-[calc(100vh-12rem)] p-6 flex items-center justify-center">
                    <label className="flex flex-col items-center justify-center w-[calc(100%-20rem)] h-80 p-8 bg-[#161616] rounded-2xl shadow-xl cursor-pointer border border-gray-400 border-dashed dark:hover:bg-[#1c1c1c] dark:hover:border-gray-600">
                        <BsCloudUpload className="  text-gray-600 mb-8 text-6xl"/>
                        <p className="text-2xl mb-4 text-gray-600"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        <p className="text-1xl mb-4 text-gray-400">(XSLS or XLS files)</p>
                        <button onClick={fileUpload}></button>
                    </label>
                </div>
            </motion.div>
          ) : (
            <motion.div key="charts" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
            <div className="p-6 grid grid-cols-1 gap-10"> 
                    <ContextDisplay context={processAllData.context} title={t.titles.context} language={language}/>
                <Suspense fallback={<div className="text-white">Loading Radar Chart...</div>}>
                    <RadarChartComponent dataState={dataState} domains={domains} title={t.titles.radarChart} />
                </Suspense>
                <Suspense fallback={<div className="text-white">Loading Radar Chart...</div>}>
                    <BubbleChartComponent data={genderStats} domain={domains.gender} groups={["Man", "Woman"]} groupType={"Gender"} title={t.titles.genderChart}/>
                </Suspense>
                <Suspense fallback={<div className="text-white">Loading Radar Chart...</div>}>
                    <BubbleChartComponent data={ManagementStats} domain={domains.management} groups={["Yes", "No"]} groupType={"Management"} title={t.titles.managementChart}/>
                </Suspense>
                <Suspense fallback={<div className="text-white">Loading Radar Chart...</div>}>  
                    <BubbleChartComponent data={ageStats} domain={domains.age} groups={Groups.ageGroups} groupType={"Age"} title={t.titles.ageChart}/>
                </Suspense>
                <Suspense fallback={<div className="text-white">Loading Radar Chart...</div>}>
                    <PCACluster data={clustering.pca} profiles={clustering.clustersProfile} title={t.titles.clusters}/>
                </Suspense>
                    <InterpretationComponent interCompany={processAllData.interCompany} title={t.titles.interpretation} language={language}/>
                <Suspense fallback={<div className="text-white">Loading Radar Chart...</div>}>
                    <HeatmapComponent clustering={clustering} title={t.heatmap}/>
                </Suspense>
                <Suspense fallback={<div className="text-white">Loading Radar Chart...</div>}>
                    <BoxPlotComponent normalDistributions={normalDistributions} reportType={reportType} withOutliers={false} title={t.titles.boxPlot}/>                     
                </Suspense>
                <Suspense fallback={<div className="text-white">Loading Radar Chart...</div>}>
                    <DistributionChartScores normalDistributions={normalDistributions} processAllData={processAllData} reportType={reportType} DisType={"Kernel Density"} title={t.titles.kernel}/>
                </Suspense>
                {Questions.weaknesses.length !== 0 && <Suspense fallback={<div className="text-white">Loading Radar Chart...</div>}>
                    <QuestionRateComponent Questions={Questions.weaknesses} title={t.titles.weakness}/>
                </Suspense>}
                <Suspense fallback={<div className="text-white">Loading Radar Chart...</div>}>
                    <BoxPlotComponent normalDistributions={normalDistributions} reportType={reportType} withOutliers={true} title={t.titles.outliers}/>
                </Suspense>
                </div>
          </motion.div>
          )}
          </AnimatePresence>
        </div>
      </div>
    )
}

export default UploadAndDashboardPage;