import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Clock, Brain, Code, Network, Mic, Terminal, Swords, Flame, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Header from './Header';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1.0] } }
};

const TEST_CATEGORIES = [
  {
    title: "Cognitive Ability",
    categoryKey: "cognitive",
    icon: Brain,
    badgeColor: "bg-zinc-900 text-zinc-300 border-zinc-800",
    tests: [
      { id: "cognitive-mock-1", title: "Cognitive Assessment - Alpha", time: "50 min", questions: 30, desc: "Verbal syntax, sentence structure & critical logic" },
      { id: "cognitive-mock-2", title: "Cognitive Assessment - Beta", time: "50 min", questions: 30, desc: "Statement assumptions, abstract series & syllogisms" },
      { id: "cognitive-mock-3", title: "Cognitive Assessment - Gamma", time: "50 min", questions: 30, desc: "Number puzzles, pattern deduction & analogies" },
      { id: "cognitive-mock-4", title: "Cognitive Assessment - Delta", time: "50 min", questions: 30, desc: "Data sufficiency, direction sense & seating grids" }
    ]
  },
  {
    title: "Technical Ability",
    categoryKey: "technical",
    icon: Network,
    badgeColor: "bg-zinc-900 text-zinc-300 border-zinc-800",
    tests: [
      { id: "technical-mock-1", title: "Technical Fundamentals - I", time: "50 min", questions: 30, desc: "Bitwise execution, nested loops & recursion trees" },
      { id: "technical-mock-2", title: "Technical Fundamentals - II", time: "50 min", questions: 30, desc: "AWS cloud architecture, VPC subnets & TCP/IP" },
      { id: "technical-mock-3", title: "Technical Fundamentals - III", time: "50 min", questions: 30, desc: "OS paging, deadlocks, SQL ACID & mutex locks" },
      { id: "technical-mock-4", title: "Cloud, Security & Architecture", time: "50 min", questions: 30, desc: "Authentication headers, IMDSv2 & security rules" }
    ]
  },
  {
    title: "Coding Ability",
    categoryKey: "coding",
    icon: Code,
    badgeColor: "bg-zinc-900 text-zinc-300 border-zinc-800",
    tests: [
      { id: "coding-mock-1", title: "Data Structures & Algos - I", time: "45 min", questions: 20, desc: "Arrays, hash maps & sliding window optimization" },
      { id: "coding-mock-2", title: "Data Structures & Algos - II", time: "45 min", questions: 20, desc: "Stacks, queues, linked lists & two pointers" },
      { id: "coding-mock-3", title: "Data Structures & Algos - III", time: "45 min", questions: 20, desc: "Binary search trees, heaps & graph BFS/DFS" },
      { id: "coding-mock-4", title: "Advanced Graph & System DSA", time: "45 min", questions: 20, desc: "Dynamic programming memoization & greedy paths" }
    ]
  }
];

const ADVANCED_MODES = [
  { 
    id: 'coding', 
    title: 'Coding Arena', 
    icon: Terminal, 
    desc: 'Real-time multi-language sandbox with strict test validation' 
  },
  { 
    id: 'speech', 
    title: 'Communication Engine', 
    icon: Mic, 
    desc: 'Audio playback & Gemini speech evaluation with transcript' 
  },
  { 
    id: 'survival', 
    title: 'Survival Engine', 
    icon: Flame, 
    desc: '60s rapid-fire sudden death with 1-mistake elimination' 
  },
  { 
    id: 'battle', 
    title: 'Battle Arena 1v1', 
    icon: Swords, 
    desc: 'Real-time PvP racing over AWS WebSocket gateway' 
  }
];

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col w-full">
      
      {/* Refactored Luxury Top Navigation Header */}
      <Header />

      <motion.main 
        className="max-w-7xl w-full mx-auto px-6 py-16 md:py-24 flex-1 flex flex-col"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Section 1: Elite Modalities */}
        <motion.section variants={itemVariants} className="mb-14">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-2">
              <h2 className="text-2xl md:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">Elite Modalities</h2>
            </div>
            <span className="text-sm font-medium text-zinc-500">Interactive environments</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {ADVANCED_MODES.map((mode) => (
              <motion.div 
                key={mode.id}
                whileHover={{ y: -4, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/${mode.id}`)}
                className="cursor-pointer group bg-white dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm hover:shadow-lg dark:shadow-none transition-all duration-300 ease-out flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/50 text-zinc-600 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-white group-hover:border-zinc-300 dark:group-hover:border-zinc-600 transition-colors">
                    <mode.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2 tracking-tight group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors">{mode.title}</h3>
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium leading-relaxed">{mode.desc}</p>
                </div>

                <div className="mt-5 pt-3 border-t border-zinc-200 dark:border-zinc-800/60 flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200 transition-colors">
                  <span>Enter</span>
                  <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Section 2: Assessment Categories (All 12 Tests) */}
        <div className="space-y-16">
          {TEST_CATEGORIES.map((category, idx) => (
            <motion.section key={idx} variants={itemVariants} className="space-y-4">
              
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/60 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 shadow-sm">
                    <category.icon className="w-4 h-4" />
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">{category.title}</h2>
                </div>
                <span className="text-sm font-medium text-zinc-500">4 Modules</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {category.tests.map(test => (
                  <motion.div 
                    key={test.id}
                    whileHover={{ y: -4, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className="group bg-white dark:bg-zinc-900/40 hover:bg-zinc-50 dark:hover:bg-zinc-900/80 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm hover:shadow-lg dark:shadow-none transition-all duration-300 ease-out flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-mono font-medium uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">
                          {test.id}
                        </span>
                        <div className="flex items-center space-x-2 text-xs text-zinc-500 font-mono">
                          <span className="flex items-center space-x-1"><Clock className="w-3 h-3" /><span>{test.time}</span></span>
                          <span>•</span>
                          <span className="flex items-center space-x-1"><Zap className="w-3 h-3" /><span>{test.questions}Q</span></span>
                        </div>
                      </div>
                      
                      <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-2 tracking-tight group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors">{test.title}</h3>
                      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 leading-relaxed mb-6">
                        {test.desc}
                      </p>
                    </div>

                    <button 
                      onClick={() => navigate(`/test/${test.id}`)}
                      className="w-full flex justify-center items-center bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 transition-all duration-200 ease-out hover:bg-zinc-800 dark:hover:bg-zinc-200 hover:-translate-y-[1px] hover:shadow-md active:scale-[0.98] font-medium text-sm tracking-wide py-2.5 px-4 rounded-xl cursor-pointer"
                    >
                      Start Assessment
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          ))}
        </div>

      </motion.main>
    </div>
  );
}
