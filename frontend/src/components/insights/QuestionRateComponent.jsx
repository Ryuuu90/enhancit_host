import React from 'react';
import ReactMarkdown from 'react-markdown';

import Explanation from "../insights/chartExpComp"

const QuestionRateComponent = ({ Questions, title, language }) => {
  return (
    <div className="bg-[#161616] rounded-2xl shadow p-4">
      <h2 className="text-xl text-[#8f8d9f] font-bold mb-2 text-center">{title}</h2>
      <div className="space-y-4">
            <Explanation data={Questions} chartType="weakness interpretation"/>
      </div>
    </div>
  );
}

export default QuestionRateComponent;