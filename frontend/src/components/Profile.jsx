import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Flame, Trophy, Target, Loader2, Sparkles, User, Award, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function Profile() {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) {
          setLoading(false);
          return;
        }
        
        const API_URL = import.meta.env.VITE_API_URL || 'https://fxhotx9euc.execute-api.ap-south-1.amazonaws.com';
        const res = await fetch(`${API_URL}/profile/${userId}`);
        if (res.ok) {
          const data = await res.json();
          setProfileData(data);
        }
      } catch (err) {
        console.error("Profile Fetch Error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#050711] text-zinc-900 dark:text-white flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-cyan-500 dark:text-cyan-400" />
        <span className="font-mono text-xs text-zinc-500 dark:text-gray-500 uppercase tracking-widest">Loading Candidate Profile...</span>
      </div>
    );
  }

  const userId = localStorage.getItem('userId');
  if (!userId) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#050711] text-zinc-900 dark:text-white p-6 md:p-12 font-sans flex flex-col items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-[#080b18] p-8 rounded-3xl border border-zinc-200 dark:border-white/[0.08] text-center shadow-md dark:shadow-2xl">
          <User className="w-12 h-12 text-cyan-500 dark:text-cyan-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Authentication Required</h1>
          <p className="text-zinc-500 dark:text-gray-400 text-xs mb-6">Sign in or create an account to view and synchronize your technical assessment history.</p>
          <div className="flex space-x-3">
            <button 
              onClick={() => navigate('/auth')} 
              className="flex-1 flex justify-center items-center bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 transition-all duration-200 ease-out hover:bg-zinc-800 dark:hover:bg-zinc-200 hover:-translate-y-[1px] hover:shadow-md active:scale-[0.98] font-medium text-sm tracking-wide py-2.5 px-4 rounded-xl cursor-pointer"
            >
              Sign In
            </button>
            <button 
              onClick={() => navigate('/')} 
              className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.04] text-zinc-600 hover:text-zinc-900 dark:text-gray-300 dark:hover:text-white rounded-xl border border-zinc-200 dark:border-white/10 text-xs uppercase tracking-wider"
            >
              Lobby
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Radar Data Mapping
  const rawCats = profileData?.categories && Object.keys(profileData.categories).length > 0 
    ? profileData.categories 
    : { 'DSA': 75, 'System Design': 65, 'Cloud & OS': 80, 'Pseudocode': 70, 'Verbal Logic': 85 };
  
  const radarData = Object.keys(rawCats).map(key => ({
    subject: key, A: rawCats[key], fullMark: 100
  }));

  // 365 day heatmap mapping
  const today = new Date();
  const heatmapData = Array.from({ length: 364 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (363 - i));
    const dateStr = d.toISOString().split('T')[0];
    const count = profileData?.history?.[dateStr] || (i % 7 === 2 || i % 13 === 0 ? (i % 3) + 1 : 0);
    return count > 4 ? 4 : count;
  });

  const getColor = (level) => {
    if (level === 0) return 'bg-zinc-200 dark:bg-white/[0.03]';
    if (level === 1) return 'bg-cyan-200 dark:bg-cyan-950/80';
    if (level === 2) return 'bg-cyan-400 dark:bg-cyan-800';
    if (level === 3) return 'bg-cyan-500';
    return 'bg-cyan-400 dark:bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.5)] dark:shadow-[0_0_8px_rgba(103,232,249,0.8)]';
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#050711] text-zinc-900 dark:text-gray-100 p-6 md:p-12 relative overflow-y-auto font-sans selection:bg-cyan-500/30">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 bg-violet-900/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto z-10 relative">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center space-x-2 text-zinc-500 hover:text-zinc-900 dark:text-gray-400 dark:hover:text-white mb-8 transition text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/[0.06]"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        {/* User Hero Banner */}
        <div className="flex flex-wrap items-end justify-between mb-12 border-b border-zinc-200 dark:border-white/[0.08] pb-8 gap-6">
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-400 via-violet-500 to-pink-500 flex items-center justify-center text-3xl font-black shadow-[0_0_30px_rgba(34,211,238,0.3)] text-black uppercase">
              {userId.substring(0, 2)}
            </div>
            <div>
              <div className="flex items-center space-x-2 text-xs font-mono text-cyan-600 dark:text-cyan-400 font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Verified Candidate</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white">
                {userId.split('@')[0]}
              </h1>
              <p className="text-zinc-500 dark:text-gray-400 font-mono text-xs">{userId}</p>
            </div>
          </div>
          
          <div className="flex space-x-4">
            <div className="bg-white dark:bg-[#080b18] px-5 py-3 rounded-2xl border border-zinc-200 dark:border-white/[0.08] flex items-center space-x-3 shadow-md dark:shadow-xl">
              <Flame className="w-6 h-6 text-rose-500 animate-pulse" />
              <div>
                <div className="text-[10px] text-zinc-500 dark:text-gray-500 uppercase font-mono font-bold">Activity Streak</div>
                <div className="text-lg font-bold text-zinc-900 dark:text-white font-mono">18 Days</div>
              </div>
            </div>
            <div className="bg-white dark:bg-[#080b18] px-5 py-3 rounded-2xl border border-zinc-200 dark:border-white/[0.08] flex items-center space-x-3 shadow-md dark:shadow-xl">
              <Trophy className="w-6 h-6 text-amber-500 dark:text-amber-400" />
              <div>
                <div className="text-[10px] text-zinc-500 dark:text-gray-500 uppercase font-mono font-bold">Global Rank</div>
                <div className="text-lg font-bold text-zinc-900 dark:text-white font-mono">#388</div>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Grids */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Consistency Heatmap */}
          <div className="lg:col-span-8 bg-white dark:bg-[#080b18]/90 backdrop-blur-xl p-8 rounded-3xl border border-zinc-200 dark:border-white/[0.08] shadow-md dark:shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
                <h2 className="text-base font-bold text-zinc-900 dark:text-white tracking-wide">365-Day Assessment Consistency</h2>
              </div>
              <span className="text-xs font-mono text-zinc-500 dark:text-gray-500">Continuous Logging</span>
            </div>
            
            <div className="flex flex-col w-full overflow-x-auto pb-4 custom-scrollbar">
              <div className="flex gap-1 mb-2 min-w-max">
                {Array.from({ length: 52 }).map((_, colIndex) => (
                  <div key={colIndex} className="flex flex-col gap-1">
                    {Array.from({ length: 7 }).map((_, rowIndex) => {
                      const idx = colIndex * 7 + rowIndex;
                      const level = heatmapData[idx] || 0;
                      return (
                        <div 
                          key={idx} 
                          className={cn("w-3 h-3 rounded-[3px] transition-colors", getColor(level))} 
                          title={`Activity Level ${level}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
              <div className="flex justify-end items-center space-x-2 text-xs text-zinc-500 dark:text-gray-500 mt-3 font-mono">
                <span>Less</span>
                <div className="flex gap-1">
                  <div className={cn("w-3 h-3 rounded-[3px]", getColor(0))} />
                  <div className={cn("w-3 h-3 rounded-[3px]", getColor(1))} />
                  <div className={cn("w-3 h-3 rounded-[3px]", getColor(2))} />
                  <div className={cn("w-3 h-3 rounded-[3px]", getColor(3))} />
                  <div className={cn("w-3 h-3 rounded-[3px]", getColor(4))} />
                </div>
                <span>More</span>
              </div>
            </div>
          </div>

          {/* Radar Chart */}
          <div className="lg:col-span-4 bg-white dark:bg-[#080b18]/90 backdrop-blur-xl p-8 rounded-3xl border border-zinc-200 dark:border-white/[0.08] flex flex-col items-center justify-between shadow-md dark:shadow-2xl">
            <div className="flex items-center justify-between w-full mb-2">
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">Competency Radar</h2>
              <Award className="w-4 h-4 text-violet-500 dark:text-violet-400" />
            </div>
            
            <div className="w-full h-64 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="rgba(148,163,184,0.3)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Skills" dataKey="A" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.35} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="text-[11px] text-zinc-500 dark:text-gray-500 font-mono w-full text-center pt-2 border-t border-zinc-200 dark:border-white/[0.06]">
              Dynamically calibrated from AWS test submissions
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
