
import React, { useState, useEffect, memo } from "react";
import ReactMarkdown from 'react-markdown';
import useDeepCompareEffect from 'use-deep-compare-effect';
import axios from 'axios';
import {toast} from 'react-toastify';
const URL = process.env.REACT_APP_BACKEND_URL;


const Explanation = (data)=>{
  const [explanation, setExplanation] = useState([null]);
  let prompt;
  
  useDeepCompareEffect(() => {
    let newData;
    let newData2;
    if(data)
    {
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
      else if(data.chartType === 'distribution comparison')
        {
            newData = Object.entries(data.data).map(item => {
                const category = item[0];
                const { q1, q3, min, max,points, ...rest } = item[1];
                return {
                category,
                ...rest
                };
            });
            if(data.name === "Normal Distribution")
            {
              newData2 = Object.entries(data.data2).map(item => {
                  const category = item[0];
                  const { q1, q3, min, max,kpoints, ...rest } = item[1];
                  return {
                  category,
                  ...rest
                  };
              });
            }
            else
            {
              newData2 = Object.entries(data.data2).map(item => {
                  const category = item[0];
                  const { q1, q3, min, max,points, ...rest } = item[1];
                  return {
                  category,
                  ...rest
                  };
              });
            }
            
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
      }
      const fetchExplanation = async () => {
        if(data.chartType === 'radar chart')
        {
          prompt = `Generate concise and friendly user insights from this radar chart data comparing Company_Av, All_Av, and Sector_Av across five categories: 

                    KPI definitions:
                    - PR = Proactivity  
                    - CO = Collaboration  
                    - OP = Openness  
                    - AD = Adaptability  
                    - CI = Improvement

                    Highlight strengths, weaknesses, and notable differences in plain language. Use markdown-style headings (** Trait Name) with the full trait name, and include short bullet points or sentences explaining the comparison between the three values. Add a friendly summary at the end highlighting key strengths and improvement areas. i want the values to be in %
                    here's the data:
                    ${JSON.stringify(newData, null, 2)}
                  
                    `
        }
        else if(data.chartType === 'bubble chart')
        {
          prompt = `You are a helpful data assistant.

                    Given a list of demographic groups and their average scores on 5 KPIs:
                    - For each group, explain if their scores are high, low, or average.
                    - Mention their strongest and weakest KPIs.
                    - Use simple, friendly language — anyone should understand.
                    - Keep each insight short (2-3 lines).
                    - Highlight interesting or surprising patterns if any.
                    - If multiple groups have similar trends, group them.
                    - i want the values to be in %
                    -Use markdown-style headings (** Trait Name) with the full trait name

                    KPI definitions:
                    - PR = Proactivity  
                    - CO = Collaboration  
                    - OP = Openness  
                    - AD = Adaptability  
                    - CI = Improvement
                    Here is the data:
                     ${JSON.stringify(newData, null, 2)}`
        }
        else if (data.chartType === 'pca plot') 
        {
                console.log(newData);
                prompt = `You are a data analyst and organizational strategist.

                    Generate structured, persona-style all cluster profiles using the data provided below. Use natural, consulting-style English with an executive tone. Ensure each cluster has a unique and bold title, and follow the format exactly as shown.

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
                    Do not include outlier cluster.
                    Use markdown-style headings (** Trait Name) with the full trait name

                    Use strategic and business-oriented language.
              
                    Every cluster title must be bold.

                    Every section header (KPI Profile, Demographics, Insight) must be bold and followed by a newline.

                    Each KPI line must include the percentage and decile placement in brackets.

                    Write as if it's part of a high-level consulting or transformation report.

                    Data must be passed in with newlines properly preserved.

                    Use the clusters data provided below to generate these profiles.

                    ${JSON.stringify(newData, null, 2)}`;
        }
        else if(data.chartType === "distribution comparison")
        {
              prompt = `As a data analyst and statistics expert, compare and analyze the ${data.chartType} using the key values from ${JSON.stringify(newData)} that named ${data.name1} and ${JSON.stringify(newData2)} that named ${data.name2}.
              Write a short bullet list where:
              No introduction. Go straight to the insights.
              Each category (like OP, CO, PR, etc.) has only one main takeaway.
              KPI definitions:
              - PR = Proactivity  
              - CO = Collaboration  
              - OP = Openness  
              - AD = Adaptability  
              - CI = Improvement

              Focus only on the strongest insight for each category (best, worst, stable, unstable, etc.).

              Do not split one category into multiple points.

              Keep bullets very simple, casual, and easy to understand without technical jargon.`
        }
        else 
        {
          if (data.outliers === true) 
          {
            prompt = `You are a data analyst and statistics expert.

                Analyze the ${data.chartType} using the key values from the following dataset:
                ${JSON.stringify(newData)}

                Write a short, bullet-point summary focusing on **outliers and extremes** only.

                Instructions:
                - One clear insight per category (e.g., OP, CO, PR, etc.)
                KPI definitions:
                - PR = Proactivity  
                - CO = Collaboration  
                - OP = Openness  
                - AD = Adaptability  
                - CI = Improvement
                - Focus on the **strongest trend or outlier** for each category (best, worst, most stable, most volatile)
                - Do **not** split one category into multiple points
                - Keep bullets simple, casual, and easy to understand — avoid technical or statistical jargon
                -No introduction. Go straight to the insights.
                .`;
            }
            else 
            {
              
              prompt = `As a data analyst and statistics expert, analyze the ${data.chartType} using the key values from ${JSON.stringify(newData)}.
              Write a short bullet list where:
              No introduction. Go straight to the insights.
              Each category (like OP, CO, PR, etc.) has only one main takeaway.
              KPI definitions:
              - PR = Proactivity  
              - CO = Collaboration  
              - OP = Openness  
              - AD = Adaptability  
              - CI = Improvement

              Focus only on the strongest insight for each category (best, worst, stable, unstable, etc.).

              Do not split one category into multiple points.

              Keep bullets very simple, casual, and easy to understand without technical jargon.`
                
          }
        }
          try 
          {
              const response = await axios.post(`${URL}/api/chart-explanation`, { prompt });
              const bullets = response.data.Explanation.split("- ").filter(item => item.trim() !== ""); // split by " - "
              setExplanation(bullets);
            } 
            catch (error) 
            {
              if (error.response?.data?.message) {
                toast.error(error.response.data.message);
                console.error(error.response.data.message);
              }
              else
              {
                console.error(error.response || error);
              }
            }
          };
          if(data)
            fetchExplanation();
      }}, [data]);
    return(
        <div className="rounded-2xl p-2  text-neutral-400 bg-[#3f3f3f]">
             <ul>
                {explanation.map((bullet, index) => (
                  <ReactMarkdown  key={index}>{bullet}</ReactMarkdown>
                ))}
              </ul>
        </div>
    )
}

export default memo(Explanation)