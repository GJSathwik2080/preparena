import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
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
    <ThemeProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-white text-zinc-900 dark:bg-[#09090b] dark:text-zinc-50 font-sans selection:bg-zinc-800/20 dark:selection:bg-white/20 transition-colors duration-300">
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
    </ThemeProvider>
  );
}

export default App;
