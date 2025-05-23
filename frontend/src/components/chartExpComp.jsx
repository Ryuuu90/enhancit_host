
import React, { useState, useEffect, memo } from "react";
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import {toast} from 'react-toastify';
const URL = process.env.REACT_APP_BACKEND_URL;


const Explanation = (data)=>{
  const [explanation, setExplanation] = useState([]);
  useEffect(() => {
    let newData;
    console.log(data.chartType)
    if(data.chartType === 'Box plot')
    {
        newData = Object.entries(data.data).map(item => {
            const category = item[0];
            const { mean, stdDev, variance,points, ...rest } = item[1];
            return {
            category,
            ...rest
            };
        });
    }
    else if(data.chartType === 'kde plot')
    {
        newData = Object.entries(data.data).map(item => {
            const category = item[0];
            const { q1, q3, min, max,kpoints, ...rest } = item[1];
            return {
            category,
            ...rest
            };
        });
    }
    else if(data.chartType === 'normal distribution plot')
    {
      newData = Object.entries(data.data).map(item => {
        const category = item[0];
        const { q1, q3, min, max,points, ...rest } = item[1];
        return {
        category,
        ...rest
        };
    });
    }
    else
    {
      newData = Object.entries(data.data);
      // console.log(newData);
    }
    const fetchExplanation = async () => {
      let prompt;
      if(data.chartType === 'pca plot')
      {
        prompt = `You are a data analyst and organizational strategist.

                  Generate structured, persona-style cluster profiles using the data provided below. Use natural, consulting-style English with an executive tone. Ensure each cluster has a unique and bold title, and follow the format exactly as shown.

                  Cluster [#]. [Bold Persona Title] (One-line summary)
                  KPI Profile:

                  Clearly describe performance trends using actual score percentages and decile placements for each KPI:

                  Score-Pr

                  Score-Co

                  Score-Op

                  Score-Ad

                  Score-Ci

                  KBICONSO

                  Use phrasing like:
                  Score-Co: 92.67% (29.41% in decile 10) (don't mention outliers as clusters or outliers dont mention it at all)

                  Demographics:

                  Highlight dominant segments for:

                  Age ranges (with %),

                  Gender (with %),

                  Management status (with %).

                  Insight:

                  Describe who these individuals are,
                  Summarize their key strengths and development gaps,
                  Mention how they contribute to or influence the organization.

                  Important Style Rules:
                  Do not include outlier clusters.

                  Use strategic and business-oriented language.

                  Every cluster title must be bold.

                  Every section header (KPI Profile, Demographics, Insight) must be bold and followed by a newline.

                  Each KPI line must include the percentage and decile placement in brackets.

                  Write as if it's part of a high-level consulting or transformation report.

                  Data must be passed in with newlines properly preserved.

                  Use the cluster data provided below to generate these profiles.
        
                  ${JSON.stringify(newData, null, 2)}
        `;
      }
      else
      {
        prompt = `As a data analyst and statistics expert, analyze the ${data.chartType} using the key values from ${JSON.stringify(newData)}.
                          Write a short bullet list where:

                          Each category (like OP, CO, PR, etc.) has only one main takeaway.

                          Focus only on the strongest insight for each category (best, worst, stable, unstable, etc.).

                          Do not split one category into multiple points.

                          Keep bullets very simple, casual, and easy to understand without technical jargon.`;
      }
        try {
            const response = await axios.post(`${URL}/api/chart-explanation`, { prompt });
            const bullets = response.data.Explanation.split("- ").filter(item => item.trim() !== ""); // split by " - "
            setExplanation(bullets);
          } catch (error) {
            if (error.response?.data?.message) {
              toast.error(error.response.data.message);
              console.error(error.response.data.message);
            } else {
              console.error(error.response || error);
            }
          }
        };
          fetchExplanation();
      }, [data.data]);
    return(
        <div className="rounded-2xl p-2 text-neutral-400 bg-[#3f3f3f]">
             <ul>
                {explanation.map((bullet, index) => (
                  // console.log(bullet)
                  <ReactMarkdown key={index}>{bullet}</ReactMarkdown>
                ))}
              </ul>
        </div>
    )
}

export default memo(Explanation);