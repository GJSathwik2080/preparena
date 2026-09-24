import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Clock, Brain, Code, Network, Mic, Terminal, Swords, Flame, UserCircle, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const TEST_CATEGORIES = [
  {
    title: "Cognitive Ability",
    icon: Brain,
    color: "from-fuchsia-500 to-pink-600",
    glow: "shadow-[0_0_20px_rgba(217,70,239,0.5)]",
    tests: [
      { id: "cognitive-mock-1", title: "Cognitive Assessment - Alpha", time: "50 min", questions: 30 },
      { id: "cognitive-mock-2", title: "Cognitive Assessment - Beta", time: "50 min", questions: 30 },
    ]
  },
  {
    title: "Technical Ability",
    icon: Network,
    color: "from-cyan-400 to-blue-600",
    glow: "shadow-[0_0_20px_rgba(34,211,238,0.5)]",
    tests: [
      { id: "technical-mock-1", title: "Technical Fundamentals - I", time: "50 min", questions: 30 },
      { id: "technical-mock-2", title: "Technical Fundamentals - II", time: "50 min", questions: 30 },
    ]
  },
  {
    title: "Coding Ability",
    icon: Code,
    color: "from-violet-500 to-purple-700",
    glow: "shadow-[0_0_20px_rgba(139,92,246,0.5)]",
    tests: [
      { id: "coding-mock-1", title: "Data Structures & Algos - I", time: "45 min", questions: 20 },
      { id: "coding-mock-2", title: "Data Structures & Algos - II", time: "45 min", questions: 20 },
    ]
  }
];

const ADVANCED_MODES = [
  { id: 'coding', title: 'Coding Arena', icon: Terminal, color: 'from-emerald-400 to-teal-600', glow: 'shadow-[0_0_20px_rgba(52,211,153,0.5)]', desc: 'Real-time multi-language sandbox' },
  { id: 'speech', title: 'Communication Engine', icon: Mic, color: 'from-blue-400 to-indigo-600', glow: 'shadow-[0_0_20px_rgba(96,165,250,0.5)]', desc: 'AI-evaluated pronunciation tests' },
  { id: 'survival', title: 'Survival Engine', icon: Flame, color: 'from-orange-400 to-red-600', glow: 'shadow-[0_0_20px_rgba(251,146,60,0.5)]', desc: '60s rapid-fire deathmatch' },
  { id: 'battle', title: 'Battle Arena 1v1', icon: Swords, color: 'from-rose-400 to-pink-600', glow: 'shadow-[0_0_20px_rgba(251,113,133,0.5)]', desc: 'Real-time PvP coding races' }
];

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-950 p-8 flex flex-col relative overflow-y-auto overflow-x-hidden">
      <div className="absolute top-0 left-[-10%] w-[50%] h-[40%] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-[-10%] w-[50%] h-[40%] bg-cyan-600/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        className="max-w-6xl w-full mx-auto z-10 py-12"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.header variants={itemVariants} className="mb-16 flex justify-between items-start">
          <div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight text-white mb-4">
              Prep <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-500">Arena</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl">Select a bounty to begin your elite technical trial.</p>
          </div>
          <div className="flex space-x-4">
            <button onClick={() => navigate('/auth')} className="flex items-center space-x-2 text-gray-400 hover:text-white bg-gray-900/50 px-4 py-2 rounded-xl border border-gray-800 transition shadow-lg">
              <LogIn className="w-5 h-5" />
              <span className="hidden md:inline font-bold">Authenticate</span>
            </button>
            <button onClick={() => navigate('/profile')} className="flex items-center space-x-2 text-gray-400 hover:text-white bg-gray-900/50 px-4 py-2 rounded-xl border border-gray-800 transition shadow-lg">
              <UserCircle className="w-5 h-5" />
              <span className="hidden md:inline font-bold">Profile</span>
            </button>
          </div>
        </motion.header>

        <div className="space-y-16">
          {TEST_CATEGORIES.map((category, idx) => (
            <motion.div key={idx} variants={itemVariants} className="space-y-6">
              <div className="flex items-center space-x-3">
                <category.icon className={cn("w-8 h-8 text-transparent bg-clip-text bg-gradient-to-br", category.color)} />
                <h2 className="text-3xl font-bold text-white tracking-wide">{category.title}</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {category.tests.map(test => (
                  <motion.div 
                    key={test.id}
                    whileHover={{ y: -5 }}
                    className="group relative bg-gray-900/60 backdrop-blur-xl p-8 rounded-3xl border border-gray-800 hover:border-gray-600 transition-all duration-300 flex flex-col shadow-xl overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="relative z-10 flex flex-col h-full">
                      <div className="flex items-start justify-between mb-6">
                        <div className="bg-gray-800/80 px-4 py-2 rounded-full border border-gray-700">
                          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{test.id}</span>
                        </div>
                        <div className="flex space-x-2">
                          <div className="flex items-center space-x-1 text-gray-400 bg-gray-800/80 px-3 py-1 rounded-full text-sm font-medium">
                            <Clock className="w-4 h-4" /><span>{test.time}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-gray-400 bg-gray-800/80 px-3 py-1 rounded-full text-sm font-medium">
                            <Zap className="w-4 h-4" /><span>{test.questions} Q</span>
                          </div>
                        </div>
                      </div>
                      
                      <h3 className="text-2xl font-bold text-white mb-8">{test.title}</h3>
                      
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate(`/test/${test.id}`)}
                        className={cn(
                          "w-full text-white font-bold py-4 px-6 rounded-2xl transition-all relative overflow-hidden bg-gradient-to-r hover:opacity-90",
                          category.color,
                          category.glow
                        )}
                      >
                        Start Assessment
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}

          {/* ADVANCED MODES */}
          <motion.div variants={itemVariants} className="space-y-6 pt-8 border-t border-gray-800">
            <div className="flex items-center space-x-3 mb-8">
              <Flame className="w-8 h-8 text-rose-500 drop-shadow-[0_0_10px_rgba(225,29,72,0.8)]" />
              <h2 className="text-3xl font-bold text-white tracking-wide">Elite Modalities</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {ADVANCED_MODES.map((mode) => (
                <motion.div 
                  key={mode.id}
                  whileHover={{ y: -5 }}
                  onClick={() => navigate(`/${mode.id}`)}
                  className="cursor-pointer group relative bg-gray-900/60 backdrop-blur-xl p-6 rounded-3xl border border-gray-800 hover:border-gray-600 transition-all duration-300 flex flex-col shadow-xl overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br shadow-lg", mode.color, mode.glow)}>
                    <mode.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{mode.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{mode.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
