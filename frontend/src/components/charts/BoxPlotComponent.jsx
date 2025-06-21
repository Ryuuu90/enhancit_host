import ReactApexChart from "react-apexcharts";
import Explanation from "../insights/chartExpComp";
import { ResponsiveContainer} from "recharts";
import React from "react";
const BoxPlotComponent = ({ normalDistributions, reportType, withOutliers, title , language}) => {

  const series = [
    {
      name: 'box',
      type: 'boxPlot',
      data: Object.entries(normalDistributions).map(([key, dist]) => {
        const iqr = dist.q3 - dist.q1;

        const baseData = {
          x: key === "KBICONSO" ? key : `Score-${key}`,
          y: [
            +((dist.q1 - 1.5 * iqr) * 100).toFixed(0),
            +(dist.q1 * 100).toFixed(1),
            +(dist.median * 100).toFixed(1),
            +(dist.q3 * 100).toFixed(1),
            +((dist.q3 + 1.5 * iqr) * 100).toFixed(0)
          ],
        };

        if (withOutliers) {
          baseData.goals = Array.isArray(dist.outliers)
            ? dist.outliers.map((outlier) => ({
                value: +(outlier * 100).toFixed(1),
                strokeWidth: 0,
                strokeHeight: 10,
                strokeLineCap: 'round',
                strokeColor: '#FEB019',
              }))
            : [];
        }

        return baseData;
      }),
    },

   ...(reportType !== "company" ? [{
      name: 'Individual',
      type : 'scatter',
      data : Object.entries(normalDistributions).map(([key, dist]) => {
  
        return {
          x: key === "KBICONSO" ? key : `Score-${key}`,
          y: (dist.idKpoint.x * 100).toFixed(1),
        };
      }),
      
    }] : [])
  ];
  

  const options = {
    chart: {
      type: 'boxPlot',
      toolbar: { show: false },
      zoom: { enabled: false },
      foreColor: '#656565'
    },
    plotOptions: {
      boxPlot: {
        colors: {
          upper: '#5C4742',
          lower: '#A5978B'
        }
      }
    },
    stroke: {
      show: true,
      colors: ['#656565'],
      width: 2
    },
    yaxis: {
      colors : '#A5978B',
      labels: {
        formatter: (val) => `${val}%`
      },
    },
    tooltip: {
      custom: function({ series, seriesIndex, dataPointIndex, w }) {
        const seriesType = w.config.series[seriesIndex].type;
        const seriesName = w.config.series[seriesIndex].name;
    
        const pointData = w.config.series[seriesIndex].data[dataPointIndex];
    
        if (seriesType === 'boxPlot') {
          const labels = ['Min', 'Q1', 'Median', 'Q3', 'Max'];
          const values = pointData.y;
    
          return `
            <div className="p-8">
              <strong>${pointData.x}</strong><br/>
              ${labels.map((label, i) => `${label}: ${values[i]}%`).join('<br/>')}
            </div>
          `;
        }
    
        if (seriesType === 'scatter' || seriesName === 'outliers') {
          return `
            <div className="p-8">
              <strong>${pointData.x}</strong><br/>
              Outlier: ${pointData.y}%
            </div>
          `;
        }
    
        return null;
      }
    }
  };

  

  return (
    <div>
          <div className="  bg-[#161616] rounded-2xl shadow p-4  ">
                <div className="w-[100%] h-[100%]  flex flex-col justify-start items-center">
                      <ResponsiveContainer width="100%" >
                          <h2 className="text-xl text-[#8f8d9f] font-bold mb-2  text-">{title}</h2>
                          <div className="mt-9">
                              <div id="chart">
                                  <ReactApexChart options={options} series={series} type="boxPlot" height={500} />
                              </div>
                              <Explanation data={normalDistributions} chartType="Box plot" outliers={withOutliers}  lang={language}/>
                          </div>
                      </ResponsiveContainer>
                  </div>
              </div>
    </div>
  );
};

export default BoxPlotComponent;
