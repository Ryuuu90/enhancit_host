import React from "react";
import Dashboard from "./pages/charts";  // Import the Dashboard component
import { ToastContainer } from 'react-toastify'
import'react-toastify/dist/ReactToastify.css'

function App() {
  return (
    <div className="App">
      
      <ToastContainer/>
      <Dashboard /> 
    </div>
  );
}

export default App;
