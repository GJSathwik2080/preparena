import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Editor } from '@monaco-editor/react';
import { Swords, Loader2, ChevronLeft, User, Terminal, Trophy, AlertTriangle, Play, CheckCircle2, XCircle, RefreshCw, Zap, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { runJavaScriptSolution } from '../utils/codeRunner';
import { useTheme } from '../context/ThemeContext';
import MarkdownRenderer from './MarkdownRenderer';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const BATTLE_PROBLEMS = [
  {
    id: "reverse-string",
    title: "Reverse String In-Place",
    tag: "DSA: Two Pointers",
    functionName: "reverseString",
    description: `Write a function that reverses an array of characters in-place with \`O(1)\` extra memory.

### Constraints:
- Modify the input array in-place.
- Time Complexity: \`O(N)\`
- Auxiliary Space: \`O(1)\``,
    starterCode: {
      javascript: `/**
 * @param {character[]} s
 * @return {character[]}
 */
function reverseString(s) {
  // Write your code here
}`,
      python: `def reverse_string(s: list[str]) -> list[str]:
    # Write your code here
    pass`,
      java: `class Solution {
    public void reverseString(char[] s) {
        // Write your code here
    }
}`
    },
    testCases: [
      { name: "Standard Word", args: [["h","e","l","l","o"]], expected: ["o","l","l","e","h"] },
      { name: "Name String", args: [["H","a","n","n","a","h"]], expected: ["h","a","n","n","a","H"] },
      { name: "Single Character", args: [["A"]], expected: ["A"] },
      { name: "Empty Array", args: [[]], expected: [] }
    ]
  },
  {
    id: "valid-palindrome",
    title: "Valid Palindrome Verification",
    tag: "DSA: Strings",
    functionName: "isPalindrome",
    description: `A phrase is a **palindrome** if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.

Return \`true\` if it is a palindrome, or \`false\` otherwise.`,
    starterCode: {
      javascript: `/**
 * @param {string} s
 * @return {boolean}
 */
function isPalindrome(s) {
  // Write your code here
}`,
      python: `def is_palindrome(s: str) -> bool:
    # Write your code here
    pass`,
      java: `class Solution {
    public boolean isPalindrome(String s) {
        // Write your code here
    }
}`
    },
    testCases: [
      { name: "Sentence with Punctuation", args: ["A man, a plan, a canal: Panama"], expected: true },
      { name: "Non-Palindrome Word", args: ["race a car"], expected: false },
      { name: "Whitespace String", args: [" "], expected: true },
      { name: "Alphanumeric Mix", args: ["0P"], expected: false }
    ]
  }
];

export default function BattleArena() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [status, setStatus] = useState('finding_match'); // finding_match, in_battle, finished
  const [opponent, setOpponent] = useState(null);
  const [myProgress, setMyProgress] = useState(0);
  const [opponentProgress, setOpponentProgress] = useState(0);
  const [isWinner, setIsWinner] = useState(false);
  const [wsStatusText, setWsStatusText] = useState('Connecting to WebSocket Gateway...');
  
  const [problemIndex, setProblemIndex] = useState(0);
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(BATTLE_PROBLEMS[0].starterCode.javascript);
  const [executionReport, setExecutionReport] = useState(null);
  const [isValidating, setIsValidating] = useState(false);

  const wsRef = useRef(null);
  const currentProblem = BATTLE_PROBLEMS[problemIndex];

  const currentUserName = localStorage.getItem('userId')?.split('@')[0] || `Candidate_${Math.floor(Math.random() * 900 + 100)}`;
  const userRank = 415;

  useEffect(() => {
    setCode(currentProblem.starterCode[language]);
    setExecutionReport(null);
  }, [language, problemIndex]);

  useEffect(() => {
    const WS_URL = import.meta.env.VITE_WEBSOCKET_URL || 'wss://m86xs206g5.execute-api.ap-south-1.amazonaws.com/Prod';
    let socket;
    let keepAliveTimer;

    try {
      socket = new WebSocket(WS_URL);
      wsRef.current = socket;

      socket.onopen = () => {
        setWsStatusText('Connected to AWS WebSocket gateway. Searching for peer in matchmaking queue...');
        
        socket.send(JSON.stringify({
          action: "joinMatchmaking",
          name: currentUserName,
          rank: userRank
        }));

        keepAliveTimer = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ action: "sendMessage", type: "ping" }));
          }
        }, 20000);
      };

      socket.onerror = (error) => {
        console.error("WebSocket Error:", error);
        setWsStatusText('WebSocket connection notice. Queue is listening for peers.');
      };

      socket.onclose = () => {
        if (status === 'finding_match') {
          setWsStatusText('Connection closed. Refresh to re-enter matchmaking queue.');
        }
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'matchFound') {
            setOpponent({ name: data.opponentName || 'Apex_Coder', rank: data.opponentRank || 420 });
            setStatus('in_battle');
          } else if (data.type === 'match_ack' || data.type === 'matchmaking_join') {
            // Support legacy backend behavior if production backend isn't updated
            if (data.name !== currentUserName) {
              setOpponent({ name: data.name || 'Apex_Coder', rank: data.rank || 420 });
              setStatus('in_battle');
            }
          } else if (data.type === 'progress') {
            if (data.name !== currentUserName) {
              const oppProg = Number(data.progress) || 0;
              setOpponentProgress(oppProg);
              if (oppProg >= 100) {
                setIsWinner(false);
                setStatus('finished');
              }
            }
          }
        } catch (e) {
          console.error("Failed to parse WebSocket message", e);
        }
      };
    } catch (err) {
      console.error("WebSocket initialization error", err);
      setWsStatusText('Could not connect to WebSocket.');
    }

    return () => {
      clearInterval(keepAliveTimer);
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, []);

  const handleStrictRunAndValidate = async () => {
    setIsValidating(true);

    try {
      const report = await runJavaScriptSolution(
        code,
        currentProblem.functionName,
        currentProblem.testCases
      );
      setExecutionReport(report);

      const calculatedProgress = Math.round((report.passedCount / report.totalCount) * 100);
      setMyProgress(calculatedProgress);

      // Broadcast real progress over WebSocket
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          action: "sendMessage", // Using sendMessage as standard wrapper based on local backend MVP, adjust if prod expects pure 'progress' action
          type: "progress",
          name: currentUserName,
          progress: calculatedProgress
        }));
      }

      // ONLY TRIGGER VICTORY IF 100% OF STRICT TEST CASES PASS
      if (report.success && calculatedProgress === 100) {
        setIsWinner(true);
        setTimeout(() => setStatus('finished'), 600);
      }
    } catch (err) {
      setExecutionReport({
        success: false,
        error: err.message,
        passedCount: 0,
        totalCount: currentProblem.testCases.length,
        results: []
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSimulateMatch = () => {
    setOpponent({ name: 'Phantom_Rival', rank: 465 });
    setStatus('in_battle');
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#050711] text-zinc-900 dark:text-white p-4 md:p-8 relative overflow-hidden font-sans flex flex-col selection:bg-rose-500/30">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl h-96 bg-rose-950/15 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-7xl w-full mx-auto z-10 relative flex-1 flex flex-col">
        
        {/* Top Navbar */}
        <div className="flex items-center justify-between mb-4 border-b border-zinc-200 dark:border-white/[0.08] pb-4">
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center space-x-2 text-zinc-500 hover:text-zinc-900 dark:text-gray-400 dark:hover:text-white transition px-3 py-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/[0.06] text-xs font-semibold"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Flee Arena</span>
          </button>
          
          <div className="flex items-center space-x-2 bg-rose-100 dark:bg-rose-500/10 px-4 py-1.5 rounded-full border border-rose-200 dark:border-rose-500/20">
            <Swords className="w-4 h-4 text-rose-500 dark:text-rose-400" />
            <span className="font-mono text-xs font-bold tracking-wider uppercase text-rose-600 dark:text-rose-300">1v1 PvP Real-time Race</span>
          </div>
        </div>

        {/* State 1: Finding Match */}
        {status === 'finding_match' && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-8 py-12">
            <div className="relative">
              <div className="absolute inset-0 bg-rose-600/20 blur-3xl rounded-full animate-pulse" />
              <div className="w-28 h-28 bg-white dark:bg-[#0e1224] rounded-3xl flex items-center justify-center relative border border-rose-200 dark:border-rose-500/40 shadow-md dark:shadow-[0_0_50px_rgba(225,29,72,0.4)]">
                <Swords className="w-12 h-12 text-rose-500 animate-bounce" />
              </div>
            </div>
            
            <div className="text-center space-y-2 max-w-md">
              <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 dark:from-rose-400 dark:via-orange-400 dark:to-amber-300">
                Searching for Opponent...
              </h2>
              <p className="text-zinc-500 dark:text-gray-400 text-xs md:text-sm">
                Scanning WebSocket connection pool for active contenders in the matchmaking queue.
              </p>
            </div>

            <div className="flex items-center space-x-3 text-zinc-600 dark:text-gray-300 bg-white dark:bg-[#0a0d1d] px-6 py-3 rounded-full border border-zinc-200 dark:border-white/[0.08] shadow-sm dark:shadow-2xl">
              {wsStatusText.includes('error') || wsStatusText.includes('closed') ? (
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              ) : (
                <Loader2 className="w-4 h-4 animate-spin text-cyan-500 dark:text-cyan-400" />
              )}
              <span className="text-xs font-mono text-zinc-600 dark:text-gray-300">{wsStatusText}</span>
            </div>

            <div className="pt-4 flex flex-col items-center space-y-2">
              <span className="text-[11px] text-zinc-400 dark:text-gray-500 uppercase tracking-widest font-mono">Instant Simulation Mode</span>
              <button 
                onClick={handleSimulateMatch}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.04] dark:hover:bg-white/10 text-zinc-600 hover:text-zinc-900 dark:text-gray-300 dark:hover:text-white rounded-xl border border-zinc-200 dark:border-white/10 text-xs font-semibold transition shadow-sm dark:shadow-lg"
              >
                Match with AI Opponent
              </button>
            </div>
          </div>
        )}

        {/* State 2: In Battle */}
        {status === 'in_battle' && (
          <div className="flex-1 flex flex-col space-y-4">
            
            {/* Live Progress Bars Header */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-[#080b18]/80 backdrop-blur-xl p-4 rounded-2xl border border-zinc-200 dark:border-white/[0.08] shadow-md dark:shadow-2xl">
              
              {/* My Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="bg-cyan-100 dark:bg-cyan-500/10 p-1.5 rounded-lg border border-cyan-200 dark:border-cyan-500/30">
                      <User className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <div>
                      <span className="font-bold text-zinc-900 dark:text-white text-xs md:text-sm">You ({currentUserName})</span>
                      <span className="text-[10px] text-cyan-600 dark:text-cyan-400 ml-2 font-mono">Rank #{userRank}</span>
                    </div>
                  </div>
                  <span className="text-cyan-600 dark:text-cyan-400 font-mono font-bold text-sm">{myProgress}%</span>
                </div>
                <div className="w-full bg-zinc-100 dark:bg-black/80 rounded-full h-2.5 border border-zinc-200 dark:border-white/[0.06] overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${myProgress}%` }}
                    className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 dark:from-cyan-600 dark:to-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]"
                  />
                </div>
              </div>

              {/* Opponent Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="bg-rose-100 dark:bg-rose-500/10 p-1.5 rounded-lg border border-rose-200 dark:border-rose-500/30">
                      <User className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    </div>
                    <div>
                      <span className="font-bold text-zinc-900 dark:text-white text-xs md:text-sm">{opponent?.name || 'Rival'}</span>
                      <span className="text-[10px] text-rose-600 dark:text-rose-400 ml-2 font-mono">Rank #{opponent?.rank || 420}</span>
                    </div>
                  </div>
                  <span className="text-rose-600 dark:text-rose-400 font-mono font-bold text-sm">{opponentProgress}%</span>
                </div>
                <div className="w-full bg-zinc-100 dark:bg-black/80 rounded-full h-2.5 border border-zinc-200 dark:border-white/[0.06] overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${opponentProgress}%` }}
                    className="h-full bg-gradient-to-r from-rose-500 to-rose-400 dark:from-rose-600 dark:to-rose-400 shadow-[0_0_15px_rgba(225,29,72,0.5)]"
                  />
                </div>
              </div>
            </div>

            {/* Split Screen Workspace */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[500px]">
              
              {/* Problem Column */}
              <div className="lg:col-span-4 bg-white dark:bg-[#070a16] p-6 rounded-2xl border border-zinc-200 dark:border-white/[0.08] flex flex-col justify-between overflow-y-auto max-h-[620px] shadow-sm dark:shadow-none">
                <div>
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-200 dark:border-white/[0.06]">
                    <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-500/20 font-semibold">
                      {currentProblem.tag}
                    </span>
                    <button 
                      onClick={() => setProblemIndex((p) => (p + 1) % BATTLE_PROBLEMS.length)}
                      className="flex items-center space-x-1 text-xs text-zinc-500 hover:text-zinc-900 dark:text-gray-400 dark:hover:text-white px-2 py-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.04] dark:hover:bg-white/10 rounded-lg transition"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Switch</span>
                    </button>
                  </div>

                  <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-3">{currentProblem.title}</h3>
                  <MarkdownRenderer content={currentProblem.description} />
                </div>

                <div className="pt-4 border-t border-zinc-200 dark:border-white/[0.06] mt-6">
                  <span className="text-[11px] font-mono font-bold text-zinc-500 dark:text-gray-400 uppercase tracking-wider block mb-2">
                    Battle Test Requirements
                  </span>
                  <div className="space-y-2">
                    {currentProblem.testCases.slice(0, 2).map((tc, idx) => (
                      <div key={idx} className="bg-zinc-50 dark:bg-black/50 p-2.5 rounded-lg border border-zinc-200 dark:border-white/[0.06] text-xs font-mono">
                        <div className="text-zinc-900 dark:text-zinc-100">Input: <span className="text-cyan-700 dark:text-cyan-300">{JSON.stringify(tc.args)}</span></div>
                        <div className="text-zinc-900 dark:text-zinc-100">Expected: <span className="text-emerald-700 dark:text-emerald-300">{JSON.stringify(tc.expected)}</span></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Editor & Strict Validation Terminal */}
              <div className="lg:col-span-8 bg-zinc-900 dark:bg-[#050711] rounded-2xl border border-zinc-200 dark:border-white/[0.08] flex flex-col overflow-hidden shadow-md dark:shadow-2xl">
                
                {/* Editor Top Bar */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800 dark:border-white/[0.08] bg-black/40">
                  <div className="flex items-center space-x-2 text-xs text-gray-400 font-mono">
                    <Shield className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Strict Test Verification Enabled</span>
                  </div>

                  <button
                    onClick={handleStrictRunAndValidate}
                    disabled={isValidating}
                    className="flex justify-center items-center space-x-2 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 transition-all duration-200 ease-out hover:bg-zinc-800 dark:hover:bg-zinc-200 hover:-translate-y-[1px] hover:shadow-md active:scale-[0.98] font-medium text-sm tracking-wide py-2.5 px-4 rounded-xl disabled:opacity-50 cursor-pointer"
                  >
                    {isValidating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    <span>{isValidating ? 'Validating...' : 'Submit Solution'}</span>
                  </button>
                </div>

                {/* Monaco Editor */}
                <div className="flex-1 min-h-[340px]">
                  <Editor
                    height="100%"
                    language="javascript"
                    theme={theme === 'dark' ? 'vs-dark' : 'light'}
                    value={code}
                    onChange={(val) => setCode(val || '')}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 13,
                      padding: { top: 12 },
                      scrollBeyondLastLine: false,
                      smoothScrolling: true,
                      tabSize: 2,
                      fontFamily: 'Fira Code, Menlo, Consolas, monospace'
                    }}
                  />
                </div>

                {/* Terminal Test Case Diff Output */}
                <div className="h-44 bg-zinc-950 dark:bg-[#030409] p-4 border-t border-zinc-800 dark:border-white/[0.08] overflow-y-auto font-mono text-xs">
                  <div className="flex items-center justify-between text-zinc-400 dark:text-gray-500 pb-1 mb-2 border-b border-zinc-800 dark:border-white/[0.06] uppercase tracking-widest text-[10px]">
                    <span>Battle Test Verifier</span>
                    {executionReport && (
                      <span className={executionReport.success ? "text-emerald-400" : "text-rose-400 font-bold"}>
                        {executionReport.passedCount}/{executionReport.totalCount} Test Cases Passed
                      </span>
                    )}
                  </div>

                  {!executionReport ? (
                    <div className="text-zinc-500 dark:text-gray-500">
                      {"> Click 'Submit Solution' to execute your code against all battle test cases..."}
                    </div>
                  ) : executionReport.error ? (
                    <div className="text-rose-400 bg-rose-950/30 p-2.5 rounded-lg border border-rose-900/40">
                      [FAILED]: {executionReport.error}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {executionReport.results.map((r, i) => (
                        <div key={i} className={cn(
                          "p-2.5 rounded-lg border text-xs",
                          r.passed ? "bg-emerald-950/30 border-emerald-900/40 text-emerald-300" : "bg-rose-950/30 border-rose-900/40 text-rose-300"
                        )}>
                          <div className="flex justify-between font-bold mb-1">
                            <span>{r.passed ? "✓ PASS" : "✗ FAIL"}: {r.name}</span>
                            <span>{r.passed ? "100%" : "0%"}</span>
                          </div>
                          <div className="text-[11px] text-zinc-400 dark:text-gray-400">Input: {r.input} | Expected: <span className="text-emerald-400">{r.expected}</span></div>
                          {!r.passed && (
                            <div className="mt-1 text-rose-400 font-semibold text-[11px]">
                              Actual Output: {r.actual} {r.error && `(${r.error})`}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>
          </div>
        )}

        {/* State 3: Battle Finished */}
        {status === 'finished' && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center space-y-6 py-12 text-center"
          >
            <div className={cn(
              "w-28 h-28 rounded-3xl flex items-center justify-center border-2 shadow-xl dark:shadow-2xl",
              isWinner 
                ? "bg-amber-100 dark:bg-amber-500/10 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.2)] dark:shadow-[0_0_50px_rgba(251,191,36,0.5)]" 
                : "bg-rose-100 dark:bg-rose-500/10 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.2)] dark:shadow-[0_0_50px_rgba(244,63,94,0.5)]"
            )}>
              <Trophy className={cn("w-14 h-14", isWinner ? "text-amber-500 dark:text-amber-400" : "text-rose-500 dark:text-rose-400")} />
            </div>
            
            <h2 className={cn(
              "text-5xl md:text-6xl font-black tracking-tight text-transparent bg-clip-text",
              isWinner 
                ? "bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 dark:from-amber-200 dark:via-yellow-400 dark:to-amber-500" 
                : "bg-gradient-to-r from-rose-500 via-red-500 to-rose-700 dark:from-rose-300 dark:via-rose-500 dark:to-red-600"
            )}>
              {isWinner ? "VICTORY" : "DEFEAT"}
            </h2>
            
            <p className="text-zinc-600 dark:text-gray-400 text-base max-w-md">
              {isWinner 
                ? `You passed all test cases and outpaced ${opponent?.name || 'your opponent'}! +35 MMR Rating.` 
                : `${opponent?.name || 'Your opponent'} solved all test cases first.`}
            </p>

            <div className="flex space-x-4 pt-4">
              <button 
                onClick={() => {
                  setStatus('finding_match');
                  setMyProgress(0);
                  setOpponentProgress(0);
                  setExecutionReport(null);
                }} 
                className="px-6 py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-500 dark:to-blue-600 text-white font-bold rounded-xl transition shadow-[0_0_10px_rgba(34,211,238,0.2)] dark:shadow-[0_0_20px_rgba(34,211,238,0.4)] text-xs uppercase tracking-wider"
              >
                Find Another Match
              </button>
              <button 
                onClick={() => navigate('/')} 
                className="px-6 py-3.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.04] dark:hover:bg-white/10 text-zinc-900 dark:text-white font-bold rounded-xl border border-zinc-200 dark:border-white/10 transition text-xs uppercase tracking-wider"
              >
                Return to Lobby
              </button>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
