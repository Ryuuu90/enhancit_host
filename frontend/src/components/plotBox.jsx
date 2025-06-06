import ReactApexChart from "react-apexcharts";
import React from "react";
const ApexChart = ({ normalDistributions, reportType, withOutliers }) => {

  const series = [
    {
      name: 'box',
      type: 'boxPlot',
      data: Object.entries(normalDistributions).map(([key, dist]) => {
        const iqr = dist.q3 - dist.q1;

        const baseData = {
          x: key === "KBICONSO" ? key : `Score-${key}`,
          y: [
            +((dist.q1 - 1.5 * iqr) * 100).toFixed(1),
            +(dist.q1 * 100).toFixed(1),
            +(dist.median * 100).toFixed(1),
            +(dist.q3 * 100).toFixed(1),
            +(dist.max * 100).toFixed(1)
          ],
        };

        // Conditionally add 'goals' only if withOutliers is true
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
      // height: 500,
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
      <div id="chart">
          <ReactApexChart options={options} series={series} type="boxPlot" height={500} />
        </div>
      <div id="html-dist"></div>
    </div>
  );
};

export default ApexChart;
