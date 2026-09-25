import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Skull, Loader2, Trophy, ArrowRight, Home, Flame, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import MarkdownRenderer from './MarkdownRenderer';
import Chatbot from './Chatbot';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const QUESTIONS_PER_ROUND = 10;

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

export default function SurvivalEngine() {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isRoundComplete, setIsRoundComplete] = useState(false);
  const [roundNumber, setRoundNumber] = useState(1);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [streak, setStreak] = useState(0);
  const [lastFailedQuestion, setLastFailedQuestion] = useState(null);

  const timerRef = useRef(null);
  const TEST_ID = 'technical-mock-1';

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'https://fxhotx9euc.execute-api.ap-south-1.amazonaws.com';
        const res = await fetch(`${API_URL}/tests/${TEST_ID}`);
        if (res.ok) {
          const data = await res.json();
          const shuffled = data.sort(() => 0.5 - Math.random());
          setQuestions(shuffled);
        }
      } catch (err) {
        console.error("Failed to fetch questions for Survival Mode", err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  // Timer loop
  useEffect(() => {
    if (loading || isGameOver || isRoundComplete || questions.length === 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    if (timeLeft <= 0) {
      handleGameOver("Time Expired");
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleGameOver("Time Expired");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, isGameOver, isRoundComplete, questions.length]);

  const handleGameOver = async (reason = "Eliminated") => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsGameOver(true);
    await submitResults();
  };

  const submitResults = async () => {
    try {
      const userId = localStorage.getItem('userId') || 'guest-challenger';
      const API_URL = import.meta.env.VITE_API_URL || 'https://fxhotx9euc.execute-api.ap-south-1.amazonaws.com';
      await fetch(`${API_URL}/tests/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, testId: TEST_ID, answers })
      });
    } catch (err) {
      console.warn('Failed to submit survival results to API', err);
    }
  };

  const handleAnswer = (selectedOption) => {
    if (isGameOver || isRoundComplete || !questions[currentIndex]) return;

    const currentQ = questions[currentIndex];
    const correctOpt = getCorrectOption(currentQ);
    const isCorrect = selectedOption === correctOpt;

    setAnswers(prev => ({
      ...prev,
      [currentQ.questionId]: selectedOption
    }));

    if (!isCorrect) {
      if (timerRef.current) clearInterval(timerRef.current);
      setLastFailedQuestion({
        questionText: currentQ.questionText,
        yourAnswer: selectedOption,
        correctAnswer: correctOpt,
        explanation: currentQ.explanation
      });
      setIsGameOver(true);
      submitResults();
      return;
    }

    setScore(s => s + 1);
    setStreak(st => st + 1);
    setTimeLeft(t => t + 10);

    const nextIndex = currentIndex + 1;
    if (nextIndex % QUESTIONS_PER_ROUND === 0) {
      setIsRoundComplete(true);
      submitResults();
    } else if (nextIndex < questions.length) {
      setCurrentIndex(nextIndex);
    } else {
      setIsRoundComplete(true);
      submitResults();
    }
  };

  const nextRound = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(i => i + 1);
      setRoundNumber(r => r + 1);
      setIsRoundComplete(false);
      setTimeLeft(60);
    } else {
      handleGameOver("All Waves Cleared!");
    }
  };

  const isDanger = timeLeft <= 10 && !isRoundComplete && !isGameOver;

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-4 text-rose-600 dark:text-rose-500 font-sans w-full">
        <Loader2 className="w-10 h-10 animate-spin text-rose-600 dark:text-rose-500" />
        <span className="font-mono text-xs tracking-widest text-zinc-500 dark:text-gray-400 uppercase">Configuring Survival Arena...</span>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const roundIndex = currentIndex % QUESTIONS_PER_ROUND;

  return (
    <div className={cn("flex-1 p-6 md:p-12 relative flex flex-col font-sans transition-colors duration-500 selection:bg-rose-500/30 w-full", 
      isDanger ? "bg-rose-50 dark:bg-[#18040a] text-rose-900 dark:text-white" : "bg-transparent text-zinc-900 dark:text-gray-100"
    )}>
      
      {isDanger && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.2, 0] }}
          transition={{ repeat: Infinity, duration: 1 }}
          className="absolute inset-0 bg-rose-600/30 pointer-events-none"
        />
      )}

      {/* Top Navbar */}
      <div className="flex items-center justify-between mb-8 z-10 border-b border-zinc-200 dark:border-white/[0.08] pb-4">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center space-x-2 text-zinc-500 dark:text-gray-400 hover:text-zinc-900 dark:hover:text-white transition px-3 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/[0.06] text-xs font-semibold"
        >
          <Home className="w-4 h-4" />
          <span>Exit Arena</span>
        </button>
        
        <div className="flex items-center space-x-2 bg-rose-50 dark:bg-rose-500/10 px-4 py-1.5 rounded-full border border-rose-200 dark:border-rose-500/20">
          <Flame className="w-4 h-4 text-rose-500 dark:text-rose-400 animate-pulse" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-600 dark:text-rose-300">Survival (Instant Elimination)</span>
        </div>
      </div>

      {questions.length === 0 && !loading && !isGameOver ? (
        <div className="flex-1 flex flex-col items-center justify-center z-10 text-center">
          <AlertCircle className="w-16 h-16 text-rose-500 mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">No Questions Found</h1>
          <p className="text-gray-400 text-sm mb-6">Could not load question bank from AWS DynamoDB.</p>
          <button 
            onClick={() => navigate('/')} 
            className="px-6 py-3 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-500 transition text-xs uppercase tracking-wider"
          >
            Return to Dashboard
          </button>
        </div>
      ) : isRoundComplete && !isGameOver ? (
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex-1 flex flex-col items-center justify-center z-10 text-center py-12"
        >
          <Trophy className="w-20 h-20 text-amber-400 mb-6 drop-shadow-[0_0_40px_rgba(251,191,36,0.6)] animate-bounce" />
          <h1 className="text-4xl md:text-5xl font-black text-white mb-2">Wave {roundNumber} Cleared!</h1>
          <p className="text-lg text-gray-300 mb-8 font-mono">
            Total Score: <span className="text-emerald-400 font-bold">{score}</span> | Combo Streak: <span className="text-amber-400 font-bold">{streak}🔥</span>
          </p>
          <div className="flex space-x-4">
            <button 
              onClick={() => navigate('/')} 
              className="px-6 py-3.5 bg-white/[0.04] border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition text-xs uppercase tracking-wider"
            >
              Cash Out & Leave
            </button>
            <button 
              onClick={nextRound} 
              className="flex justify-center items-center space-x-2 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 transition-all duration-200 ease-out hover:bg-zinc-800 dark:hover:bg-zinc-200 hover:-translate-y-[1px] hover:shadow-md active:scale-[0.98] font-medium text-sm tracking-wide py-2.5 px-4 rounded-xl cursor-pointer"
            >
              <span>Next Wave (+60s)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      ) : !isGameOver && currentQuestion ? (
        <div className="max-w-4xl w-full mx-auto z-10 flex flex-col items-center flex-1 justify-between pb-10">
          
          {/* Header Stats */}
          <div className="flex w-full justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <div className="bg-white dark:bg-[#090d1e] px-4 py-2 rounded-xl border border-zinc-200 dark:border-white/[0.08] shadow-sm dark:shadow-xl">
                <span className="text-zinc-500 dark:text-gray-500 text-[10px] font-bold uppercase tracking-wider block font-mono">Wave {roundNumber}</span>
                <span className="text-xl font-black text-zinc-900 dark:text-white font-mono">{roundIndex + 1} <span className="text-xs text-zinc-500 dark:text-gray-500">/ {QUESTIONS_PER_ROUND}</span></span>
              </div>
              <div className="bg-white dark:bg-[#090d1e] px-4 py-2 rounded-xl border border-zinc-200 dark:border-white/[0.08] shadow-sm dark:shadow-xl">
                <span className="text-zinc-500 dark:text-gray-500 text-[10px] font-bold uppercase tracking-wider block font-mono">Score</span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{score}</span>
              </div>
            </div>
            
            {/* Timer Badge */}
            <div className={cn("px-5 py-2.5 rounded-2xl border flex items-center space-x-3 shadow-2xl transition-all", 
              isDanger 
                ? "bg-rose-950 border-rose-500 animate-pulse shadow-[0_0_30px_rgba(225,29,72,0.8)]" 
                : "bg-[#090d1e] border-cyan-500/50 shadow-[0_0_20px_rgba(34,211,238,0.2)]"
            )}>
              <Timer className={cn("w-5 h-5", isDanger ? "text-rose-400" : "text-cyan-400")} />
              <span className={cn("text-2xl md:text-3xl font-mono font-black tracking-tight", isDanger ? "text-rose-200" : "text-cyan-100")}>
                {timeLeft}s
              </span>
            </div>
          </div>

          {/* Question Box with Markdown */}
          <div className="w-full bg-white/80 dark:bg-[#090d1e]/80 backdrop-blur-xl p-8 rounded-3xl border border-zinc-200 dark:border-white/[0.08] shadow-md dark:shadow-2xl mb-6">
            <div className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest mb-3">
              {currentQuestion.category || "Applied Technical Challenge"}
            </div>
            <MarkdownRenderer content={currentQuestion.questionText} />
          </div>
          
          {/* Options Grid */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {currentQuestion.options.map((opt, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.01, x: 3 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleAnswer(opt)}
                className="w-full p-4 md:p-5 text-left rounded-2xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-[#070a16] hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:border-rose-200 dark:hover:border-rose-500/50 transition-all text-xs md:text-sm font-medium text-zinc-700 dark:text-gray-200 flex items-start shadow-sm dark:shadow-lg group"
              >
                <span className="w-7 h-7 rounded-lg bg-white dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] flex items-center justify-center font-mono font-bold text-xs mr-3.5 group-hover:bg-rose-600 group-hover:text-white transition flex-shrink-0 mt-0.5 text-zinc-500 dark:text-gray-400">
                  {String.fromCharCode(65 + i)}
                </span>
                <div className="flex-1 leading-relaxed">
                  <MarkdownRenderer content={opt} />
                </div>
              </motion.button>
            ))}
          </div>

          <Chatbot contextData={currentQuestion} />

        </div>
      ) : (
        /* Game Over Screen */
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex-1 flex flex-col items-center justify-center z-10 text-center max-w-xl mx-auto py-8"
        >
          <div className="w-20 h-20 bg-rose-950/60 rounded-3xl border border-rose-500/40 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(225,29,72,0.6)]">
            <Skull className="w-10 h-10 text-rose-500 animate-pulse" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-red-500 to-orange-400 mb-2">
            SURVIVAL FAILED
          </h1>
          <p className="text-zinc-500 dark:text-gray-400 text-sm mb-6">
            Survival mode requires absolute precision. One incorrect choice triggers instant elimination.
          </p>

          <div className="grid grid-cols-2 gap-4 w-full mb-6">
            <div className="bg-zinc-50 dark:bg-[#090d1e] p-4 rounded-2xl border border-zinc-200 dark:border-white/[0.08]">
              <span className="text-[10px] text-zinc-500 dark:text-gray-500 uppercase tracking-widest font-bold block mb-1 font-mono">Score Achieved</span>
              <span className="text-2xl font-black text-zinc-900 dark:text-white font-mono">{score}</span>
            </div>
            <div className="bg-zinc-50 dark:bg-[#090d1e] p-4 rounded-2xl border border-zinc-200 dark:border-white/[0.08]">
              <span className="text-[10px] text-zinc-500 dark:text-gray-500 uppercase tracking-widest font-bold block mb-1 font-mono">Wave Reached</span>
              <span className="text-2xl font-black text-amber-500 dark:text-amber-400 font-mono">Wave {roundNumber}</span>
            </div>
          </div>

          {lastFailedQuestion && (
            <div className="w-full bg-white dark:bg-[#080b18] p-5 rounded-2xl border border-rose-200 dark:border-rose-900/50 text-left mb-6 text-xs font-sans shadow-md dark:shadow-none">
              <div className="text-rose-500 dark:text-rose-400 font-bold uppercase tracking-wider mb-2 flex items-center space-x-1.5 font-mono">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Elimination Mistake</span>
              </div>
              <div className="text-zinc-700 dark:text-gray-300 mb-3"><MarkdownRenderer content={lastFailedQuestion.questionText} /></div>
              <div className="text-rose-600 dark:text-rose-400 mb-1 font-mono">❌ Selected: {lastFailedQuestion.yourAnswer}</div>
              <div className="text-emerald-600 dark:text-emerald-400 mb-3 font-mono">✓ Required: {lastFailedQuestion.correctAnswer}</div>
              {lastFailedQuestion.explanation && (
                <div className="text-zinc-500 dark:text-gray-400 text-[11px] leading-relaxed border-t border-zinc-200 dark:border-white/[0.06] pt-2">
                  <span className="font-bold text-zinc-900 dark:text-gray-300">Explanation:</span> {lastFailedQuestion.explanation}
                </div>
              )}
            </div>
          )}

          <div className="flex space-x-3">
            <button 
              onClick={() => {
                setIsGameOver(false);
                setIsRoundComplete(false);
                setTimeLeft(60);
                setScore(0);
                setCurrentIndex(0);
                setRoundNumber(1);
                setLastFailedQuestion(null);
              }} 
              className="flex justify-center items-center bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 transition-all duration-200 ease-out hover:bg-zinc-800 dark:hover:bg-zinc-200 hover:-translate-y-[1px] hover:shadow-md active:scale-[0.98] font-medium text-sm tracking-wide py-2.5 px-4 rounded-xl cursor-pointer"
            >
              Try Again
            </button>
            <button 
              onClick={() => navigate('/')} 
              className="px-6 py-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.04] dark:hover:bg-white/10 text-zinc-600 hover:text-zinc-900 dark:text-gray-300 dark:hover:text-white font-bold rounded-xl border border-zinc-200 dark:border-white/10 transition text-xs uppercase tracking-wider"
            >
              Return to Lobby
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
