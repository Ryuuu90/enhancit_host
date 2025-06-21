import React, { useState, useEffect, memo } from "react";
import ReactMarkdown from 'react-markdown';
import useDeepCompareEffect from 'use-deep-compare-effect';
import axios from 'axios';
import {toast} from 'react-toastify';
const URL = process.env.REACT_APP_BACKEND_URL;

const Explanation = (data)=>{
  const [explanation, setExplanation] = useState([null]);
  

  const [language, setLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('preferredLanguage');
    return savedLanguage === 'en' ? 'english' : 'french';
  });

  let prompt;


  useEffect(() => {
    const handleStorageChange = () => {
      const savedLanguage = localStorage.getItem('preferredLanguage');
      const newLanguage = savedLanguage === 'en' ? 'english' : 'french';
      setLanguage(newLanguage);
    };

    window.addEventListener('storage', handleStorageChange);

    window.addEventListener('languageChanged', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('languageChanged', handleStorageChange);
    };
  }, []);


  function restructureByCluster(data) {
    const result = {};
  
    for (const demoGroup in data) {
      const clusters = data[demoGroup]; 
  
      for (const clusterKey in clusters) {
        if (!result[`cluster ${clusterKey}`]) {
          result[`cluster ${clusterKey}`] = {};
        }
  
        result[`cluster ${clusterKey}`][demoGroup] = clusters[clusterKey];
      }
    }
  
    return result;
  }

  function restructureByAverage(data) {
    const result ={};

    data.forEach(item => {
      const key = item.category;
      result[key] = {
        company_av: item.Company_Av,
        sector_av: item.Sector_Av,
        all_av: item.All_Av
      };
    });
    return result;
  }

  useDeepCompareEffect(() => {
    let newData;
    let newData2;
    if(data)
    {
      if(data.chartType === 'Box plot')
      {
        if(data.outliers === false)
          newData = Object.entries(data.data).map(item => {
              const category = item[0];
              const { mean, stdDev, variance,points, kpoints, idKpoint, Qoutliers, outliers, ...rest } = item[1];
              return {
              category,
              ...rest
              };
          });
        else
            newData = Object.entries(data.data).map(item => {
                const category = item[0];
                const { mean, stdDev, variance,points, kpoints, idKpoint, Qoutliers, ...rest } = item[1];
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
      else if (data.chartType === 'radar chart')
      {
        newData = restructureByAverage(data.data)
      }
      else if(data.chartType === 'bubble chart')
      {
        const traitMap = {
          "Av-PR": "PR",
          "Av-CO": "CO",
          "Av-OP": "OP",
          "Av-AD": "AD",
          "Av-CI": "CI",
        };
        
        const groupDataMap = {}; 
        const rawData = data.data.map((row) =>( {...row,  groups : data.groups}));
        rawData.forEach(item => {
          const trait = traitMap[item.category];
          if (!trait) return;
        
          item.groups.forEach(elem => {
            let key = elem
            if(elem === 'Yes')
            {
                key = 'Manager';
            }
            else if(elem === 'No')
            {
                key = 'employee';
            }
            if (!groupDataMap[key]) {
              groupDataMap[key] = { };
            }
            groupDataMap[key][trait] = item[elem];
          });
        });
        console.log(groupDataMap);
        newData = groupDataMap;
      }
      else if(data.chartType === 'pca plot')
      {
        newData = restructureByCluster(data.data);
      }
      else
      {
        newData = data.data;
      }

      const fetchExplanation = async () => {
        if(data.chartType === 'radar chart')
        {
          prompt = `**Role:** You are a KPI radar chart analysis assistant.  
              **Strict Instructions:**  
              1. Use ONLY the JSON data provided below – no assumptions, no fabricated numbers  
              2. For each KPI (PR, CO, OP, AD, CI), perform **exact comparison**:  
                - Compare Company_Av vs Sector_Av  
                - Compare Company_Av vs All_Av  
              3. NEVER display numerical values – only descriptive comparisons  
              4. Use fluent and professional ${language}  
              5. Follow the exact output format shown below  
              6. Include a short strategic summary at the end  
              7. Do NOT include an introduction or explain the data
              
              ---
              
              **KPI Definitions:**  
              PR = Proactivity  
              CO = Collaboration  
              OP = Openness  
              AD = Adaptability  
              CI = Continuous Improvement  
              
              ---
              
              **Output Format Example:**  
              Proactivity  
              Strengths: Good proactivity compared to sector average  
              Weakness: Lags behind the all average significantly
              
              Collaboration  
              Strengths: Comparable collaboration with sector average  
              Weakness: Below average compared to the all average
              
              [...continue same pattern for OP, AD, CI...]
              
              Strategic Summary:  
              The company excels in improvement initiatives but can focus on boosting collaboration to align with the all-average performance. Good job in proactivity and adaptability, keep it up!
              
              ---
              
              **JSON Data (use this strictly):**  
              ${JSON.stringify(newData, null, 2)}
              `;
          
        }
        else if(data.chartType === 'bubble chart')
        {
          prompt = `You are a data insights assistant.
                    Your response must be written entirely in ${language}.

                    You will receive JSON-formatted data showing percentage scores for several **${data.groupType}** across five behavioral KPIs:

                    - PR = Proactivity  
                    - CO = Collaboration  
                    - OP = Openness  
                    - AD = Adaptability  
                    - CI = Improvement

                    Your task is to produce a structured, well-written report with the following sections:

                    1. **Analysis of Each Group**:  
                      For each demographic group, write a clear, polished paragraph (1 sentence) that:  
                      - Mentions the group's **strongest and weakest KPIs with exact percentages**.  
                      - Explains what these strengths and weaknesses suggest about the group's behavioral tendencies.  
                      - Avoid repeating all KPI scores—focus on key highlights only.

                    2. **Comparative Analysis**:  
                      Write a paragraph comparing all groups, pointing out:  
                      - Key differences and similarities in their KPI strengths and weaknesses.  
                      - Possible reasons for these differences, and explain them considering life stage, experience, or other relevant factors.  
                      - How these behavioral patterns reflect group priorities or strengths.

                    3. **Final Insights**:  
                      Provide a thoughtful summary that:  
                      - Explains the broader implications of the behavioral differences.  
                      - Suggests how these insights could be used (e.g., for team building, training, or management strategies).  
                      - Emphasizes the value of understanding and leveraging diverse behaviors across groups.

                    Use a friendly understandable tone with clear, accessible language. Keep formatting simple and consistent without markdown styling changes (just plain text paragraphs and section headings).
                    (i want every "**" to be part of the style)
                    -Use simple, fluent, and professional ${language} in the output.

                    ---

                    Here is the data:  
                    ${JSON.stringify(newData, null, 2)}

`
        }
        else if (data.chartType === 'pca plot') 
        {
                prompt = `
                          fisrt delete all ur caches
                          You are a senior data analyst and organizational consultant.
                          Your response must be written entirely in ${language}.

                          Based on the structured cluster data provided below, generate a **complete persona-style profile** for each cluster. The number of clusters may vary, so ensure you generate **one profile for every cluster**, skipping any labeled "Outlier".

                          For each valid cluster:

                          Cluster [#]. **[Bold Persona Title]** (One-line summary)

                          **KPI Profile:**

                          Describe each KPI using the exact format below, combining performance percentage and quartiles placement:
                          - **Proactivity (Score-Pr)**: 45.9% (in quartiles 1)
                          - **Collaboration (Score-Co)**: 92.67% (in quartiles 10)
                          - **Openness (Score-Op)**: ...
                          - **Adaptability (Score-Ad)**: ...
                          - **Continuous Improvement (Score-Ci)**: ...
                          - **Knowledge-Based Integration (KBICONSO)**: ...

                          **Demographics:**

                          Include percentage-based descriptions of the dominant groups:
                          - Age ranges (e.g., 20-25: 33.3%)
                          - Gender (e.g., Female: 60%)
                          - Management status (e.g., Yes: 70%)

                          **Insight:**

                          In details and natural, consulting-style English:
                          - Describe who these individuals are.
                          - Summarize their key strengths and development areas.
                          - Mention their strategic value and influence within the organization.

                          **Important Style Rules:**
                          - **Do not** include or mention clusters labeled as "Outlier".
                          - Use **bold** for cluster titles and all section headings.
                          - Format trait names in bold followed by their full KPI name in parentheses.
                          - Write for an executive audience — use clear, strategic language.
                          - Use simple, fluent, and professional ${language} in the output.


                          Use the following JSON data, use will find  the cluster like (cluster X):
                          ${JSON.stringify(newData, null, 2)}`;
        }
        else if(data.chartType === "distribution comparison")
        {
              prompt = `As a data analyst and statistics expert, compare and analyze the ${data.chartType} using the key values from ${JSON.stringify(newData)} that named ${data.name1} and ${JSON.stringify(newData2)} that named ${data.name2}.
              Write a short bullet list where:
              Your response must be written entirely in ${language}.
              No introduction. Go straight to the insights.
              Each category (like OP, CO, PR, etc.) has only one main takeaway.
              KPI definitions:
              - PR = Proactivity  
              - CO = Collaboration  
              - OP = Openness  
              - AD = Adaptability  
              - CI = Improvement

              Focus only on the strongest insight for each category (best, worst, stable, unstable, etc.).
              Use simple, fluent, and professional ${language} in the output.
              Do not split one category into multiple points.

              Keep bullets very simple, casual, and easy to understand without technical jargon.`
        }
        else if (data.chartType === "weakness interpretation")
        {
          prompt = ` Prompt Template:
                        You are a behavioral insights assistant.
                        Your response must be written entirely in ${language}.
                        I will provide you with a list of questions with high percentages of low scores from a company's behavioral assessment.
                        Each question has:

                        A code (e.g., OP02)

                        A full question text

                        A low score percentage

                        Your task is to generate a clear, structured insight for each weak question in the following format:

                        For each input object:

                        Use the following format:

                        markdown
                        Copy
                        Edit

                        **Question [CODE]**: [Full question text]  
                        **Low Score Rate**: [X]%

                        **Interpretations**:

                        -Write the Interpretations as natural language paragraph.

                        Ensure flow by connecting the three insights/recommendations logically.

                        Maintain a professional, supportive tone (avoid blame).

                        Do not copy-paste the input text; paraphrase and blend ideas naturally.

                        Do not use bullet points. Paragraphs only.


                        **Recommendations**:
                        -Write the Recommendations as natural language paragraphs.

                        Ensure flow by connecting the three insights/recommendations logically.

                        Maintain a professional, supportive tone (avoid blame).
                        
                        Do not copy-paste the input text; paraphrase and blend ideas naturally.

                        Do not use bullet points. Paragraphs only.



                        Guidelines:

                        Use short, precise interpretations that explain why a low score is a concern.

                        Use simple, fluent, and professional ${language} in the output.

                        without any text font
                        Use actionable recommendations that help the company address the behavioral weakness.

                        Avoid repeating exact phrases. Each insight should be contextually relevant to the question.

                        Here is the data you must use (format: JSON array): ${JSON.stringify(newData, null, 2)}`
        }
        else 
        {
          if (data.outliers === true) 
          {
            prompt = `Your response must be written entirely in ${language}.

                      Analyze the ${data.chartType} using the key values from the following dataset:
                      ${JSON.stringify(newData)}

                      Write a short, bullet-point summary focusing on **outliers and extremes** only.

                      Instructions:
                      - One clear insight per category (e.g., OP, CO, PR, etc.)
                      - Use simple, fluent, and professional ${language} in the output.
                      - KPI definitions:
                        - PR = Proactivity  
                        - CO = Collaboration  
                        - OP = Openness  
                        - AD = Adaptability  
                        - CI = Improvement
                      - Focus on the **strongest trend or outlier** for each category (best, worst, most stable, most volatile)
                      - There is an element in the data set you will find called \`outliers\` — use it for insights and Use percentage format (e.g., 94%) for any numeric values — especially outliers.
                      - Do **not** split one category into multiple points
                      - Keep bullets casual and easy to understand — avoid technical or statistical jargon
                      - No introductions. Go straight to the insights.`;
            }
            else 
            {
              
              prompt = `As a data analyst and statistics expert, analyze the ${data.chartType} using the key values from ${JSON.stringify(newData)}.
              Your response must be written entirely in ${language}.
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
              -insight language is ${language}.
              Do not split one category into multiple points.

              Keep bullets very simple, casual, and easy to understand without technical jargon.`
                
          }
        }
          try 
          {
              let chartType = data.chartType ;
              const response = await axios.post(`${URL}/api/chart-explanation`, { prompt, chartType });
              const bullets = response.data.Explanation.split("- ").filter(item => item.trim() !== "");
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
      }}, [data, language]); 

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