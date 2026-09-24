import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import TestEngine from './components/TestEngine';
import Results from './components/Results';
import Auth from './components/Auth';
import Profile from './components/Profile';
import CodingArena from './components/CodingArena';
import SpeechTest from './components/SpeechTest';
import SurvivalEngine from './components/SurvivalEngine';
import BattleArena from './components/BattleArena';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-blue-500/30">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/test/:testId" element={<TestEngine />} />
          <Route path="/results" element={<Results />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/coding" element={<CodingArena />} />
          <Route path="/speech" element={<SpeechTest />} />
          <Route path="/survival" element={<SurvivalEngine />} />
          <Route path="/battle" element={<BattleArena />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
