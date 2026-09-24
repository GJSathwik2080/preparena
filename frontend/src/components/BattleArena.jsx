import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Swords, Loader2, ChevronLeft, User, Terminal, Trophy, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function BattleArena() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('finding_match'); // finding_match, in_battle, finished
  const [opponent, setOpponent] = useState(null);
  const [myProgress, setMyProgress] = useState(0);
  const [opponentProgress, setOpponentProgress] = useState(0);
  
  const [ws, setWs] = useState(null);

  const [wsStatusText, setWsStatusText] = useState('Connecting to WebSocket Gateway');

  useEffect(() => {
    const WS_URL = import.meta.env.VITE_WEBSOCKET_URL || 'wss://mock.execute-api.us-east-1.amazonaws.com/Prod';
    const websocket = new WebSocket(WS_URL);
    
    websocket.onopen = () => {
      setWs(websocket);
      setWsStatusText('Waiting for another player...');
      setTimeout(() => {
        setOpponent({ name: 'Rival_Coder', rank: 402 });
        setStatus('in_battle');
      }, 1500);
    };

    websocket.onerror = (error) => {
      console.error("WebSocket Error: ", error);
      setWsStatusText('Connection error. Is the WebSocket endpoint correct?');
    };

    websocket.onclose = () => {
      setWs(null);
      if (status === 'finding_match') {
        setWsStatusText('Connection closed. Refresh to try again.');
      }
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'progress') {
        setOpponentProgress(data.progress);
        if (data.progress >= 100) {
           setTimeout(() => setStatus('finished'), 500);
        }
      }
    };

    // onclose is handled above to set UI text.


    return () => {
      if (websocket.readyState === 1) {
         websocket.close();
      }
    };
  }, []);

  const handleSimulateSubmit = () => {
    const newProgress = Math.min(myProgress + 25, 100);
    setMyProgress(newProgress);
    
    if (ws && ws.readyState === 1) {
      ws.send(JSON.stringify({ action: "sendMessage", progress: newProgress, name: "Player1" }));
    }

    if (newProgress >= 100) {
      setTimeout(() => setStatus('finished'), 500);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 md:p-12 relative overflow-hidden font-sans">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 bg-rose-900/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto z-10 relative">
        <button onClick={() => navigate('/')} className="flex items-center space-x-2 text-gray-400 hover:text-white mb-8 transition">
          <ChevronLeft className="w-5 h-5" />
          <span>Flee Battle</span>
        </button>

        {status === 'finding_match' && (
          <div className="flex flex-col items-center justify-center h-[60vh] space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-rose-500/20 blur-xl rounded-full animate-pulse" />
              <div className="w-24 h-24 bg-rose-600 rounded-full flex items-center justify-center relative border border-rose-400 shadow-[0_0_30px_rgba(225,29,72,0.5)]">
                <Swords className="w-10 h-10 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-400">Searching for Opponent...</h2>
            <div className="flex items-center space-x-2 text-gray-400">
              {wsStatusText.includes('error') || wsStatusText.includes('closed') ? (
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              ) : (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              <span className={wsStatusText.includes('error') || wsStatusText.includes('closed') ? "text-rose-400" : ""}>{wsStatusText}</span>
            </div>
          </div>
        )}

        {status === 'in_battle' && (
          <div className="flex flex-col h-[80vh]">
            {/* Header: Progress Bars */}
            <div className="grid grid-cols-2 gap-8 mb-8 border-b border-gray-800 pb-8">
              
              {/* My Progress */}
              <div className="flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-cyan-900/50 p-2 rounded-lg border border-cyan-500/50">
                      <User className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div className="font-bold text-white tracking-wider">You</div>
                  </div>
                  <div className="text-cyan-400 font-mono font-bold">{myProgress}%</div>
                </div>
                <div className="w-full bg-gray-900 rounded-full h-3 border border-gray-800 relative overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${myProgress}%` }}
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]"
                  />
                </div>
              </div>

              {/* Opponent Progress */}
              <div className="flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-rose-900/50 p-2 rounded-lg border border-rose-500/50">
                      <User className="w-5 h-5 text-rose-400" />
                    </div>
                    <div>
                      <div className="font-bold text-white tracking-wider">{opponent.name}</div>
                      <div className="text-xs text-gray-500">Rank #{opponent.rank}</div>
                    </div>
                  </div>
                  <div className="text-rose-400 font-mono font-bold">{opponentProgress}%</div>
                </div>
                <div className="w-full bg-gray-900 rounded-full h-3 border border-gray-800 relative overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${opponentProgress}%` }}
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_15px_rgba(225,29,72,0.5)]"
                  />
                </div>
              </div>

            </div>

            {/* Battle Main Area */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gray-900/60 backdrop-blur-xl p-6 rounded-3xl border border-gray-800 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-cyan-400">Current Challenge</h3>
                  <span className="text-xs px-2 py-1 bg-violet-900/50 text-violet-300 rounded border border-violet-500/50">DSA: Arrays</span>
                </div>
                <div className="text-gray-300 text-sm leading-relaxed mb-6">
                  Write a function that reverses a linked list in O(N) time and O(1) space.
                </div>
                <div className="flex-1 flex flex-col justify-end">
                  <button 
                    onClick={handleSimulateSubmit}
                    className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-gray-950 font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:shadow-[0_0_25px_rgba(34,211,238,0.5)] flex items-center justify-center space-x-2"
                  >
                    <Terminal className="w-5 h-5" />
                    <span>Submit Solution</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {status === 'finished' && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center justify-center h-[60vh] space-y-6"
          >
            <div className="w-32 h-32 bg-amber-500/20 rounded-full flex items-center justify-center border-2 border-amber-400 shadow-[0_0_50px_rgba(251,191,36,0.6)]">
              <Trophy className="w-16 h-16 text-amber-400" />
            </div>
            <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">VICTORY</h2>
            <p className="text-gray-400 text-xl">+25 MMR</p>
            <button onClick={() => navigate('/')} className="mt-8 px-8 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-white font-bold transition">
              Return to Lobby
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
