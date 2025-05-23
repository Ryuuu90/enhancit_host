import React, {useState, useEffect, useRef, Children} from "react";
import {BsCloudUpload} from 'react-icons/bs'
import { motion, AnimatePresence } from "framer-motion";
import {toast} from "react-toastify"
import axios from 'axios';
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, Bar,BarChart, AreaChart, Area, PieChart,Pie, Cell,
    PolarGrid, RadarChart, PolarAngleAxis, ComposedChart, Radar, ResponsiveContainer, PolarRadiusAxis, ScatterChart, Label, Scatter 
 } from "recharts";
import Tree from 'react-d3-tree';
import useMeasure  from 'react-use-measure';
import * as XSLX from 'xlsx'
import {saveAs} from 'file-saver'
import ApexChart from '../components/plotBox'
import Explanation from "../components/chartExpComp";
import PCACluster from "../components/PcaCluster";

import "./charts.css"
const URL = process.env.REACT_APP_BACKEND_URL;

const UploadAndDashboardPage = () => {
    const [genderStats, setGenderStats] = useState([]);
    const [ManagementStats, setManagementStats] = useState([]);
    const [allDataStats, setAllDataStats] = useState([]);
    const [ageStats, setAgeStats] = useState([]);
    const [departmentD, setDepartmentD] = useState([]);
    const [dataLoaded, setDataLoaded] = useState(false);
    const [records, setRecords] = useState([]);
    const [batchId, setBatchId] = useState('');
    const [filtred, setFiltred] = useState('');
    const [quesLowPercent, setQuesLowPercent] = useState(20);
    const [persLowPercent, setPersLowPercent] = useState(20);
    const [categories, setcategories] = useState(['PR', 'CO', 'OP', 'AD', 'CI'])
    const [category, setCategory] = useState('');
    const [disCategory, setDisCategory] = useState('PR');
    const [normalDisCategory, setNormalDisCategory] = useState('CO');
    const [prevQuesLowPercent, setPrevQuesLowPercent] = useState(20);
    const [prevPersLowPercent, setPrevPersLowPercent] = useState(20);
    const [isloaded, setIsloaded] = useState(false);
    const [quesRateClusters, setQuesRateClusters] = useState([]);
    const [persRateClusters, setPersRateClusters] = useState([]);
    const [Groups, setGroups] = useState({ageGroups : [], departmentGroups : []});
    const [domain, setDomain] = useState({min : 0, max : 0});
    const [normalDistributions, setNormalDistributions] = useState({});
    const [dataState, setDataState] = useState({});
    const [CompanyData, setCompanyData] = useState([]);
    const [clustering, serClustering] = useState({pca : [], heatmap : {}, clustersProfile : {}});


    const [processAllData, setProccesAllData] = useState({allDataStats : [], normalDistributions : {}, secNormalDistributions : {}, interpretation : {}, interCompany : {}, context : ''})
    const categoryColors = {
        CI: "#0088FE",
        OP: "#00C49F",
        PR: "#FFBB28",
        AD: "#FF8042",
        CO: "#A020F0",
    };


    const filtersAll = {Department : '', Age : '', Gender : '', Phase : '',  Maturity : '', Management : ''};
    const [filters, setFilters] = useState({Department : '', Age : '', Gender : '', Phase : '',  Maturity : '', Management : ''});
    const processData = (analysis, fullData, sectorData)=>{
        const dataState = analysis.allData.map(row => ({category : row.category, Company_Av : row.average, Individual_Av : analysis.records[1].Scores[row.category]}));
        dataState.forEach( item =>
        {
            const match = fullData.allData.find( fItem => fItem.category == item.category);
            const match2 = sectorData.allData.find( sItem => sItem.category == item.category);
            item['All_Av'] = match.average;
            item['Sector_Av'] = match2.average;
        }
        )
        // console.log(dataState);
        const keys = ["PR", "CO", "OP", "AD", "CI"];
        const ageGroups = analysis.ageData.map(d => d.age);
        const transformed = keys.map(key => {
            const obj = { category: `Av-${key}` };
            analysis.ageData.forEach(d => {
                obj[d.age] = d[key];
            });
            return obj;
        });
        const departmentGroups = analysis.departmentData.map(d => d.department);
        const transformed2 = keys.map(key => {
            const obj = { category: `Av-${key}` };
            analysis.departmentData.forEach(d => {
                obj[d.department] = d[key];
            });
            return obj;
        });
        const allValues = dataState.flatMap(row => [
            row.Company_Av,
            row.All_Av,
            row.Sector_Av,
        ]);
        setDomain({min : Math.min(allValues), max : Math.max(allValues)});
        setGroups({ageGroups : ageGroups, departmentGroups : departmentGroups})
        setDepartmentD(transformed2);
        setAllDataStats(analysis.allData);
        setGenderStats(analysis.genderData);
        setAgeStats(transformed);
        setDataState(dataState)
        setManagementStats(analysis.managementData);
        setDataLoaded(true);
        setNormalDistributions({OP : analysis.OP, CO : analysis.CO,  PR: analysis.PR, AD: analysis.AD, CI : analysis.CI});

    }
    const fileUpload = async(e) =>
    {
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);
        try{
            const uploadRes = await axios.post(`${URL}/api/upload`, formData, {
                headers: {'Content-Type': 'multipart/form-data'},
            } );
            setBatchId(uploadRes.data.batchId);
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
    const quesChangeLowPercent = (e) =>{
        if(e.target.value === quesLowPercent)
            return;
        // if(e.target.value === '0')
        //     setQuesLowPercent('0.0000000000001');
        // else
        setQuesLowPercent(e.target.value);
    }
    const persChangeLowPercent = (e) =>{
        if(e.target.value === persLowPercent)
            return;
        // if(e.target.value === '0')
        //     setPersLowPercent('0');
        // else
        setPersLowPercent(e.target.value);
    }
    const reranderQuesLowPersent = async (e) =>
    {
        if(e.key ==='Enter') 
        {
            if(quesLowPercent === prevQuesLowPercent)
                return;
            if (quesLowPercent === '0')
                setPrevQuesLowPercent('0.0000000001');
            else
                setPrevQuesLowPercent(quesLowPercent);
        }
    }
    const reranderPersLowPersent = async (e) =>
    {
        if(e.key ==='Enter') 
        {
            if(persLowPercent === prevPersLowPercent)
                return;
            if (persLowPercent === '0')
                setPrevPersLowPercent('0.0000000001');
            else
                setPrevPersLowPercent(persLowPercent);
        }
    }
    const filterChange = (e)=>{
        const {name, value} = e.target;
        setFilters(prevFilter => {
            return{ ...prevFilter, [name] : value};
        })
    }
    const uniqueValues = (key) => {
        const values = records.map(row => row[key]);
        const filterd = values.filter(Boolean);
        return [... new Set(filterd)];
    }
    useEffect(()=>{
        const fetchRates = async () =>{
            try{
                const rates = await axios.post(`${URL}/api/person-rate?batchId=${filtred}`, {prevPersLowPercent});
                const Clusters = [];
                Clusters.push(rates.data.highRateCluster);
                Clusters.push(rates.data.midRateCluster);
                Clusters.push(rates.data.lowRateCluster);
                setPersRateClusters(Clusters);
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
        if(isloaded && filtred !== undefined)
            fetchRates();
    },[filtred, isloaded, prevPersLowPercent])
    useEffect(()=>{
        const fetchRates = async () =>{
            try{
                const rates = await axios.post(`${URL}/api/questions-rate?batchId=${filtred}`, {prevQuesLowPercent, category});
                const Clusters = [];
                Clusters.push(rates.data.highRateCluster);
                Clusters.push(rates.data.midRateCluster);
                Clusters.push(rates.data.lowRateCluster);
                setQuesRateClusters(Clusters);

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
        if(isloaded && filtred !== undefined)
            fetchRates();
    },[filtred, isloaded, prevQuesLowPercent, category])
    useEffect(()=>{
        const fetchAnalysis = async () =>{
            try
            {
                const id = 1;
                const analysis = await axios.post(`${URL}/api/analysis?batchId=${batchId}`, {filters, id});
                processData(analysis.data.filteredData, analysis.data.fullData, analysis.data.sectorData);
                setProccesAllData({allDataStats : analysis.data.fullData.allData,
                                    normalDistributions : {OP : analysis.data.fullData.OP, CO : analysis.data.fullData.CO,  PR: analysis.data.fullData.PR, AD: analysis.data.fullData.AD, CI : analysis.data.fullData.CI}, 
                                    interpretation : analysis.data.fullData.interpretation, interCompany : analysis.data.fullData.interCompany,
                                    secNormalDistributions :  {OP : analysis.data.sectorData.OP, CO : analysis.data.sectorData.CO,  PR: analysis.data.sectorData.PR, AD: analysis.data.sectorData.AD, CI : analysis.data.sectorData.CI}, 
                                    context : analysis.data.filteredData.context});
                setRecords(analysis.data.filteredData.records)
                setFiltred(analysis.data.filterd);
                setCompanyData(analysis.data.filteredData.data)
                console.log(typeof(analysis.data.filteredData.data));
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
    }, [JSON.stringify(filters), batchId]);
    useEffect(() => {
        const fetchClusters = async () => {
          try {
            const response = await axios.post(`https://37d8cff0-9377-45ba-ab70-840c820077ab-00-2mbep0ggoibt1.kirk.replit.dev/clustering`, CompanyData);

            console.log('Cluster API response:', response.data);
            serClustering({pca : response.data.pca, heatmap : response.data.heatmap, clustersProfile : response.data.clusterProfile});
            // You can now save response.data in state or process it as needed
          } catch (error) {
            console.error('Error fetching clusters:', error);
          }
        };
      
        if (CompanyData.length > 0) {
          fetchClusters();
        }
      }, [CompanyData]);
    // useEffect(() => {
    //     if (processAllData) {
    //       // Process logic here
    //       console.log('processAllData updated:', processAllData);
    //     }
    //   }, [processAllData]);
    // useEffect(()=>{
    //     const fetchAnalysis = async () =>{
    //         try
    //         {
    //             const id = 1;
    //             const analysis = await axios.post(`${URL}/api/analysis?batchId=${batchId}`, {filtersAll, id});
    //             setProccesAllData({allDataStats : analysis.data.allData,
    //                 normalDistributions : {OP : analysis.data.OP, CO : analysis.data.CO,  PR: analysis.data.PR, AD: analysis.data.AD, CI : analysis.data.CI}, 
    //                 interpretation : analysis.data.interpretation});
    //         }
    //         catch(error)
    //         {
    //             if (error.response?.data?.message) {
    //                 toast.error(error.response.data.message);
    //                 console.error(error.response.data.message);
    //             } else {
    //                 console.error(error.response || error);
    //             }
            
    //         }
    //     }
    //     if (batchId !== '')
    //     {
    //         fetchAnalysis();
    //     }
    // }, [batchId]);
    // useEffect(()=>{

    // }, [])
    const changeCategory = (e)=>{
        setCategory(e.target.value);
    }
    const disChangeCategory = (e)=>{
        setDisCategory(e.target.value);
    }
    const normalDistributionsCategory = (e)=>{
        console.log(e.target.value);
        setNormalDisCategory(e.target.value);
    }
    const lowRateQuesDisplay = (value, name, payload) =>
    {
        const data = quesRateClusters.find((b)=> (b.name === name));
        const newData = data.quesData.map(({ _id, batchId, __v, category, high, low, percentLow, percentHigh, total, ...rest }) => rest);
        let val = Number.isInteger(value) ? `${value}%` : `${(value).toFixed(2)}%`;
        if(name === 'low-Rate')
        { 
            return [
                <div key="custom-list">
                    <div>{`${name} : ${val}`}</div>
                    <div>{`count : ${newData.length}`}</div>
                    <h1>questions :</h1>
                    <div className=" flex flex-wrap justify-center gap-2 ">
                    {newData.map((item, idx) => (
                        <div key={idx}>{item.question},</div>
                    ))}
                    </div>
                </div>
            ];
        }
        return[<div key="custom-list">
                <div>{`${name} : ${val}`}</div>
                <div>{`count : ${newData.length}`}</div>
            </div>];
    }
    const chartAreaToolTip = ({ payload, label }) => {
        if (!payload || payload.length === 0) return null;

        return (
        <div className=" flex flex-row justify-between w-6/12 flex-wrap bg-white p-1 border-solid" >
            {payload.map((entry, index) => {
            let stats;
            let title = '';
            
            if(entry.id === "sectorData")
            {
                stats = processAllData.secNormalDistributions[entry.name];
                title = `Score-${entry.name}`;
            }
            else if(entry.id)
            {
                stats = normalDistributions[entry.id];
                title = `${entry.name}`;
            }
            else
            {
                stats = processAllData.normalDistributions[entry.name];
                title = `Score-${entry.name}`;
            }
            console.log(entry)
            return (
                <div key={index} className="mt-2">
                <div><strong> {title}: {(label * 100).toFixed(1)}%</strong></div>
                <div>Density: {(entry.value * 10).toFixed(1)}%</div>
                <div>StdDev: {(stats.stdDev * 100).toFixed(1)}%</div>
                <div>Mean: {(stats.mean * 100).toFixed(1)}%</div>
                <div>Median: {(stats.median * 100).toFixed(1)}%</div>
                <div>Variance: {(stats.variance * 100).toFixed(1)}%</div>
                <div className="text-red-600"> {stats.idKpoint.x < stats.mean 
                    ? ` ${entry.id ? entry.id : entry.name} = ${(stats.idKpoint.x * 100)}% is below the average` 
                    : `${entry.id ? entry.id : entry.name} = ${stats.idKpoint.x * 100}% is above the average`}</div>
                </div>
            );
            })}
        </div>
        );
    }
    const renderCustomNode = ({ nodeDatum }) => (
        <g>
          <text
            x="0"
            y="0"
            textAnchor="middle"
            alignmentBaseline="middle"
            fontSize="16"
            fontWeight="bold"
            fill="gray"
            stroke="none"
          >
            {nodeDatum.name}
          </text>
        </g>
      );
    const lowRatePersDisplay = (value, name, payload) =>
        {
            const data = persRateClusters.find((b)=> (b.name === name));
            const newData = data.persData.map(({ _id, batchId, __v, high, low, percentLow, percentHigh, totalAnswerd, ...rest }) => rest);
            let val = Number.isInteger(value) ? `${value}%` : `${(value).toFixed(2)}%`;
            if(name === 'low-Rate')
            {
                return [
                    <div key="custom-list">
                        <div>{`${name} : ${val}%`}</div>
                        <div>{`count : ${newData.length}`}</div>
                        <h1>personIndex :</h1>
                        <div className=" flex flex-wrap justify-center gap-2">
                        {newData.map((item, idx) => (
                            <div key={idx}>{item.personIndex}, </div>
                        ))}
                        </div>
                    </div>
                ];
            }
            return[<div key="custom-list">
                    <div>{`${name} : ${val}%`}</div>
                    <div>{`count : ${newData.length}`}</div>
                </div>];
        }
    return(
        
        <div className="min-h-screen bg-[black] ">
        <div className="max-w-5xl mx-auto text-center">
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
                        <input type="file" accept=".xlsx, .xls" onChange={fileUpload} className="hidden" />
                        {/* <button onClick={fileUpload}></button> */}
                    </label>
                </div>
            </motion.div>
          ) : (
            <motion.div key="charts" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
            <div className="mt-1 p-6 grid grid-cols-2 gap-6">
                {['Department' , 'Age' , 'Gender' , 'Phase' ,  'Maturity' , 'Management' ].map((key)=>(
                    <div key={key}>
                        <label className="block font-semibold text-white">{key}</label>
                        <select name={key} value={filters[key]} onChange={filterChange} className="appearance-none bg-white w-full border p-2 rounded">
                            <option value="">All</option>
                            {uniqueValues(key).map(val => <option key={val} value={val}>{val}</option>)}
                        </select>
                    </div>
                ))}
            </div>
            <div className=" p-6 grid grid-cols-1 gap-10">
                    <div className=" bg-[#161616] rounded-2xl shadow p-4">
                        <h2 className="text-xl  text-[#8f8d9f] font-bold mb-2  text-">Company Context</h2>
                        <div className="w-[100%] h-[105%] text-neutral-400 text flex flex-col justify-start items-center ">
                            {processAllData.context.split('\n').map((line, index) => (
                                <p key={index}>{line}</p>
                            ))}
                        </div>
                    </div>
                </div>
            <div className=" p-6 grid grid-cols-1 gap-10">
                    <div className=" bg-[#161616] rounded-2xl shadow p-4">
                        <div className="w-[100%] h-[105%]  flex flex-col justify-start items-center -ml-6">
                            <ResponsiveContainer width="100%" height="90%">
                            <h2 className="text-xl  text-[#8f8d9f] font-bold mb-2  text-">Scores Comparison</h2>
                                <RadarChart width={400} height={300}  data={dataState}>
                                    <PolarGrid />
                                    <PolarAngleAxis dataKey="category"/>
                                    <PolarRadiusAxis tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} domain={[domain.min ,domain.max]}/>
                                    <Radar name="Company_Av" dataKey="Company_Av" stroke="rgb(220, 28, 68)" fill="rgb(259, 88, 68)" fillOpacity={0.3} />
                                    {/* <Radar name="Individual_Av" dataKey="Individual_Av" stroke="#ffcf58" fill="#ffc658" fillOpacity={0.3} /> */}
                                    <Radar name="All_Av" dataKey="All_Av" stroke="#4f8ef7" fill="#4f8ef7" fillOpacity={0.3} />
                                    <Radar name="Sector_Av" dataKey="Sector_Av" stroke="#4caf7f" fill="#4caf7f" fillOpacity={0.3} />
                                    <Tooltip formatter={(value) => `${(value * 100).toFixed(1)}%`}/>
                                    <Legend />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
                <div className="p-6 grid grid-cols-1 gap-10"> 
                    <div className="  bg-[#161616] rounded-2xl shadow p-4  ">
                        <div className="w-[100%] h-[95%]  flex flex-col justify-center items-center -ml-6">
                            <ResponsiveContainer width="100%" height="100%" >
                            <h2 className="text-xl text-[#8f8d9f] font-bold mb-2 -mr-9  text-">Gender Bubble Chart</h2>
                               <ComposedChart width={400}  data={genderStats}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis  type="category" scale="band"  dataKey="category" tick={({ x, y, payload }) => {
                                        const offset = -80;
                                        return (
                                            <g transform={`translate(${x - offset}, ${y + 15})`}>
                                            <text textAnchor="middle" fill="#666">{payload.value}</text>
                                            </g>
                                        );
                                        }} />
                                    <YAxis tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}  type="number" />
                                    <Tooltip formatter={(value) => `${(value * 100).toFixed(1)}%`}/>
                                    <Scatter shape={({ cx, cy, payload }) => {
                                                return <circle cx={cx} cy={cy} r={30} fill="rgb(259, 88, 68)" stroke="rgb(220, 28, 68)" fillOpacity={0.2} />;
                                            }} name="Man" dataKey="Man" fill="rgb(259, 88, 68)"/>
                                    <Scatter shape={({ cx, cy, payload }) => {
                                                return <circle cx={cx} cy={cy} r={30} fill="#ffc658" stroke="#ffcf58" fillOpacity={0.2} />;
                                            }} name="Woman" dataKey="Woman" fill="#ffc658" />
                                    {/* <Tooltip /> */}
                                    <Legend />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="  bg-[#161616] rounded-2xl shadow p-4  ">
                        <div className="w-[100%] h-[95%]  flex flex-col justify-center items-center -ml-6">
                            <ResponsiveContainer width="100%" height="100%">
                                <h2 className="text-xl text-[#8f8d9f] font-bold mb-2 -mr-9 text-">Management Bubble Chart</h2>
                               <ComposedChart width={400}  data={ManagementStats}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis  type="category" scale="band"  dataKey="category" tick={({ x, y, payload }) => {
                                        const offset = -80;
                                        return (
                                            <g transform={`translate(${x - offset}, ${y + 15})`}>
                                            <text textAnchor="middle" fill="#666">{payload.value}</text>
                                            </g>
                                        );
                                        }} />
                                    <YAxis tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}  type="number" />
                                    <Tooltip formatter={(value) => `${(value * 100).toFixed(1)}%`}/>
                                    <Scatter shape={({ cx, cy, payload }) => {
                                                return <circle cx={cx} cy={cy} r={30} fill="rgb(259, 88, 68)" stroke="rgb(220, 28, 68)" fillOpacity={0.2} />;
                                            }} name="Yes" dataKey="Yes" fill="rgb(259, 88, 68)"/>
                                    <Scatter shape={({ cx, cy, payload }) => {
                                                return <circle cx={cx} cy={cy} r={30} fill="#ffc658" stroke="#ffcf58" fillOpacity={0.2} />;
                                            }} name="No" dataKey="No" fill="#ffc658" />
                                    {/* <Tooltip /> */}
                                    <Legend />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="  bg-[#161616] rounded-2xl shadow p-4  ">
                        <div className="w-[100%] h-[95%]  flex flex-col justify-center items-center -ml-6">
                            <ResponsiveContainer width="100%" height="100%" >
                            <h2 className="text-xl text-[#8f8d9f] font-bold mb-2 -mr-9  text-">Department Bubble Chart</h2>
                               <ComposedChart width={400}  data={departmentD}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis  type="category" scale="band"  dataKey="category" tick={({ x, y, payload }) => {
                                        const offset = -80;
                                        return (
                                            <g transform={`translate(${x - offset}, ${y + 15})`}>
                                            <text textAnchor="middle" fill="#666">{payload.value}</text>
                                            </g>
                                        );
                                        }} />
                                    <YAxis tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}  type="number" />
                                    <Tooltip formatter={(value) => `${(value * 100).toFixed(1)}%`}/>
                                    {Groups.departmentGroups.map((val, index) => { 
                                        const hue = (index * 60) % 360; // change step size (e.g., 60) for more/less variation
                                        const fill = `hsl(${hue}, 70%, 60%)`;
                                        const stroke = `hsl(${hue}, 90%, 40%)`;
                                        return (<Scatter shape={({ cx, cy, payload }) => {
                                                return <circle cx={cx} cy={cy} r={30} fill={fill} stroke={stroke} fillOpacity={0.2} />;
                                            }} name={val} dataKey={val} fill={fill}/>)})}
                                    {/* <Tooltip /> */}
                                    {/* <Legend /> */}
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="  bg-[#161616] rounded-2xl shadow p-4  ">
                        <div className="w-[100%] h-[95%]  flex flex-col justify-center items-center -ml-6">
                            <ResponsiveContainer width="100%" height="100%">
                                <h2 className="text-xl text-[#8f8d9f] font-bold mb-2 -mr-9 text-">Age Bubble Chart</h2>
                               <ComposedChart width={400}  data={ageStats}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis  type="category" scale="band"  dataKey="category" tick={({ x, y, payload }) => {
                                        const offset = -80;
                                        return (
                                            <g transform={`translate(${x - offset}, ${y + 15})`}>
                                            <text textAnchor="middle" fill="#666">{payload.value}</text>
                                            </g>
                                        );
                                        }} />
                                    <YAxis tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}  type="number" />
                                    <Tooltip formatter={(value) => `${(value * 100).toFixed(1)}%`}/>
                                    {Groups.ageGroups.map((val, index) => { 
                                        const hue = (index * 60) % 360; // change step size (e.g., 60) for more/less variation
                                        const fill = `hsl(${hue}, 70%, 60%)`;
                                        const stroke = `hsl(${hue}, 90%, 40%)`;
                                        return (<Scatter shape={({ cx, cy, payload }) => {
                                                return <circle cx={cx} cy={cy} r={30} fill={fill} stroke={stroke} fillOpacity={0.2} />;
                                            }} name={val} dataKey={val} fill={fill}/>)})}
                                    <Legend/>
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    
            </div>
            <div className="p-6 grid grid-cols-1 gap-10"> 
                <PCACluster data={clustering.pca}/>
                <div className="w-full px-4 mt-9">
                    <Explanation data={clustering.clustersProfile} chartType="pca plot" />
                </div>
            </div>
            <div className="p-6 grid grid-cols-1 gap-10"> 
                    <div className="  bg-[#161616] rounded-2xl shadow p-4  ">
                        <div className="w-[100%] h-[100%]  flex flex-col justify-start items-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <h2 className="text-xl text-[#8f8d9f] font-bold mb-2  text-">Box Plot of Scores</h2>
                                <div className="mt-9">
                                    <ApexChart normalDistributions={normalDistributions} />
                                    <Explanation data={normalDistributions} chartType="box plot"/>
                                </div>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className=" bg-[#161616] rounded-2xl shadow p-4">
                        <div className="w-[100%] h-[100%]   flex flex-col justify-start items-center">
                            <h2 className="text-xl text-[#8f8d9f] font-bold  text-"> Kernel Density Estimation of Scores</h2>
                            <div className="w-full h-[500px]">
                                <ResponsiveContainer width="100%"  height="95%">
                                    <AreaChart className=" mt-6 -ml-6" >
                                        <CartesianGrid strokeDasharray="5 5" />
                                        <XAxis tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}  dataKey="x"  type="number" domain={[0, 1]}  />
                                        <YAxis tickFormatter={tick => `${(tick * 10).toFixed(0)}%`}  ticks={[, 1, 2,3, 4]} type="number" domain={[0, 4]}/>
                                        <Tooltip 
                                        content={chartAreaToolTip}
                                        />
                                        {categories.map((category)=>(
                                            <Area type="monotone"  dataKey="y" data={normalDistributions[category].kpoints} name={category} stroke={categoryColors[category]} fill={categoryColors[category] + 70} />
                                            
                                        ))}
                                        <Legend />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="w-full px-4 mt-9">
                                <Explanation data={normalDistributions} chartType="kde plot" />
                            </div>
                        </div>
                    </div>
                    <div className=" bg-[#161616] rounded-2xl shadow p-4">
                        <div className="w-[100%] h-[100%]   flex flex-col justify-start items-center">
                            <h2 className="text-xl text-[#8f8d9f] font-bold  text-">Normal Distributions of Scores</h2>
                            <div className="w-full h-[500px]">
                                <ResponsiveContainer width="100%"  height="95%">
                                    <ComposedChart className=" mt-6 -ml-6" >
                                        <CartesianGrid strokeDasharray="5 5" />
                                        <XAxis tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}  dataKey="x"  type="number" domain={[0, 1]}  />
                                        <YAxis dataKey="y" tickFormatter={tick => `${(tick * 10).toFixed(0)}%`}  ticks={[1, 2,3, 4]} type="number" domain={[0, 4]}/>
                                        <Tooltip 
                                        content={chartAreaToolTip}
                                        />
                                        {categories.map((category)=>(
                                            <Area type="monotone"  dataKey="y" data={normalDistributions[category].points} name={category} stroke={categoryColors[category]} fill={categoryColors[category] + 70} />
                                            
                                        ))}
                                        <Scatter
                                            data={[{ x: 0.5, y : 0.4 }]}
                                            fill="red"
                                            shape='circle'
                                            name="My Point"
                                            />
                                        <Legend />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="w-full px-4 mt-9">
                                <Explanation data={normalDistributions} chartType="normal distribution plot" />
                            </div>
                        </div>
                    </div>
                    <div className=" bg-[#161616] rounded-2xl shadow p-4">
                        <div className="w-[100%] h-[100%]   flex flex-col justify-start items-center">
                            <h2 className="text-xl text-[#8f8d9f] font-bold  text-">Normal Distributions of Scores</h2>
                            <div className="w-full h-[90%]">
                                <div>
                                <label className="block font-semibold text-[#f9f9f9]"> category</label>
                                    <select name="categories" onChange={disChangeCategory} value={disCategory} className="appearance-none bg-white mt-3 border p-2 pr-8 rounded">
                                        <option value="PR">PR</option>
                                        {categories.map((key) => (<option key={key} value={key}>{key}</option>))}
                                    </select>
                                </div>
                                <ResponsiveContainer width="100%"  height="90%">
                                    <AreaChart className=" mt-6 -ml-6" >
                                        <CartesianGrid strokeDasharray="5 5" />
                                        <XAxis tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}  dataKey="x"  type="number" domain={[0, 1]}  />
                                        <YAxis tickFormatter={tick => `${(tick * 10).toFixed(0)}%`}  ticks={[, 1, 2,3, 4]} type="number" domain={[0, 4]}/>
                                        <Tooltip content={chartAreaToolTip}/>
                                        <Area type="monotone"  dataKey="y" data={normalDistributions[disCategory].kpoints} name={disCategory} stroke={categoryColors[disCategory]} fill={categoryColors[disCategory] + 70} />
                                        <Area type="monotone"  dataKey="y" data={normalDistributions[disCategory].points} name={disCategory} stroke={categoryColors[disCategory] + 90} fill={categoryColors[disCategory] + 100} />
                                        <Legend />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                    <div className=" bg-[#161616] rounded-2xl shadow p-4">
                        <div className="w-[100%] h-[100%]   flex flex-col justify-start items-center">
                            <h2 className="text-xl text-[#8f8d9f] font-bold  text-">Scores Interpretation</h2>
                            <div className="w-full h-[90%]">
                            {Object.entries(processAllData.interpretation).map(([category, values]) => (
                                <div key={category} className="mb-6 p-4 bg-[#3f3f3f] rounded-md ">
                                    <h2 className="text-xl text-neutral-400 font-bold mb-2">{category} : {values.exp}</h2>
                                    <p className="text-neutral-400">{values.res}</p>
                                </div>
                                ))}
                                
                            </div>
                        </div>
                    </div>
                    <div className=" bg-[#161616] rounded-2xl shadow p-4">
                        <div className="w-[100%] h-[100%]   flex flex-col justify-start items-center">
                            <h2 className="text-xl text-[#8f8d9f] font-bold  text-">Company Scores Interpretation</h2>
                            <div className="w-full h-[90%]">
                            {Object.entries(processAllData.interCompany).map(([category, values]) => (
                                <div key={category} className="mb-6 p-4 bg-[#3f3f3f] rounded-md ">
                                    <h2 className="text-xl text-neutral-400 font-bold mb-2">{category} : {values.exp}</h2>
                                    <p className="text-neutral-400">{values.res}</p>
                                </div>
                                ))}
                                
                            </div>
                        </div>
                    </div>
                    <div className=" bg-[#161616] rounded-2xl shadow p-4">
                        <div className="w-[100%] h-[100%]   flex flex-col justify-start items-center">
                            <h2 className="text-xl text-[#8f8d9f] font-bold  text-"> Overall vs Company-Specific Score Distributions</h2>
                            <div className="w-full h-[90%]">
                                <div>
                                <label className="block font-semibold text-[#f9f9f9]"> category</label>
                                    <select name="categories" onChange={disChangeCategory} value={disCategory} className="appearance-none bg-white mt-3 border p-2 pr-8 rounded">
                                        {/* <option value="PR">PR</option> */}
                                        {categories.map((key) => (<option key={key} value={key}>{key}</option>))}
                                    </select>
                                </div>
                                {processAllData.normalDistributions[disCategory] && normalDistributions[disCategory] && (<ResponsiveContainer width="100%"  height="90%">
                                    <ComposedChart className=" mt-6 -ml-6" >
                                        <CartesianGrid strokeDasharray="5 5" />
                                        <XAxis tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}  dataKey="x"  type="number" domain={[0, 1]}  />
                                        <YAxis tickFormatter={tick => `${(tick * 10).toFixed(0)}%`}  ticks={[, 1, 2,3, 4]} dataKey="y" type="number" domain={[0, 4]}/>
                                        <Tooltip content={chartAreaToolTip}/>
                                        <Area type="monotone"  dataKey="y" data={normalDistributions[disCategory].kpoints} id={disCategory} name={`company-${disCategory}`} stroke={categoryColors[disCategory]} fill={categoryColors[disCategory] + 70} />
                                        <Area type="monotone"  dataKey="y" data={processAllData.normalDistributions[disCategory].kpoints} name={disCategory} stroke={categoryColors[disCategory] + 90} fill={categoryColors[disCategory] + 100} />
                                        <Scatter
                                            data={[{ x: processAllData.normalDistributions[disCategory].idKpoint.x, y : processAllData.normalDistributions[disCategory].idKpoint.y }]}
                                            fill="red"
                                            shape={({ cx, cy, payload }) => {
                                                return <circle cx={cx} cy={cy} r={7} fill="red" />;
                                            }}
                                            name="Individual-data"
                                            />
                                        <Scatter
                                            data={[{ x: normalDistributions[disCategory].idKpoint.x, y : normalDistributions[disCategory].idKpoint.y }]}
                                            shape={({ cx, cy, payload }) => {
                                                return <circle cx={cx} cy={cy} r={7} fill="green" />;
                                            }}
                                            name="Individual-company"
                                            fill='green'
                                        />
                                        <Legend />
                                        <Legend />
                                    </ComposedChart>
                                </ResponsiveContainer>)}
                            </div>
                        </div>
                    </div>
                    <div className=" bg-[#161616] rounded-2xl shadow p-4">
                        <div className="w-[100%] h-[100%]   flex flex-col justify-start items-center">
                            <h2 className="text-xl text-[#8f8d9f] font-bold  text-"> Overall vs Company-Specific Score Distributions</h2>
                            <div className="w-full h-[90%]">
                                <div>
                                <label className="block font-semibold text-[#f9f9f9]"> category</label>
                                    <select name="categories" onChange={disChangeCategory} value={disCategory} className="appearance-none bg-white mt-3 border p-2 pr-8 rounded">
                                        {/* <option value="PR">PR</option> */}
                                        {categories.map((key) => (<option key={key} value={key}>{key}</option>))}
                                    </select>
                                </div>
                                {processAllData.secNormalDistributions[disCategory] && normalDistributions[disCategory] && (<ResponsiveContainer width="100%"  height="90%">
                                    <ComposedChart className=" mt-6 -ml-6" >
                                        <CartesianGrid strokeDasharray="5 5" />
                                        <XAxis tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}  dataKey="x"  type="number" domain={[0, 1]}  />
                                        <YAxis tickFormatter={tick => `${(tick * 10).toFixed(0)}%`}  ticks={[, 1, 2,3, 4]} dataKey="y" type="number" domain={[0, 4]}/>
                                        <Tooltip content={chartAreaToolTip}/>
                                        <Area type="monotone"  dataKey="y" data={normalDistributions[disCategory].kpoints} id={disCategory} name={`company-${disCategory}`} stroke={categoryColors[disCategory]} fill={categoryColors[disCategory] + 70} />
                                        <Area type="monotone"  dataKey="y" data={processAllData.secNormalDistributions[disCategory].kpoints} id="sectorData" name={disCategory} stroke={categoryColors[disCategory] + 90} fill={categoryColors[disCategory] + 100} />
                                        <Scatter
                                            data={[{ x: processAllData.secNormalDistributions[disCategory].idKpoint.x, y : processAllData.secNormalDistributions[disCategory].idKpoint.y }]}
                                            fill="red"
                                            shape={({ cx, cy, payload }) => {
                                                return <circle cx={cx} cy={cy} r={7} fill="red" />;
                                            }}
                                            name="Individual-data"
                                            />
                                        <Scatter
                                            data={[{ x: normalDistributions[disCategory].idKpoint.x, y : normalDistributions[disCategory].idKpoint.y }]}
                                            shape={({ cx, cy, payload }) => {
                                                return <circle cx={cx} cy={cy} r={7} fill="green" />;
                                            }}
                                            name="Individual-company"
                                            fill='green'
                                        />
                                        <Legend />
                                        <Legend />
                                    </ComposedChart>
                                </ResponsiveContainer>)}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-6 grid grid-cols-2 gap-10"> 
                    <div className="  bg-[#161616] rounded-2xl shadow p-4  ">
                        <div className="w-[115%] h-[105%]  flex flex-col justify-start items-center -ml-6">
                            <ResponsiveContainer width="85%" height="75%">
                                <h2 className="text-xl text-[#8f8d9f] font-bold mb-2  text-">Questions rate clustering</h2>
                                    {/* <label className="block font-semibold text-gray-700">low precent</label> */}
                                    <div className="flex flex-row justify-around">
                                        <div>
                                        <label className="block font-semibold text-[#f9f9f9]"> category</label>
                                            <select name="categories" onChange={changeCategory} value={category} className="appearance-none bg-white mt-3 border p-2 pr-8 rounded">
                                                <option value="">All</option>
                                                {categories.map((key) => (<option key={key} value={key}>{key}</option>))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block font-semibold text-[#f9f9f9]">LR percentage</label>
                                            <input type="number" min="0" max="100" value={quesLowPercent} onChange={quesChangeLowPercent} onKeyDown={reranderQuesLowPersent} placeholder="Low percent" className="appearance-none mt-3 bg-whitel border p-2 rounded">
                                            </input>
                                        </div>

                                    </div>
                                <PieChart>
                                    <Pie
                                        dataKey="ratePercent"
                                        isAnimationActive={true}
                                        data={quesRateClusters}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={150}
                                        stroke="#000000"
                                        label={(entry)=> { 
                                            let value = Number.isInteger(entry.value) ? `${entry.value}%` : `${(entry.value).toFixed(2)}%`;
                                            return (value)}}
                                        className=" cursor-pointer"
                                    >
                                        <Cell key={`cell-${1}`} fill="#a4de6c"/>
                                        <Cell key={`cell-${2}`} fill="#ffc658" />
                                        <Cell key={`cell-${3}`} fill="rgb(259, 88, 68)" />
                                    </Pie>
                                    <Tooltip formatter={lowRateQuesDisplay} />
                                    <Legend iconSize={20}
                                        iconType="circle"
                                        />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="  bg-[#161616] rounded-2xl shadow p-4  ">
                        <div className="w-[115%] h-[105%]  flex flex-col justify-start items-center -ml-6">
                            <ResponsiveContainer width="85%" height="75%">
                                <h2 className="text-xl text-[#8f8d9f] font-bold mb-2  text-">Person rate clustering</h2>
                                    {/* <label className="block font-semibold text-gray-700">low precent</label> */}
                                    <div className="flex flex-row justify-around">
                                        <div>
                                            <label className="block font-semibold text-[#f9f9f9]">LR percentage</label>
                                            <input type="number" min="0" max="100" value={persLowPercent} onChange={persChangeLowPercent} onKeyDown={reranderPersLowPersent} placeholder="Low percent" className="appearance-none mt-3 bg-whitel border p-2 rounded">
                                            </input>
                                        </div>

                                    </div>
                                <PieChart>
                                    <Pie
                                        dataKey="ratePercent"
                                        isAnimationActive={true}
                                        data={persRateClusters}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={150}
                                        stroke="#000000"
                                        label={(entry)=> { 
                                            let value = Number.isInteger(entry.value) ? `${entry.value}%` : `${(entry.value).toFixed(2)}%`;
                                            return (value)}}
                                        className=" cursor-pointer"
                                    >
                                        <Cell key={`cell-${1}`} fill="#9be8d9"/>
                                        <Cell key={`cell-${2}`} fill="#f8fdcf" />
                                        <Cell key={`cell-${3}`} fill="#ff9a9b" />
                                    </Pie>
                                    <Tooltip formatter={lowRatePersDisplay} />
                                    <Legend iconSize={20}
                                        iconType="circle"
                                        />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    
            </div>
          </motion.div>
          )}
          </AnimatePresence>
        </div>
      </div>
    )
}

export default UploadAndDashboardPage;