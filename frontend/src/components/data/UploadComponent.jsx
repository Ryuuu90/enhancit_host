import React from 'react';
import { BsCloudUpload } from 'react-icons/bs';
import { motion } from 'framer-motion';
import { toast } from "react-toastify";

const  UploadComponent = ({ onUpload }) => {
  const handleUpload = () => {
    try {
      onUpload(2);
    } catch (error) {
      toast.error(error.response?.data?.message || "Upload failed");
    }
  };

  return (
    <motion.div 
      key="upload" 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }} 
      transition={{ duration: 0.4 }}
      className="min-h-[calc(100vh-12rem)] p-6 flex items-center justify-center"
    >
      <div 
        onClick={handleUpload}
        className="flex flex-col items-center justify-center w-[calc(100%-20rem)] h-80 p-8 bg-[#161616] rounded-2xl shadow-xl cursor-pointer border border-gray-400 border-dashed hover:bg-[#1c1c1c] hover:border-gray-600"
      >
        <BsCloudUpload className="text-gray-600 mb-8 text-6xl" />
        <p className="text-2xl mb-4 text-gray-600">
          <span className="font-semibold">Click to upload</span> or drag and drop
        </p>
        <p className="text-1xl mb-4 text-gray-400">(XSLS or XLS files)</p>
      </div>
    </motion.div>
  );
}

export default UploadComponent