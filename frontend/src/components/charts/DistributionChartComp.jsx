import React, {useState} from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, Area,
ComposedChart, ResponsiveContainer, Scatter 
} from "recharts";

import chartAreaToolTip from "../../utils/chartAreaToolTip";
import Explanation from "../insights/chartExpComp"

const categoryColors = {
  CI: "#0088FE",
  OP: "#00C49F",
  PR: "#FFBB28",
  AD: "#FF8042",
  CO: "#A020F0",
};

const  DistributionChartComp = ({dataToComp,normalDistributions, processAllData ,reportType }) => {

  const [disCategory, setDisCategory] = useState('PR');
  const categories = ['PR', 'CO', 'OP', 'AD', 'CI'];

  let data;
  if(dataToComp == "OverAll")
    data = processAllData.normalDistributions;
  else if(dataToComp == "Sector")
    data = processAllData.secNormalDistributions;
  else
    data = normalDistributions;

  const disChangeCategory = (e)=>{
      setDisCategory(e.target.value);
  }

  return (  <div className=" bg-[#161616] rounded-2xl shadow p-4">
    <div className="w-[100%] h-[100%]   flex flex-col justify-start items-center">
        {dataToComp !== "NormalDis" && (<h2 className="text-xl text-[#8f8d9f] font-bold  text-"> {dataToComp} vs Company-Specific Score Distributions</h2>)}
        {dataToComp === "NormalDis" && (<h2 className="text-xl text-[#8f8d9f] font-bold  text-"> Normal Distributions vs Kernel Density</h2>)}
        <div className="w-full h-[70%]">
            <div>
            <label className="block font-semibold text-[#f9f9f9]"> category</label>
                <select name="categories" onChange={disChangeCategory} value={disCategory} className="appearance-none bg-white mt-3 border p-2 pr-8 rounded">
                    {/* <option value="PR">PR</option> */}
                    {categories.map((key) => (<option key={key} value={key}>{key}</option>))}
                </select>
            </div>
            {data[disCategory] && normalDistributions[disCategory] && (<ResponsiveContainer width="100%"  height="90%">
                <ComposedChart className=" mt-6 -ml-6" >
                    <CartesianGrid strokeDasharray="5 5" />
                    <XAxis tickFormatter={(value) => `${(value).toFixed(0)}%`}  dataKey="x"  type="number" domain={[0, 1]}  />
                    <YAxis tickFormatter={tick => `${(tick).toFixed(0)}%`}  ticks={[1, 2,3, 4]} dataKey="y" type="number" domain={[0, 4]}/>
                    <Tooltip content={chartAreaToolTip(reportType, normalDistributions, processAllData)}/>
                    <Area type="monotone"  dataKey="y" data={normalDistributions[disCategory].kpoints} id={disCategory} name={`company-${disCategory}`} stroke={categoryColors[disCategory]} fill={categoryColors[disCategory] + 70} />
                    {dataToComp != "NormalDis" && (  <Area type="monotone"  dataKey="y" data={data[disCategory].kpoints} name={disCategory} stroke={categoryColors[disCategory] + 90} fill={categoryColors[disCategory] + 100} />)}
                    {dataToComp == "NormalDis" && (  <Area type="monotone"  dataKey="y" data={data[disCategory].points} name={disCategory} stroke={categoryColors[disCategory] + 90} fill={categoryColors[disCategory] + 100} />)}
                    {reportType !== "company" &&<> <Scatter
                        data={[{ x: processAllData.secNormalDistributions[disCategory].idKpoint.x, y : data[disCategory].idKpoint.y }]}
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
                    /></>}
                    <Legend />
                    <Legend />
                </ComposedChart>
            </ResponsiveContainer>)}
        <div className="w-full px-4 mt-9">
                  {dataToComp == "NormalDis" &&   (<Explanation data={normalDistributions[disCategory]} data2={data[disCategory]} chartType="distribution comparison"  name1={"Kernel Density"} name2={"Normal Distribution"}/>)}
                  {dataToComp != "NormalDis" &&   (<Explanation data={normalDistributions[disCategory]} data2={data[disCategory]} chartType="distribution comparison"  name1={"Your campany"} name2={dataToComp}/>)}
        </div>
        </div>
    </div>
</div>)
}
export default DistributionChartComp;