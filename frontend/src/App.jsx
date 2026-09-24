import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import TestEngine from './components/TestEngine';
import Results from './components/Results';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-blue-500/30">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/test/:testId" element={<TestEngine />} />
          <Route path="/results" element={<Results />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
