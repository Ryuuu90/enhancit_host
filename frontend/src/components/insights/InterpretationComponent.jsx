import React, {useEffect, useState} from 'react';
import axios from 'axios';
import {toast} from 'react-toastify';


const URL = process.env.REACT_APP_BACKEND_URL;

const InterpretationComponent = ({interCompany, title, language }) => {
  const [translation, setTranslation] = useState(interCompany);


  useEffect(() => {
    const fetchExplanation = async () => {
      const prompt = `Translate the following structured object into French, preserving the format and keys. Only translate the "exp" and "res" values, and keep the object structure as-is:\n\n${JSON.stringify(interCompany, null, 2)}`;
  
      try {
        const chartType = "notChart";
        const response = await axios.post(`${URL}/api/chart-explanation`, { prompt , chartType});
        const translatedData = JSON.parse(response.data.Explanation);
        if (typeof translatedData === 'object' && translatedData !== null) {
          setTranslation(translatedData);
        } else {
          toast.error("Unexpected translation format received.");
          console.error("Expected object, got:", translatedData);
        }
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
      setTranslation(interCompany);
    }
  }, [language]);
  
  return (
    <div className=" bg-[#161616] rounded-2xl shadow p-4">
        <div className="w-[100%] h-[100%]   flex flex-col justify-start items-center">
            <h2 className="text-xl text-[#8f8d9f] font-bold  text-">{title}</h2>
            <div className="w-full h-[90%]">
            {Object.entries(translation).map(([category, values]) => (
                <div key={category} className="mb-6 p-4 bg-[#3f3f3f] rounded-md ">
                    <h2 className="text-xl text-neutral-400 font-bold mb-2">{category} : {values.exp}</h2>
                    <p className="text-neutral-400">{values.res}</p>
                </div>
                ))}
                
            </div>
        </div>
    </div>
  );
}

export default InterpretationComponent;