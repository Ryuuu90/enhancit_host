import React from 'react';

const InterpretationComponent = ({interCompany }) => {
  return (
    <div className=" bg-[#161616] rounded-2xl shadow p-4">
        <div className="w-[100%] h-[100%]   flex flex-col justify-start items-center">
            <h2 className="text-xl text-[#8f8d9f] font-bold  text-">Company Scores Interpretation</h2>
            <div className="w-full h-[90%]">
            {Object.entries(interCompany).map(([category, values]) => (
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