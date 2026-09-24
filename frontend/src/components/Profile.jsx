import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Flame, Trophy, Target, Loader2 } from 'lucide-react';
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
        const userId = localStorage.getItem('userId') || 'guest';
        // Replace API_URL with the real API Gateway Endpoint from SAM
        const API_URL = import.meta.env.VITE_API_URL || 'https://mock.execute-api.us-east-1.amazonaws.com';
        const res = await fetch(`${API_URL}/profile/${userId}`);
        const data = await res.json();
        setProfileData(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-cyan-400" /></div>;
  }

  // Radar Data Mapping
  const rawCats = profileData?.categories || { 'DSA': 50, 'Logical': 50, 'DBMS': 50 };
  const radarData = Object.keys(rawCats).map(key => ({
    subject: key, A: rawCats[key], fullMark: 100
  }));

  // 365 day heatmap mapping
  const today = new Date();
  const heatmapData = Array.from({ length: 364 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (363 - i));
    const dateStr = d.toISOString().split('T')[0];
    const count = profileData?.history?.[dateStr] || 0;
    return count > 4 ? 4 : count;
  });

  const getColor = (level) => {
    if (level === 0) return 'bg-gray-800/50';
    if (level === 1) return 'bg-cyan-900';
    if (level === 2) return 'bg-cyan-700';
    if (level === 3) return 'bg-cyan-500';
    return 'bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.8)]';
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 md:p-12 relative overflow-y-auto font-sans">
      <div className="max-w-6xl mx-auto z-10 relative">
        <button onClick={() => navigate('/')} className="flex items-center space-x-2 text-gray-400 hover:text-white mb-8 transition">
          <ChevronLeft className="w-5 h-5" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-end justify-between mb-12 border-b border-gray-800 pb-8">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-600 flex items-center justify-center text-4xl font-black shadow-[0_0_30px_rgba(34,211,238,0.3)]">
              GS
            </div>
            <div>
              <h1 className="text-4xl font-extrabold text-white mb-1">GJ Sathwik</h1>
              <p className="text-gray-400 font-mono">Principal Candidate Rank</p>
            </div>
          </div>
          
          <div className="flex space-x-4">
            <div className="bg-gray-900/80 p-4 rounded-2xl border border-gray-800 flex items-center space-x-3">
              <Flame className="w-6 h-6 text-rose-500" />
              <div>
                <div className="text-xs text-gray-500 uppercase font-bold">Streak</div>
                <div className="text-xl font-bold text-white">14 Days</div>
              </div>
            </div>
            <div className="bg-gray-900/80 p-4 rounded-2xl border border-gray-800 flex items-center space-x-3">
              <Trophy className="w-6 h-6 text-amber-400" />
              <div>
                <div className="text-xs text-gray-500 uppercase font-bold">Global Rank</div>
                <div className="text-xl font-bold text-white">#402</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Heatmap Section */}
          <div className="lg:col-span-2 bg-gray-900/60 backdrop-blur-xl p-8 rounded-3xl border border-gray-800">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
              <Target className="w-5 h-5 text-cyan-400" />
              <span>Assessment Consistency</span>
            </h2>
            <div className="flex flex-col">
              <div className="flex gap-1 mb-2">
                {/* 52 columns, 7 rows layout */}
                {Array.from({ length: 52 }).map((_, colIndex) => (
                  <div key={colIndex} className="flex flex-col gap-1">
                    {Array.from({ length: 7 }).map((_, rowIndex) => {
                      const idx = colIndex * 7 + rowIndex;
                      const level = heatmapData[idx] || 0;
                      return (
                        <div 
                          key={idx} 
                          className={cn("w-3.5 h-3.5 rounded-sm transition-colors", getColor(level))} 
                          title={`Day ${idx + 1}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
              <div className="flex justify-end items-center space-x-2 text-xs text-gray-500 mt-2 font-mono">
                <span>Less</span>
                <div className="flex gap-1">
                  <div className={cn("w-3.5 h-3.5 rounded-sm", getColor(0))} />
                  <div className={cn("w-3.5 h-3.5 rounded-sm", getColor(1))} />
                  <div className={cn("w-3.5 h-3.5 rounded-sm", getColor(2))} />
                  <div className={cn("w-3.5 h-3.5 rounded-sm", getColor(3))} />
                  <div className={cn("w-3.5 h-3.5 rounded-sm", getColor(4))} />
                </div>
                <span>More</span>
              </div>
            </div>
          </div>

          {/* Radar Chart */}
          <div className="bg-gray-900/60 backdrop-blur-xl p-8 rounded-3xl border border-gray-800 flex flex-col items-center">
            <h2 className="text-xl font-bold text-white mb-2 self-start">Skill Radar</h2>
            <div className="w-full h-64 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Skills" dataKey="A" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
