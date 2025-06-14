import React from 'react';

const ContextDisplay = ({ context }) => {
  return (
    <div className="bg-[#161616] rounded-2xl shadow p-4">
      <h2 className="text-xl text-[#8f8d9f] font-bold mb-2">Company Context</h2>
      <div className="w-full text-neutral-400 flex flex-col justify-start items-center">
        {context.split('\n').map((line, index) => (
          <p key={index} className="text-center">{line}</p>
        ))}
      </div>
    </div>
  );
}

export default ContextDisplay;