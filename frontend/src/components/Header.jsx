import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, User, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function Header() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const userName = localStorage.getItem('userId')?.split('@')[0] || 'Candidate';
  const isLoggedIn = Boolean(localStorage.getItem('userId'));

  return (
    <header className="w-full bg-white/70 dark:bg-[#09090b]/70 border-b border-zinc-200/50 dark:border-zinc-800/50 sticky top-0 z-50 backdrop-blur-md transition-colors duration-300">
      <div className="max-w-7xl mx-auto py-6 px-8 flex flex-wrap justify-between items-center gap-6">
        {/* Left Side: Micro-Status Pill, Pure White Brand Heading, Muted Subtitle */}
        <div className="flex flex-col">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 font-mono mb-2 w-fit">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>System Operational • AWS Connected</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-tight text-zinc-900 dark:text-white transition-colors mt-2">
            Prep Arena
          </h1>
          <p className="text-lg md:text-xl text-zinc-500 dark:text-zinc-400 font-medium tracking-normal leading-relaxed transition-colors mt-4 max-w-3xl">
            Select a timed assessment module or elite modality to benchmark your engineering readiness.
          </p>
        </div>

        {/* Right Side: Action Buttons & Minimal User Profile Badge */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:text-white dark:hover:bg-zinc-900 transition-all cursor-pointer"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 transition-transform hover:rotate-90" />
            ) : (
              <Moon className="w-4 h-4 transition-transform hover:-rotate-90" />
            )}
          </button>
          <button 
            onClick={() => navigate('/auth')} 
            className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:text-white dark:hover:bg-zinc-900 transition-all text-xs font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>{isLoggedIn ? 'Switch User' : 'Sign In'}</span>
          </button>
          <button 
            onClick={() => navigate('/profile')} 
            className="px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 text-xs font-medium flex items-center gap-2 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer"
          >
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <User className="w-3.5 h-3.5 text-zinc-400" />
            <span>{userName}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
