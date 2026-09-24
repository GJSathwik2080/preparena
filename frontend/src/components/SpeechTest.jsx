import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mic, Square, Play, ChevronLeft, Volume2, CheckCircle2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SCENARIOS = [
  {
    title: "Client Escalation",
    text: '"We understand that the recent deployment caused unexpected downtime. Our engineering team has identified the root cause in the database migration script, and we are currently rolling back to the previous stable state. We expect full service restoration within the next fifteen minutes."'
  },
  {
    title: "Architecture Pitch",
    text: '"Our proposed transition to a serverless architecture will significantly reduce operational overhead and improve scalability. By leveraging AWS Lambda and DynamoDB, we can handle unpredictable traffic spikes while only paying for actual compute usage, ultimately optimizing our cloud expenditures."'
  },
  {
    title: "Team Conflict Resolution",
    text: '"I noticed we have different perspectives on the API design approach. While the RESTful approach offers simplicity, the GraphQL alternative gives our frontend team the flexibility they need. Let\'s schedule a brief sync to evaluate the trade-offs and align on a unified strategy."'
  },
  {
    title: "Project Delay Update",
    text: '"Due to unforeseen complexities in integrating the third-party payment gateway, our current sprint deliverables are at risk. We have re-prioritized our backlog to mitigate the impact and will provide a revised timeline during tomorrow\'s daily standup."'
  },
  {
    title: "Performance Review",
    text: '"Over the past quarter, I have successfully reduced our application bundle size by thirty percent through aggressive code splitting and asset optimization. I am now looking to expand my responsibilities by mentoring junior developers and leading our upcoming migration to a new state management library."'
  }
];

export default function SpeechTest() {
  const navigate = useNavigate();
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [score, setScore] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const recognitionRef = useRef(null);

  const startRecording = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Your browser does not support the Web Speech API. Please use Chrome.");
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;

    recognitionRef.current.onresult = (event) => {
      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      setTranscript(prev => prev + currentTranscript);
    };

    recognitionRef.current.start();
    setIsRecording(true);
    setTranscript('');
    setScore(null);
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const analyzeAudio = async () => {
    if (!transcript) return;
    setIsAnalyzing(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'https://mock.execute-api.us-east-1.amazonaws.com';
      const res = await fetch(`${API_URL}/speech/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: transcript })
      });
      const data = await res.json();
      setScore(data);
    } catch (err) {
      console.error(err);
      alert('Failed to evaluate speech. ' + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 md:p-12 relative overflow-y-auto font-sans">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-violet-900/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto z-10 relative">
        <button onClick={() => navigate('/')} className="flex items-center space-x-2 text-gray-400 hover:text-white mb-8 transition">
          <ChevronLeft className="w-5 h-5" />
          <span>Back to Dashboard</span>
        </button>

        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400 mb-2">Communication Engine</h1>
        <p className="text-gray-400 mb-12">Read the scenario aloud. AI will evaluate your fluency, pronunciation, and vocabulary.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <div className="bg-gray-900/60 backdrop-blur-xl p-8 rounded-3xl border border-gray-800 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2 text-violet-400 font-bold uppercase tracking-wider text-sm">
                <Volume2 className="w-5 h-5" />
                <span>Scenario {scenarioIndex + 1}: {SCENARIOS[scenarioIndex].title}</span>
              </div>
              <button 
                onClick={() => {
                  setScenarioIndex((prev) => (prev + 1) % SCENARIOS.length);
                  setTranscript('');
                  setScore(null);
                }}
                className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs text-gray-300 transition"
              >
                Next Scenario
              </button>
            </div>
            
            <div className="text-2xl leading-relaxed text-gray-200 mb-8 font-serif italic">
              {SCENARIOS[scenarioIndex].text}
            </div>

            <div className="flex items-center justify-center space-x-6">
              {!isRecording ? (
                <button 
                  onClick={startRecording}
                  className="w-20 h-20 bg-rose-600 hover:bg-rose-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(225,29,72,0.4)] hover:shadow-[0_0_30px_rgba(225,29,72,0.6)] transition-all"
                >
                  <Mic className="w-8 h-8 text-white" />
                </button>
              ) : (
                <button 
                  onClick={stopRecording}
                  className="w-20 h-20 bg-gray-800 hover:bg-gray-700 rounded-full border-2 border-rose-500 flex items-center justify-center animate-pulse shadow-[0_0_30px_rgba(225,29,72,0.6)] transition-all"
                >
                  <Square className="w-8 h-8 text-rose-500" />
                </button>
              )}
            </div>
            <div className="text-center mt-4 text-sm text-gray-500">
              {isRecording ? "Recording in progress..." : "Click to start recording"}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {transcript && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-900/60 backdrop-blur-xl p-6 rounded-3xl border border-gray-800"
              >
                <h3 className="text-lg font-bold text-white mb-4">Live Transcript & Analysis</h3>
                <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 text-gray-300 min-h-[100px] mb-6 whitespace-pre-wrap">
                  {transcript || "Listening..."}
                </div>
                
                <button 
                  onClick={analyzeAudio}
                  disabled={isAnalyzing || score || isRecording}
                  className="w-full bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all shadow-lg flex justify-center items-center"
                >
                  {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                  {isAnalyzing ? "Processing Audio via AI..." : "Analyze Transcript"}
                </button>
              </motion.div>
            )}

            {score && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-950/20 backdrop-blur-xl p-8 rounded-3xl border border-emerald-900/40"
              >
                <div className="flex items-center space-x-3 mb-6">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  <h3 className="text-2xl font-bold text-white">Score: {score.overall}/100</h3>
                </div>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Pronunciation</span>
                    <span className="text-white font-bold">{score.pronunciation}</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${score.pronunciation}%` }}></div>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm pt-2">
                    <span className="text-gray-400">Fluency</span>
                    <span className="text-white font-bold">{score.fluency}</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${score.fluency}%` }}></div>
                  </div>

                  <div className="flex justify-between items-center text-sm pt-2">
                    <span className="text-gray-400">Vocabulary</span>
                    <span className="text-white font-bold">{score.vocabulary}</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${score.vocabulary}%` }}></div>
                  </div>
                </div>

                <div className="bg-emerald-900/20 p-4 rounded-xl border border-emerald-900/30">
                  <p className="text-emerald-300 text-sm leading-relaxed">{score.feedback}</p>
                </div>
              </motion.div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
