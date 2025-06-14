import React from 'react';
import ReactMarkdown from 'react-markdown';

const QuestionRateComponent = ({ Questions, type }) => {
  return (
    <div className="bg-[#161616] rounded-2xl shadow p-4">
      <h2 className="text-xl text-[#8f8d9f] font-bold mb-2 text-center">Company {type}</h2>
      <div className="space-y-4">
        {Questions.map((val, index) => (
          <div key={index} className="p-4 bg-[#3f3f3f] text-neutral-400 rounded-md">
            {val.split('\n').map((line, i) => (
              <ReactMarkdown key={i}>
                {line}
              </ReactMarkdown>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default QuestionRateComponent;