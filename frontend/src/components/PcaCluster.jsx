import React from "react";
import {
  ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from "recharts";

// Example data format from your backend:
// [
//   { PCA1: 1.23, PCA2: -0.45, Cluster_Q: 0 },
//   { PCA1: 0.56, PCA2: 1.78, Cluster_Q: 1 },
//   ...
// ]

// Sample colors for clusters, add more if needed
const clusterColors = ["#82ca9d", "#8884d8", "#ffc658", "#ff7300", "#413ea0"];

const PCACluster = ({ data }) => {
  // Group data by cluster for separate Scatter components (needed to color by cluster)
  const clusters = {};
  data.forEach(item => {
    const cluster = item.Cluster_Q;
    if (!clusters[cluster]) clusters[cluster] = [];
    clusters[cluster].push(item);
  });

  return (
    <div className="  bg-[#161616] rounded-2xl shadow p-4  ">
    <   div className="w-[98%] h-[95%]  flex flex-col justify-center items-center -ml-2 ">
            <ResponsiveContainer width="100%" height="100%" >
            <h2 className="text-xl text-[#8f8d9f] font-bold mb-2 -mr-9  text-">PCA projection of Clusters</h2>

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
  );
};

export default PCACluster;