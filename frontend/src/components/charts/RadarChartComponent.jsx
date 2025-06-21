import React from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  Legend
} from 'recharts';
import Explanation from "../insights/chartExpComp"


const RadarChartComponent = ({ dataState, domains, title }) => {
  return (
    <div className="p-6 grid grid-cols-1 gap-10">
      <div className="bg-[#161616] rounded-2xl shadow p-4">
        <div className="w-full flex flex-col justify-start items-center">
          <h2 className="text-xl text-[#8f8d9f] font-bold mb-4">{title}</h2>
          <div className="w-full h-[600px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={dataState}>
                <PolarGrid />
                <PolarAngleAxis dataKey="category" />
                <PolarRadiusAxis
                  tickFormatter={(value) => `${(value).toFixed(0)}%`}
                  domain={[domains.radar.min, domains.radar.max]}
                />
                <Radar name="Company_Av" dataKey="Company_Av" stroke="rgb(220, 28, 68)" fill="rgb(220, 28, 68)" fillOpacity={0.3} />
                <Radar name="All_Av" dataKey="All_Av" stroke="#4f8ef7" fill="#4f8ef7" fillOpacity={0.3} />
                <Radar name="Sector_Av" dataKey="Sector_Av" stroke="#4caf7f" fill="#4caf7f" fillOpacity={0.3} />
                <Tooltip formatter={(value) => `${(value)}%`} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full mt-10  px-4">
                <Explanation data={dataState} chartType="radar chart"/>
            </div>
        </div>
      </div>
    </div>
  );
};

export default RadarChartComponent;
