import React, {useEffect, useMemo} from "react";
import {
  ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from "recharts";

import Explanation from "../insights/chartExpComp"

const clusterColors = ["#82ca9d", "#8884d8", "#ffc658", "#ff7300", "#413ea0"];

const PCACluster = ({ data , profiles, title}) => {

  const clusters = useMemo(()=>{
      const GrouedCluster = {};
      data.forEach(item => {
        const cluster = item.Cluster_Q;
        if (!GrouedCluster[cluster]) GrouedCluster[cluster] = [];
        GrouedCluster[cluster].push(item);
      });  
      return GrouedCluster;
  }, [data])

  return (
        <div className="p-6 grid grid-cols-1 gap-10"> 
            <div className="  bg-[#161616] rounded-2xl shadow p-4  ">
                <div className="w-[98%] h-[95%]  flex flex-col justify-center items-center -ml-2 ">
                    <ResponsiveContainer width="100%" height="100%" >
                    <h2 className="text-xl text-[#8f8d9f] font-bold mb-2 -mr-9  text-">{title}</h2>

                        <ScatterChart>
                            <CartesianGrid />
                            <XAxis label={{value: "Principal Component 1", position:"insideBottom", offset: -10 , dx:330}} type="number" dataKey="PCA1" name="Principal Component 1" />
                            <YAxis label={{value: "Principal Component 2", position:"insideRight", angle: -90, offset:50 , dy:-280}}  type="number" dataKey="PCA2" name="Principal Component 2" />
                            <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                            <Legend />
                            {Object.entries(clusters).map(([cluster, points], index) => (
                                <Scatter
                                key={cluster}
                                name={`Cluster ${cluster}`}
                                data={points}
                                fill={clusterColors[index % clusterColors.length]}
                                shape="circle"
                                />
                            ))}
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div className="w-full px-4 mt-9">
                <Explanation data={profiles} chartType="pca plot" />
            </div>
        </div>
  );
};

export default React.memo(PCACluster);