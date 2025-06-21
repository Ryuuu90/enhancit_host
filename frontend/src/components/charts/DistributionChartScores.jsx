import React, {useState} from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, Area,
ComposedChart, ResponsiveContainer, Scatter 
} from "recharts";

import Explanation from "../insights/chartExpComp"

import chartAreaToolTip from "../../utils/chartAreaToolTip";

const categoryColors = {
    CI: "#0088FE",
    OP: "#00C49F",
    PR: "#FFBB28",
    AD: "#FF8042",
    CO: "#A020F0",
};

const DistributionChartScores = ({normalDistributions, processAllData ,reportType,DisType, title}) => {
    const categories = ['PR', 'CO', 'OP', 'AD', 'CI'];
    return (
        <div className=" bg-[#161616] rounded-2xl shadow p-4">
            <div className="w-[100%] h-[100%]   flex flex-col justify-start items-center">
                <h2 className="text-xl text-[#8f8d9f] font-bold  text-">{title}</h2>
                <div className="w-full h-[500px]">
                    <ResponsiveContainer width="100%"  height="95%">
                        <ComposedChart className=" mt-6 -ml-6" >
                            <CartesianGrid strokeDasharray="5 5" />
                            <XAxis  dataKey="x" tickFormatter={tick => `${(tick).toFixed(0)}%`}  type="number" domain={[0, 100]}  />
                            <YAxis dataKey="y" tickFormatter={tick => `${(tick * 10).toFixed(0)}%`}  ticks={[1, 2,3, 4]} type="number" domain={[0, 4]}/>
                            <Tooltip 
                            content={chartAreaToolTip(reportType, normalDistributions, processAllData)}
                            />
                            
                            {DisType === "Normal Distributions" && categories.map((category)=>(
                                <Area type="monotone"  dataKey="y" data={normalDistributions[category].points} name={category} stroke={categoryColors[category]} fill={categoryColors[category] + 70} />
                                
                            ))}
                            {DisType !== "Normal Distributions" && categories.map((category)=>(
                                <Area type="monotone"  dataKey="y" data={normalDistributions[category].kpoints} name={category} id={category} stroke={categoryColors[category]} fill={categoryColors[category] + 70} />
                                
                            ))}
                            <Legend />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
                <div className="w-full px-4 mt-9">
                    <Explanation data={normalDistributions} chartType="normal distribution plot" />
                </div>
            </div>
        </div>
    )
    
}

export default DistributionChartScores;