import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, ChevronRight, ChevronLeft, CheckCircle, Send, Flag, List, AlertCircle, Sparkles } from 'lucide-react';
import axios from 'axios';
import { awsmobile } from '../aws-exports';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import MarkdownRenderer from './MarkdownRenderer';
import Chatbot from './Chatbot';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

function getCorrectOption(q) {
  if (q.correctAnswer) return q.correctAnswer;
  if (!q.explanation || !q.options) return q.options?.[0] || '';
  
  const exp = q.explanation.toLowerCase();
  let bestOpt = q.options[0];
  let maxScore = -1;

  q.options.forEach(opt => {
    const words = opt.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length > 3);
    let score = 0;
    words.forEach(w => { 
      if (exp.includes(w)) score++; 
    });
    const normalizedScore = words.length > 0 ? score / words.length : 0;
    if (normalizedScore > maxScore) {
      maxScore = normalizedScore;
      bestOpt = opt;
    }
  });

  return bestOpt;
}

export default function TestEngine() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [visited, setVisited] = useState(new Set());
  const [marked, setMarked] = useState(new Set());
  const [timeLeft, setTimeLeft] = useState(3000); // 50 mins
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const apiEndpoint = import.meta.env.VITE_API_URL || awsmobile.aws_cloud_logic_custom[0].endpoint;
        const response = await axios.get(`${apiEndpoint}/tests/${testId}`);
        // Fix for over-fetching bug: Slice the array based on test type
        const maxQuestions = testId.startsWith('coding') ? 20 : 30;
        const validQuestions = response.data.slice(0, maxQuestions);
        setQuestions(validQuestions);
        if (validQuestions.length > 0) {
          setVisited(new Set([validQuestions[0].questionId]));
        }
      } catch (err) {
        console.error("Error fetching questions:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [testId]);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(prev => prev > 0 ? prev - 1 : 0), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSelectAnswer = (opt) => {
    const currentQId = questions[currentIndex].questionId;
    setAnswers({ ...answers, [currentQId]: opt });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setVisited(new Set([...visited, questions[nextIndex].questionId]));
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      setVisited(new Set([...visited, questions[prevIndex].questionId]));
    }
  };
  
  const jumpToQuestion = (index) => {
    setCurrentIndex(index);
    setVisited(new Set([...visited, questions[index].questionId]));
  };

  const toggleMarkForReview = () => {
    const currentQId = questions[currentIndex].questionId;
    const newMarked = new Set(marked);
    if (newMarked.has(currentQId)) {
      newMarked.delete(currentQId);
    } else {
      newMarked.add(currentQId);
    }
    setMarked(newMarked);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const apiEndpoint = import.meta.env.VITE_API_URL || awsmobile.aws_cloud_logic_custom[0].endpoint;
    const userId = localStorage.getItem('userId') || 'candidate-alpha';
    const timeTaken = 3000 - timeLeft;

    let submissionResult = null;

    try {
      const response = await axios.post(`${apiEndpoint}/tests/submit`, {
        userId,
        testId,
        answers
      });
      if (response.data && response.data.details) {
        submissionResult = response.data;
      }
    } catch (err) {
      console.warn("Backend submit fallback", err);
    }

    if (!submissionResult) {
      let score = 0;
      const gradedDetails = questions.map(q => {
        const userAns = answers[q.questionId];
        const correctAns = getCorrectOption(q);
        const isCorrect = userAns === correctAns;
        if (isCorrect) score++;
        return {
          questionId: q.questionId,
          userAnswer: userAns || null,
          correctAnswer: correctAns,
          isCorrect
        };
      });

      submissionResult = {
        score,
        total: questions.length,
        timestamp: new Date().toISOString(),
        details: gradedDetails
      };
    }

    navigate('/results', { state: { result: submissionResult, timeTaken, questions } });
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-4 w-full">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
          <Clock className="w-10 h-10 opacity-80 text-zinc-900 dark:text-white" />
        </motion.div>
        <p className="font-mono tracking-widest text-xs uppercase text-zinc-500 dark:text-zinc-400">Loading Assessment Environment...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 w-full">
        <AlertCircle className="w-14 h-14 text-rose-500 mb-4" />
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">No Questions Loaded</h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6">Could not retrieve questions for module {testId}.</p>
        <button 
          onClick={() => navigate('/')} 
          className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition text-xs uppercase tracking-wider"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progressPercentage = ((3000 - timeLeft) / 3000) * 100;

  const getStatusColor = (qId) => {
    if (marked.has(qId)) return 'bg-violet-500/20 text-violet-300 border-violet-500/40';
    if (answers[qId]) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    if (visited.has(qId)) return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    return 'bg-white/[0.02] text-gray-500 border-white/[0.06]';
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden relative font-sans w-full">
      
      {/* Progress Line */}
      <div className="h-1 w-full bg-white/[0.04] z-50 fixed top-0">
        <motion.div 
          className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 shadow-[0_0_12px_rgba(34,211,238,0.8)]"
          initial={{ width: '0%' }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ ease: "linear", duration: 1 }}
        />
      </div>

      {/* Top Bar */}
      <header className="h-16 px-6 border-b border-zinc-200/50 dark:border-zinc-800/50 flex justify-between items-center z-10 bg-white/70 dark:bg-[#09090b]/70 backdrop-blur-md">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-zinc-600 dark:text-zinc-300 transition"
          >
            <List className="w-4 h-4" />
          </button>
          <div className="font-mono text-cyan-400 font-bold tracking-widest uppercase text-xs px-2.5 py-1 rounded bg-cyan-950/60 border border-cyan-800/40">
            {testId}
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className={cn("flex items-center space-x-2 font-mono text-lg font-bold tracking-wider", 
            timeLeft < 300 ? 'text-rose-500 animate-pulse' : 'text-zinc-900 dark:text-zinc-100'
          )}>
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>{formatTime(timeLeft)}</span>
          </div>
          
          <button 
            onClick={handleSubmit}
            disabled={submitting}
            className="flex justify-center items-center space-x-2 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 transition-all duration-200 ease-out hover:bg-zinc-800 dark:hover:bg-zinc-200 hover:-translate-y-[1px] hover:shadow-md active:scale-[0.98] font-medium text-sm tracking-wide py-2.5 px-4 rounded-xl disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submitting ? 'Submitting...' : 'End Test'}</span>
          </button>
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden z-10 relative">
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-12 flex flex-col">
          <div className="max-w-4xl w-full mx-auto flex flex-col flex-1 justify-between">
            
            <div>
              {/* Question Header Badge */}
              <div className="mb-6 flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800/60 pb-3">
                <span className="text-xs font-mono font-bold text-zinc-500 tracking-wider uppercase flex items-center space-x-2">
                  <span className="text-zinc-900 dark:text-white font-bold">Question {currentIndex + 1}</span>
                  <span className="text-zinc-400 dark:text-zinc-600">/</span>
                  <span>{questions.length}</span>
                </span>
                <span className="px-2.5 py-1 bg-zinc-100 dark:bg-white/[0.04] rounded-lg text-zinc-600 dark:text-cyan-400 font-mono text-[11px] font-semibold border border-zinc-200 dark:border-white/[0.08]">
                  {currentQuestion.category || "Applied CS"}
                </span>
              </div>

              {/* Question Text with Markdown & Syntax Highlighting */}
              <div className="bg-white dark:bg-[#090d1e]/60 backdrop-blur-xl p-8 rounded-3xl border border-zinc-200 dark:border-white/[0.08] shadow-md dark:shadow-2xl mb-8">
                <MarkdownRenderer content={currentQuestion?.questionText} />
              </div>
              
              {/* Options Grid */}
              <div className="space-y-3 mb-10">
                {currentQuestion?.options.map((opt, i) => {
                  const isSelected = answers[currentQuestion.questionId] === opt;
                  return (
                    <motion.button
                      key={i}
                      whileHover={{ x: 3 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleSelectAnswer(opt)}
                      className={cn(
                        "w-full text-left p-4 md:p-5 rounded-2xl border transition-all duration-300 ease-out flex items-start group shadow-sm hover:shadow-md",
                        isSelected 
                          ? "border-zinc-900 dark:border-cyan-500/80 bg-zinc-900 text-white dark:bg-cyan-950/30 dark:text-white shadow-[0_0_20px_rgba(34,211,238,0.2)]" 
                          : "border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-[#070a16] hover:border-zinc-300 dark:hover:border-white/20 hover:bg-zinc-100 dark:hover:bg-white/[0.02] text-zinc-700 dark:text-gray-300"
                      )}
                    >
                      <span className={cn(
                        "inline-flex items-center justify-center w-8 h-8 rounded-xl mr-4 text-xs font-bold font-mono transition-colors flex-shrink-0 mt-0.5",
                        isSelected ? "bg-white text-zinc-900 dark:bg-cyan-500 dark:text-black shadow-lg" : "bg-white dark:bg-white/[0.04] text-zinc-500 dark:text-gray-400 border border-zinc-200 dark:border-white/[0.08] group-hover:text-zinc-900 dark:group-hover:text-white"
                      )}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      
                      <div className="flex-1 text-sm md:text-base leading-relaxed">
                        <MarkdownRenderer content={opt} />
                      </div>
                      
                      {isSelected && (
                        <CheckCircle className="w-5 h-5 text-cyan-400 ml-3 flex-shrink-0 mt-1" />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions Footer */}
            <div className="flex justify-between items-center pt-6 border-t border-zinc-200 dark:border-white/[0.08] mt-auto">
              <div className="flex space-x-3">
                <button 
                  disabled={currentIndex === 0}
                  onClick={handlePrev}
                  className="flex items-center space-x-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 dark:text-gray-400 dark:hover:text-white dark:bg-white/[0.03] dark:hover:bg-white/[0.08] dark:border-white/[0.06] disabled:opacity-20 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Previous</span>
                </button>
                
                <button 
                  onClick={toggleMarkForReview}
                  className={cn(
                    "flex items-center space-x-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors border",
                    marked.has(currentQuestion.questionId) 
                      ? "bg-violet-100 text-violet-600 border-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-500/40 shadow-[0_0_15px_rgba(139,92,246,0.3)]" 
                      : "bg-zinc-50 text-zinc-500 border-zinc-200 hover:text-zinc-900 hover:bg-zinc-100 dark:bg-white/[0.03] dark:text-gray-400 dark:border-white/[0.06] dark:hover:text-white dark:hover:bg-white/[0.08]"
                  )}
                >
                  <Flag className="w-4 h-4" />
                  <span className="hidden sm:inline">Review Flag</span>
                </button>
              </div>
              
              <button 
                onClick={handleNext}
                disabled={currentIndex === questions.length - 1}
                className={cn(
                  "flex items-center space-x-2 px-8 py-3 rounded-xl text-xs font-black uppercase tracking-wider text-black transition-all",
                  currentIndex === questions.length - 1 
                    ? "bg-gray-800 text-gray-500 opacity-40 cursor-not-allowed"
                    : "bg-gradient-to-r from-cyan-400 to-blue-500 hover:opacity-95 shadow-[0_0_20px_rgba(34,211,238,0.4)] active:scale-95"
                )}
              >
                <span>Save & Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </main>

        {/* Question Palette Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="bg-zinc-50 dark:bg-[#070a16] border-l border-zinc-200 dark:border-white/[0.08] flex flex-col"
            >
              <div className="p-5 border-b border-zinc-200 dark:border-white/[0.08]">
                <h3 className="text-zinc-900 dark:text-white font-bold text-sm mb-3">Question Palette</h3>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-500 dark:text-gray-400 font-mono">
                  <div className="flex items-center space-x-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /><span>Answered</span></div>
                  <div className="flex items-center space-x-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-rose-500" /><span>Unanswered</span></div>
                  <div className="flex items-center space-x-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-violet-500" /><span>Marked</span></div>
                  <div className="flex items-center space-x-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-zinc-300 dark:bg-white/10" /><span>Not Visited</span></div>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-5">
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((q, idx) => (
                    <button
                      key={q.questionId}
                      onClick={() => jumpToQuestion(idx)}
                      className={cn(
                        "w-full aspect-square rounded-xl flex items-center justify-center font-mono font-bold text-xs border transition-transform hover:scale-105 active:scale-95",
                        getStatusColor(q.questionId),
                        currentIndex === idx && "ring-2 ring-cyan-400 ring-offset-2 ring-offset-[#070a16] scale-105"
                      )}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
      
      <Chatbot contextData={currentQuestion} />
    </div>
  );
}
