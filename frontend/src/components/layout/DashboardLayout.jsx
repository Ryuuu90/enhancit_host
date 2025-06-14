import React from 'react';
import { motion, AnimatePresence } from "framer-motion";

const DashboardLayou = ({ children, dataLoaded }) => {
  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-5xl mx-auto text-center">
        <p className="text-5xl text-[#f9f9f9] font-bold text-shadow pt-8">Data Analysis</p>
        <p className="text-7xl mt-2 font-bold text-gray-600 pb-8">
          <span className="bg-gradient-to-r from-red-500 to-yellow-500 bg-clip-text text-transparent">Charts</span>
        </p>
        
        <AnimatePresence mode="wait">
          <motion.div 
            key={dataLoaded ? "charts" : "upload"} 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }} 
            transition={{ duration: 0.4 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
export default DashboardLayou;