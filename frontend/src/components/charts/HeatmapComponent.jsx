import React from 'react';
import Plot from 'react-plotly.js';
import Explanation from "../insights/chartExpComp";


const HeatmapComponent = ({ clustering }) => {

return (
    <div className=" bg-[#161616] rounded-2xl shadow p-4">
                        <div className="w-[100%] h-[100%]   flex flex-col justify-start items-center">
                            <h2 className="text-xl text-[#8f8d9f] font-bold  text-"> Correlation Matrix of KPI Scores</h2>

                            {!clustering?.heatmap?.data ? <div>Loading heatmap...</div> : 
                            <Plot
                                data={[
                                    {
                                    z: clustering.heatmap.data,
                                    x: clustering.heatmap.x,
                                    y: clustering.heatmap.y,
                                    type: "heatmap",
                                    colorscale: "RdBu",
                                    zmin: -1,
                                    zmax: 1,
                                    text: clustering.heatmap.data.map(row => row.map(val => (val * 100).toFixed(0))),
                                    texttemplate: "%{text}%",
                                    textfont: {
                                        size: 12,
                                        color: "white",
                                    },
                                    },
                                ]}
                                layout={{
                                    title: "Correlation Matrix",
                                    width: 700,
                                    height: 600,
                                    paper_bgcolor: "rgba(0,0,0,0)",
                                    plot_bgcolor: "white", 
                                    margin: { l: 50, r: 50, t: 50, b: 50 },
                                    xaxis: {
                                      showgrid: false,
                                      zeroline: false,
                                    },
                                    yaxis: {
                                      showgrid: false,
                                      zeroline: false,
                                    },
                                  }}
                                  config={{
                                    displayModeBar: false,    
                                    staticPlot: false,       
                                    responsive: false,
                                  }}
                                />}
                                <div className="w-full px-4 mt-9">
                                    <Explanation data={clustering.heatmap} chartType="heatmap plot" />
                                </div>
                        </div>
                     </div>
  );
}

export default HeatmapComponent;