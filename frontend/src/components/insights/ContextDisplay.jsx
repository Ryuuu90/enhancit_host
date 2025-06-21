import React, {useEffect, useState} from 'react';
import axios from 'axios';
import {toast} from 'react-toastify';

const URL = process.env.REACT_APP_BACKEND_URL;


const ContextDisplay = ({ context , language ,title}) => {
  const [translation, setTranslation] = useState(context);


  useEffect(() => {
    const fetchExplanation = async () => {
      const prompt = `Translate the following paragraph into French, preserving the original meaning and tone:\n\n${JSON.stringify(context, null, 2)}`;
  
      try {
        const chartType = "notChart";
        const response = await axios.post(`${URL}/api/chart-explanation`, { prompt,  chartType});
        const translatedData = response.data.Explanation;
        setTranslation(translatedData);
      } catch (error) {
        if (error.response?.data?.message) {
          toast.error(error.response.data.message);
          console.error(error.response.data.message);
        } else {
          console.error(error.response || error);
        }
      }
    };
  
    if (language === 'fr') {
      fetchExplanation();
    } else {
      setTranslation(context);
    }
  }, [language]);
  return (
    <div className="bg-[#161616] rounded-2xl shadow p-4">
      <h2 className="text-xl text-[#8f8d9f] font-bold mb-2">{title}</h2>
      <div className="w-full text-neutral-400 flex flex-col justify-start items-center">
        {translation.split('\n').map((line, index) => (
          <p key={index} className="text-center">{line}</p>
        ))}
      </div>
    </div>
  );
}

export default ContextDisplay;