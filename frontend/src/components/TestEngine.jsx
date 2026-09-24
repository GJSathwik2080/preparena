import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, ChevronRight, ChevronLeft, CheckCircle, Send, Flag, List } from 'lucide-react';
import axios from 'axios';
import { awsmobile } from '../aws-exports';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Chatbot from './Chatbot';

function cn(...inputs) {
  return twMerge(clsx(inputs));
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
        const apiEndpoint = awsmobile.aws_cloud_logic_custom[0].endpoint;
        const response = await axios.get(`${apiEndpoint}/tests/${testId}`);
        setQuestions(response.data);
        if (response.data.length > 0) {
          setVisited(new Set([response.data[0].questionId]));
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
    try {
      const apiEndpoint = awsmobile.aws_cloud_logic_custom[0].endpoint;
      const response = await axios.post(`${apiEndpoint}/tests/submit`, {
        userId: "test-user-123",
        testId,
        answers
      });
      // Pass along questions so we have the explanations if the backend doesn't return them directly in details
      navigate('/results', { state: { result: response.data, timeTaken: 3000 - timeLeft, questions } });
    } catch (err) {
      console.error("Error submitting test:", err);
      alert("Failed to submit test");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-cyan-400">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
          <Clock className="w-12 h-12 opacity-50" />
        </motion.div>
        <p className="mt-4 animate-pulse font-mono tracking-widest text-sm">INITIALIZING ARENA...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-red-400">No questions found. Did you run the seed script?</div>;
  }

  const currentQuestion = questions[currentIndex];
  const progressPercentage = ((3000 - timeLeft) / 3000) * 100;
  const timerColor = timeLeft < 300 ? 'bg-red-500' : timeLeft < 900 ? 'bg-yellow-500' : 'bg-cyan-400';

  const getStatusColor = (qId) => {
    if (marked.has(qId)) return 'bg-violet-500 text-white border-violet-400';
    if (answers[qId]) return 'bg-emerald-500 text-white border-emerald-400';
    if (visited.has(qId)) return 'bg-rose-500 text-white border-rose-400';
    return 'bg-gray-800 text-gray-400 border-gray-700'; // Not visited
  };

  return (
    <div className="h-screen bg-gray-950 flex flex-col overflow-hidden relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] bg-violet-900/10 blur-[150px] rounded-full pointer-events-none" />

      {/* Progress Bar Header */}
      <div className="h-1.5 w-full bg-gray-800 z-50 fixed top-0">
        <motion.div 
          className={cn("h-full shadow-[0_0_10px_currentColor]", timerColor)}
          initial={{ width: '0%' }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ ease: "linear", duration: 1 }}
        />
      </div>

      <header className="h-20 px-6 border-b border-gray-800 flex justify-between items-center z-10 bg-gray-900/50 backdrop-blur-md">
        <div className="flex items-center space-x-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 text-gray-300">
            <List className="w-5 h-5" />
          </button>
          <div className="font-mono text-cyan-400 font-bold tracking-widest uppercase text-sm">
            {testId}
          </div>
        </div>
        <div className="flex items-center space-x-6">
          <div className={cn("flex items-center space-x-2 font-mono text-xl font-bold tracking-wider", 
            timeLeft < 300 ? 'text-red-400 animate-pulse' : 'text-gray-300'
          )}>
            <Clock className="w-5 h-5" />
            <span>{formatTime(timeLeft)}</span>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30 hover:bg-rose-600 hover:text-white transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span className="font-semibold">{submitting ? 'Submitting...' : 'End Test'}</span>
          </motion.button>
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden z-10 relative">
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-12 flex flex-col">
          <div className="max-w-4xl w-full mx-auto flex flex-col flex-1">
            
            <div className="mb-6 flex justify-between items-end">
               <span className="text-sm font-bold text-gray-400 tracking-widest uppercase flex items-center space-x-2">
                  <span>Question {currentIndex + 1} of {questions.length}</span>
                  <span className="px-2 py-0.5 bg-gray-800 rounded-md text-cyan-400 text-xs">{currentQuestion.category || "General"}</span>
               </span>
            </div>

            <div className="flex-1 relative flex flex-col">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col flex-1"
                >
                  <h2 className="text-2xl md:text-3xl leading-relaxed font-medium text-white mb-10 drop-shadow-md whitespace-pre-wrap">
                    {currentQuestion?.questionText}
                  </h2>
                  
                  <div className="space-y-4 mb-12 flex-1">
                    {currentQuestion?.options.map((opt, i) => {
                      const isSelected = answers[currentQuestion.questionId] === opt;
                      return (
                        <motion.button
                          key={i}
                          whileHover={{ scale: 1.01, x: 4 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSelectAnswer(opt)}
                          className={cn(
                            "w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 flex items-center group relative overflow-hidden",
                            isSelected 
                              ? "border-cyan-500 bg-cyan-900/30 text-white shadow-[0_0_15px_rgba(34,211,238,0.3)]" 
                              : "border-gray-800 bg-gray-900/50 hover:border-gray-600 hover:bg-gray-800 text-gray-300"
                          )}
                        >
                          <span className={cn(
                            "inline-flex items-center justify-center w-10 h-10 rounded-full mr-5 text-sm font-bold font-mono transition-colors",
                            isSelected ? "bg-cyan-500 text-gray-950" : "bg-gray-800 text-gray-500 group-hover:bg-gray-700 group-hover:text-gray-300"
                          )}>
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span className="text-lg">{opt}</span>
                          
                          {isSelected && (
                             <motion.div 
                               initial={{ scale: 0, opacity: 0 }}
                               animate={{ scale: 1, opacity: 1 }}
                               className="ml-auto"
                             >
                               <CheckCircle className="w-6 h-6 text-cyan-400" />
                             </motion.div>
                          )}
                        </motion.button>
                      )
                    })}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex justify-between items-center mt-auto pt-6 border-t border-gray-800">
              <div className="flex space-x-4">
                <button 
                  disabled={currentIndex === 0}
                  onClick={handlePrev}
                  className="flex items-center space-x-2 px-6 py-4 rounded-2xl text-gray-500 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span className="font-semibold hidden sm:inline">Previous</span>
                </button>
                <button 
                  onClick={toggleMarkForReview}
                  className={cn(
                    "flex items-center space-x-2 px-6 py-4 rounded-2xl font-semibold transition-colors border",
                    marked.has(currentQuestion.questionId) 
                      ? "bg-violet-900/40 text-violet-400 border-violet-500/50"
                      : "bg-gray-900 text-gray-400 border-gray-700 hover:bg-gray-800 hover:text-white"
                  )}
                >
                  <Flag className="w-5 h-5" />
                  <span className="hidden sm:inline">Mark for Review</span>
                </button>
              </div>
              
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNext}
                disabled={currentIndex === questions.length - 1}
                className={cn(
                  "flex items-center space-x-2 px-10 py-4 rounded-2xl text-white font-bold transition-all",
                  currentIndex === questions.length - 1 
                    ? "bg-gray-800 text-gray-500 opacity-50 cursor-not-allowed"
                    : "bg-cyan-600 hover:bg-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.4)]"
                )}
              >
                <span>Save & Next</span>
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </main>

        {/* Question Palette Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="bg-gray-900/80 border-l border-gray-800 flex flex-col backdrop-blur-xl"
            >
              <div className="p-6 border-b border-gray-800">
                <h3 className="text-white font-bold text-lg mb-4">Question Palette</h3>
                <div className="grid grid-cols-2 gap-3 text-xs text-gray-400">
                  <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-sm bg-emerald-500" /><span>Answered</span></div>
                  <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-sm bg-rose-500" /><span>Unanswered</span></div>
                  <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-sm bg-violet-500" /><span>Marked</span></div>
                  <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-sm bg-gray-800 border border-gray-700" /><span>Not Visited</span></div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-5 gap-3">
                  {questions.map((q, idx) => (
                    <button
                      key={q.questionId}
                      onClick={() => jumpToQuestion(idx)}
                      className={cn(
                        "w-full aspect-square rounded-lg flex items-center justify-center font-mono font-bold text-sm border transition-transform hover:scale-110",
                        getStatusColor(q.questionId),
                        currentIndex === idx && "ring-2 ring-white ring-offset-2 ring-offset-gray-900 scale-110"
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
