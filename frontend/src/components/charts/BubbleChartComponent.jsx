import React, {useState, useEffect, useMemo, memo} from 'react';
import useDeepCompareEffect from 'use-deep-compare-effect';
import Explanation from "../insights/chartExpComp"

import {
  ResponsiveContainer,
  ComposedChart,
  ScatterChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Scatter,
  Tooltip,
  Legend
} from 'recharts';

const BubbleChartComponent = ({data, domain, groups, groupType , title }) => {
  const [selectedGroup, setSelectedGroup] = useState(null);
  
  const visibleGroups = useMemo(() => {
    return selectedGroup ? [selectedGroup] : groups;
  }, [selectedGroup, groups]);
  
  const colorMap = useMemo(() => {
    const map = {};
    if(groupType === "Gender")
    {
        const baseHues = [220, 330];
        visibleGroups.forEach((val, index) => {
          const hue = baseHues[index % 2] + Math.floor(index / 2) * 30;
          map[val] = {
            fill: `hsl(${hue % 360}, 70%, 60%)`,
            stroke: `hsl(${hue % 360}, 90%, 40%)`
          };
        });
      }
      else
     { 
      visibleGroups.forEach((val, index) => {
      const hue = index * 60;
      map[val] = {
        fill: `hsl(${hue}, 70%, 60%)`,
        stroke: `hsl(${hue}, 90%, 40%)`
      };
    });}
    return map;
  }, []);
  const getScatter = (name, color, stroke) => (
    <Scatter
      name={name}
      dataKey={name}
      fill={color}
      shape={({ cx, cy, payload }) => {
        if (!payload || payload[name] === undefined) return null;
        
        return(
        <circle cx={cx} cy={cy} r={30} fill={color} stroke={stroke} fillOpacity={0.6} strokeWidth={2} />
      )}}
    />
  );
  const memoizedScatters = useMemo(() => {
    return visibleGroups.map((val, index) => {
      const { fill, stroke } = colorMap[val];
  
      return (
        <Scatter
          key={val}
          name={val}
          dataKey={val}
          fill={fill}
          shape={({ cx, cy, payload }) => {
            if (!payload || payload[val] === undefined) return null;
            return (
              <circle
                cx={cx}
                cy={cy}
                r={30}
                fill={fill}
                stroke={stroke}
                fillOpacity={0.6}
                strokeWidth={2}
              />
            );
          }}
        />
      );
    });
  }, [visibleGroups, colorMap]);
  
  
  const filterScatter = (e) => {
    const group = e.dataKey;
    if (selectedGroup === group) 
      setSelectedGroup(null);
    else
      setSelectedGroup(group);
  }
  return (
    <div className="bg-[#161616] rounded-2xl shadow p-6">
  <div className="w-full flex flex-col items-center">
    <h2 className="text-xl text-[#8f8d9f] font-bold mb-4">{title}</h2>
    
    <div className="w-full h-[600px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart 
          data={data}
          margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
          style={{ overflow: 'hidden' }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="category"
            axisLine={false}
            tickLine={false}
            tick={{ dx: 0, dy: 25 }}
            interval={0}
          />
          <YAxis 
            tickFormatter={(value) => `${(value).toFixed(0)}%`}
            domain={[domain.min - 0.02, domain.max + 0.02]}
            type="number"
            axisLine={false}
            tickLine={false}
            tick={{ dx: -25, dy: 0 }}
            interval={0}
          />
          <Tooltip formatter={(value) => `${(value)}%`} />
          
          {memoizedScatters}

          <Legend 
            wrapperStyle={{ cursor: 'pointer', marginBottom: '-30px' }}
            onClick={filterScatter}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  </div>

  <div className="w-full mt-10 px-4">
    <Explanation data={data} chartType="bubble chart" groups={groups} groupType={groupType} />
  </div>
</div>

  );
}

export default React.memo(BubbleChartComponent);