import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Skull, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Chatbot from './Chatbot';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function SurvivalEngine() {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});

  const TEST_ID = 'technical-mock-1'; // Hardcoded for this mode

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'https://mock.execute-api.us-east-1.amazonaws.com';
        const res = await fetch(`${API_URL}/tests/${TEST_ID}`);
        const data = await res.json();
        // Shuffle the questions for variety
        const shuffled = data.sort(() => 0.5 - Math.random());
        setQuestions(shuffled);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  useEffect(() => {
    if (loading || isGameOver || questions.length === 0) return;
    if (timeLeft <= 0) {
      handleGameOver();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, loading, isGameOver, questions.length]);

  const handleGameOver = async () => {
    setIsGameOver(true);
    try {
      const userId = localStorage.getItem('userId') || 'guest';
      const API_URL = import.meta.env.VITE_API_URL || 'https://mock.execute-api.us-east-1.amazonaws.com';
      await fetch(`${API_URL}/tests/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, testId: TEST_ID, answers })
      });
    } catch (err) {
      console.error('Failed to submit results', err);
    }
  };

  const handleAnswer = (option) => {
    const currentQ = questions[currentIndex];
    
    // Store answer for submission
    setAnswers(prev => ({
        ...prev,
        [currentQ.questionId]: option
    }));

    // For survival, we just move to the next question. Correctness is evaluated by backend.
    // For immediate gamification feedback, we assume if they survived it's correct?
    // Wait, the backend stripped correct answers. We can't know locally. 
    // We'll just advance and give +2 seconds.
    setScore(s => s + 1);
    setTimeLeft(t => t + 5);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(i => i + 1);
    } else {
      handleGameOver();
    }
  };

  const isDanger = timeLeft <= 10;
  
  if (loading) {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-cyan-500" /></div>;
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className={cn("min-h-screen p-6 md:p-12 relative flex flex-col font-sans transition-colors duration-300", 
      isDanger ? "bg-rose-950 text-white" : "bg-gray-950 text-white"
    )}>
      
      {isDanger && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.2, 0] }}
          transition={{ repeat: Infinity, duration: 1 }}
          className="absolute inset-0 bg-rose-600 pointer-events-none"
        />
      )}

      {questions.length === 0 && !loading && !isGameOver ? (
        <div className="flex-1 flex flex-col items-center justify-center z-10">
          <h1 className="text-4xl font-bold text-white mb-4">No Scenarios Found</h1>
          <p className="text-gray-400 mb-8">The database is currently empty for this test module.</p>
          <button 
            onClick={() => navigate('/')} 
            className="px-8 py-4 bg-cyan-600 text-white font-black rounded-xl hover:bg-cyan-500 transition shadow-[0_0_20px_rgba(34,211,238,0.4)]"
          >
            Return to Base
          </button>
        </div>
      ) : !isGameOver && currentQuestion ? (
        <div className="max-w-4xl w-full mx-auto z-10 flex flex-col items-center">
          
          <div className="flex w-full justify-between items-center mb-12">
            <div className="bg-gray-900/80 px-6 py-3 rounded-2xl border border-gray-800 shadow-xl">
              <span className="text-gray-500 text-xs font-bold uppercase tracking-wider block mb-1">Questions</span>
              <span className="text-3xl font-black text-white">{score} / {questions.length}</span>
            </div>
            
            <div className={cn("px-8 py-4 rounded-3xl border-2 flex items-center space-x-3 shadow-2xl", 
              isDanger 
                ? "bg-rose-900/80 border-rose-500 animate-pulse" 
                : "bg-gray-900/80 border-cyan-500"
            )}>
              <Timer className={cn("w-8 h-8", isDanger ? "text-rose-400" : "text-cyan-400")} />
              <span className={cn("text-5xl font-mono font-black tracking-tighter", isDanger ? "text-rose-100" : "text-cyan-100")}>
                {timeLeft}s
              </span>
            </div>
          </div>

          <div className="w-full bg-gray-900/60 backdrop-blur-xl p-10 rounded-3xl border border-gray-800 shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-200 leading-relaxed mb-8">{currentQuestion.questionText}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQuestion.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(opt)}
                  className="w-full p-6 text-left rounded-xl border border-gray-700 bg-gray-800/50 hover:bg-cyan-900/40 hover:border-cyan-500 transition-all font-semibold text-gray-300"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
          
          {/* Elite Tutor Integration */}
          <Chatbot contextData={currentQuestion} />

        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center z-10">
          <Skull className="w-24 h-24 text-rose-500 mb-6 drop-shadow-[0_0_30px_rgba(225,29,72,0.8)]" />
          <h1 className="text-6xl font-black text-white mb-2">{timeLeft > 0 ? "SURVIVED!" : "SURVIVAL FAILED"}</h1>
          <p className="text-2xl text-gray-400 mb-8">Questions Answered: <span className="text-white font-bold">{score}</span></p>
          <button 
            onClick={() => navigate('/')} 
            className="px-8 py-4 bg-white text-gray-950 font-black rounded-xl hover:bg-gray-200 transition shadow-[0_0_30px_rgba(255,255,255,0.4)]"
          >
            Return to Base
          </button>
        </div>
      )}
    </div>
  );
}
