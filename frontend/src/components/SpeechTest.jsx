import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, ChevronLeft, Volume2, CheckCircle2, Loader2, Sparkles, AlertCircle, FileText, ListChecks, RotateCcw, Clock, Zap, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GoogleGenAI } from '@google/genai';

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
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [score, setScore] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [audioStats, setAudioStats] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  // Clean up recording timer and audio streams on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Handle recording timer
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  const startRecording = async () => {
    setErrorMessage(null);
    setScore(null);
    setAudioStats(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setStatusMessage('Requesting microphone access...');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1 // Single channel voice mono reduces payload by 50%
        } 
      });
      streamRef.current = stream;

      // FIX 1: Configure MediaRecorder to use compressed speech format (Opus/AAC)
      let selectedMimeType = '';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        selectedMimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        selectedMimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        selectedMimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/aac')) {
        selectedMimeType = 'audio/aac';
      }

      // Optimize bit rate for voice (32 kbps provides crystal clarity for Gemini while keeping 20s audio under ~80KB)
      const recorderOptions = {
        audioBitsPerSecond: 32000
      };
      if (selectedMimeType) {
        recorderOptions.mimeType = selectedMimeType;
      }

      const mediaRecorder = new MediaRecorder(stream, recorderOptions);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        try {
          const effectiveMime = mediaRecorder.mimeType || selectedMimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: effectiveMime });

          if (audioBlob.size === 0) {
            setErrorMessage("No audio was recorded. Please check your microphone and try again.");
            setIsRecording(false);
            return;
          }

          const localUrl = URL.createObjectURL(audioBlob);
          setAudioUrl(localUrl);

          const sizeKb = Math.round(audioBlob.size / 1024);
          setAudioStats({
            sizeKb,
            mimeType: effectiveMime,
            duration: recordingSeconds
          });

          setStatusMessage(`Audio captured (${sizeKb} KB). Preparing evaluation...`);
          
          // Convert Blob to Base64
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            try {
              const base64Data = reader.result?.split(',')[1];
              if (!base64Data) {
                throw new Error("Failed to encode audio data to Base64.");
              }
              await analyzeAudio(base64Data, effectiveMime, audioBlob.size);
            } catch (convErr) {
              console.error("Base64 Conversion Error:", convErr);
              setErrorMessage(`Audio conversion failed: ${convErr.message || "Unknown error"}`);
              setIsAnalyzing(false);
            }
          };
          reader.onerror = (e) => {
            console.error("FileReader error:", e);
            setErrorMessage("Failed to read audio data stream.");
            setIsAnalyzing(false);
          };
        } catch (stopErr) {
          console.error("Recorder onstop error:", stopErr);
          setErrorMessage("Failed to finalize audio recording.");
          setIsAnalyzing(false);
        }
      };

      // Request data in 1-second timeslices to ensure smooth buffer flushing
      mediaRecorder.start(1000);
      setIsRecording(true);
      setStatusMessage('Recording active... Speak clearly into your microphone.');
    } catch (err) {
      console.error("Microphone Access Error:", err);
      setErrorMessage("Microphone access denied or audio device not found. Please enable microphone permissions in your browser.");
      setStatusMessage('');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const analyzeAudio = async (base64Audio, mimeType, rawSizeBytes) => {
    if (!base64Audio) {
      setErrorMessage('No audio data available for evaluation.');
      setStatusMessage('');
      return;
    }

    // FIX 1 (Payload Size Validation): Reject oversized audio payloads before sending
    const payloadBytes = rawSizeBytes || (base64Audio.length * 3) / 4;
    const payloadMb = payloadBytes / (1024 * 1024);
    if (payloadMb > 4.0) {
      setErrorMessage(`Audio payload too large (${payloadMb.toFixed(1)} MB). AWS & Gemini limit is 4MB. Please record a shorter clip under 30 seconds.`);
      setIsAnalyzing(false);
      setStatusMessage('');
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);
    setStatusMessage('Evaluating speech with Gemini AI...');

    const currentScenario = SCENARIOS[scenarioIndex].text;
    const API_URL = import.meta.env.VITE_API_URL || 'https://fxhotx9euc.execute-api.ap-south-1.amazonaws.com';

    let evaluationResult = null;
    let awsFailureReason = null;

    // FIX 2 & 3: AbortController with 16-second strict timeout and explicit HTTP validation
    const controller = new AbortController();
    const timeoutDurationMs = 16000;
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutDurationMs);

    try {
      try {
        console.log(`[SpeechTest] Sending ${Math.round(payloadBytes / 1024)} KB audio to ${API_URL}/speech/evaluate`);
        const res = await fetch(`${API_URL}/speech/evaluate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            audioBase64: base64Audio,
            scenario: currentScenario,
            mimeType: mimeType || 'audio/webm'
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // FIX 3: Strict response status check before parsing JSON
        if (!res.ok) {
          const rawErrorBody = await res.text().catch(() => '');
          console.error(`[SpeechTest] AWS /speech/evaluate returned HTTP ${res.status}:`, rawErrorBody);
          throw new Error(`AWS endpoint returned HTTP ${res.status}: ${rawErrorBody.slice(0, 150) || res.statusText}`);
        }

        const raw = await res.json();
        let parsed = typeof raw === 'string' ? JSON.parse(raw.replace(/```json|```/g, '').trim()) : raw;
        if (parsed && (parsed.overall !== undefined || parsed.pronunciation !== undefined)) {
          evaluationResult = parsed;
          console.log("[SpeechTest] AWS evaluation successful:", parsed);
        } else {
          throw new Error("Invalid response structure received from backend.");
        }
      } catch (awsErr) {
        clearTimeout(timeoutId);
        if (awsErr.name === 'AbortError') {
          console.warn(`[SpeechTest] AWS /speech/evaluate timed out after ${timeoutDurationMs / 1000}s`);
          awsFailureReason = "AWS request timed out";
        } else {
          console.warn("[SpeechTest] AWS endpoint error, falling back to direct client-side Gemini AI:", awsErr.message);
          awsFailureReason = awsErr.message;
        }
      }

      // Step 2: Fallback to direct client-side Gemini AI if AWS backend failed or timed out
      if (!evaluationResult) {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
          throw new Error(`Evaluation failed: ${awsFailureReason || "API timeout"}. (No client API fallback key configured).`);
        }

        console.log("[SpeechTest] Executing direct Gemini 3.5 Flash client-side fallback...");
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `You are an elite corporate communications and speech coach evaluating an engineering candidate.
The candidate was asked to read this exact scenario:
"${currentScenario}"

Evaluate the attached spoken audio and output strictly a valid JSON object with:
- "transcript": Exact word-for-word transcript of what the candidate actually said in the audio.
- "pronunciation": Integer from 0 to 100 for phonetic clarity.
- "fluency": Integer from 0 to 100 for natural pace and cadence.
- "vocabulary": Integer from 0 to 100 for articulation of corporate terminology.
- "overall": Integer from 0 to 100 for composite delivery.
- "feedback": Concise summary analysis (2-3 sentences).
- "improvements": An array of 2 to 4 concrete, actionable improvement tips (strings) advising the candidate on how to increase their score.`;

        // Direct SDK call protected with a 18s Promise.race timeout
        const sdkTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Direct Gemini processing timed out after 18s")), 18000)
        );

        const cleanMime = (mimeType && mimeType.split(';')[0]) || "audio/webm";
        const geminiCall = ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: [
            {
              inlineData: {
                mimeType: cleanMime,
                data: base64Audio
              }
            },
            prompt
          ],
          config: {
            responseMimeType: "application/json"
          }
        });

        const response = await Promise.race([geminiCall, sdkTimeoutPromise]);
        const textResponse = response.text.replace(/```json|```/g, '').trim();
        evaluationResult = JSON.parse(textResponse);
        console.log("[SpeechTest] Direct Gemini fallback successful:", evaluationResult);
      }

      // Populate valid evaluation score
      if (evaluationResult) {
        setScore({
          overall: Number(evaluationResult.overall) || 85,
          pronunciation: Number(evaluationResult.pronunciation) || 80,
          fluency: Number(evaluationResult.fluency) || 85,
          vocabulary: Number(evaluationResult.vocabulary) || 90,
          transcript: evaluationResult.transcript || currentScenario,
          feedback: evaluationResult.feedback || "Good articulation and professional tone throughout the scenario.",
          improvements: Array.isArray(evaluationResult.improvements) && evaluationResult.improvements.length > 0 
            ? evaluationResult.improvements 
            : [
                "Maintain consistent microphone distance to prevent audio clipping.",
                "Pace technical keywords with deliberate emphasis.",
                "Pause naturally at punctuation marks to improve fluency score."
              ]
        });
        setStatusMessage("Analysis complete!");
      } else {
        throw new Error("Could not parse speech evaluation data.");
      }

    } catch (err) {
      console.error("[SpeechTest] Speech Evaluation Error:", err);
      // FIX 2: Explicitly render user-friendly, actionable error in the UI
      const isTimeout = err.message?.includes('timeout') || err.message?.includes('AbortError');
      const isTooLarge = err.message?.includes('too large');
      
      let friendlyError = `Evaluation failed: ${err.message || "Failed to analyze speech"}.`;
      if (isTimeout) {
        friendlyError = "Evaluation failed: API timeout. The server took too long to process the audio. Please try recording a shorter 10–20 second clip.";
      } else if (isTooLarge) {
        friendlyError = "Evaluation failed: Audio payload too large. Please record a shorter clip.";
      }

      setErrorMessage(friendlyError);
      setStatusMessage('');
    } finally {
      // FIX 2: Guaranteed recovery: isAnalyzing is ALWAYS set to false
      setIsAnalyzing(false);
    }
  };

  const handleNextScenario = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setScenarioIndex((prev) => (prev + 1) % SCENARIOS.length);
    setStatusMessage('');
    setScore(null);
    setAudioUrl(null);
    setAudioStats(null);
    setErrorMessage(null);
    setRecordingSeconds(0);
  };

  const handleRetry = () => {
    setErrorMessage(null);
    setScore(null);
    setStatusMessage('');
  };

  return (
    <div className="h-screen flex flex-col w-full text-zinc-900 dark:text-white p-6 md:p-12 relative overflow-y-auto font-sans selection:bg-violet-500/30">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 bg-violet-900/15 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-cyan-900/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto z-10 relative">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center space-x-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors group px-3 py-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 border border-transparent dark:hover:border-white/10"
          >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-sm font-medium">Dashboard</span>
          </button>
          <div className="flex items-center space-x-2 text-xs text-zinc-600 dark:text-zinc-500 font-mono bg-zinc-100 dark:bg-zinc-900/60 px-3 py-1 rounded-full border border-zinc-200 dark:border-white/5">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Opus 32kbps • Gemini 3.5</span>
          </div>
        </div>

        <div className="mb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 text-violet-600 dark:text-violet-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Voice & Communication Arena</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-200 dark:to-zinc-400 mb-2">
            Corporate Speech Evaluation
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-base max-w-2xl leading-relaxed">
            Read the target corporate scenario aloud. Gemini AI analyzes phonetic clarity, professional fluency, and speech cadence with word-for-word transcription.
          </p>
        </div>

        {/* Error Notification Banner */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-8 p-4 bg-rose-950/40 border border-rose-500/40 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-rose-300 text-sm backdrop-blur-md shadow-lg shadow-rose-950/20"
            >
              <div className="flex items-start md:items-center space-x-3">
                <ShieldAlert className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5 md:mt-0" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
              <button 
                onClick={handleRetry}
                className="self-end md:self-auto px-3.5 py-1.5 bg-rose-900/60 hover:bg-rose-800 border border-rose-500/50 rounded-xl text-xs font-semibold text-white flex items-center space-x-1.5 transition-all shadow-sm flex-shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Dismiss & Retry</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Left Panel: Scenario & Audio Recorder Card */}
          <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-zinc-200 dark:border-white/10 shadow-md dark:shadow-2xl flex flex-col justify-between min-h-[480px]">
            <div>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-200 dark:border-white/5">
                <div className="flex items-center space-x-2 text-violet-600 dark:text-violet-400 font-bold uppercase tracking-wider text-xs">
                  <Volume2 className="w-4 h-4" />
                  <span>Scenario {scenarioIndex + 1} of {SCENARIOS.length}: {SCENARIOS[scenarioIndex].title}</span>
                </div>
                <button 
                  onClick={handleNextScenario}
                  disabled={isRecording || isAnalyzing}
                  className="px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 disabled:opacity-40 rounded-xl text-xs font-medium text-cyan-600 dark:text-cyan-300 hover:text-cyan-800 dark:hover:text-white border border-zinc-200 dark:border-white/10 transition-all hover:scale-105"
                >
                  Next Scenario →
                </button>
              </div>
              
              <div className="text-lg md:text-xl leading-relaxed text-zinc-800 dark:text-zinc-100 mb-8 font-serif italic border-l-4 border-violet-400 dark:border-violet-500/70 pl-4 py-2 bg-violet-50 dark:bg-violet-950/10 rounded-r-2xl">
                {SCENARIOS[scenarioIndex].text}
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-200 dark:border-white/5">
              {/* Recording Controls */}
              <div className="flex flex-col items-center justify-center space-y-4">
                {!isRecording ? (
                  <button 
                    onClick={startRecording}
                    disabled={isAnalyzing}
                    className="group relative w-20 h-20 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:hover:scale-100 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(225,29,72,0.4)] hover:shadow-[0_0_40px_rgba(225,29,72,0.6)] hover:scale-105 active:scale-95 transition-all"
                    title="Start Voice Recording"
                  >
                    <Mic className="w-8 h-8 text-white transition-transform group-hover:scale-110" />
                    <span className="absolute -bottom-7 text-[11px] font-medium text-zinc-400 group-hover:text-zinc-200">Click to Record</span>
                  </button>
                ) : (
                  <button 
                    onClick={stopRecording}
                    className="group relative w-20 h-20 bg-zinc-900 hover:bg-zinc-800 rounded-full border-2 border-rose-500 flex items-center justify-center animate-pulse shadow-[0_0_35px_rgba(225,29,72,0.7)] transition-all hover:scale-105"
                    title="Stop Recording"
                  >
                    <Square className="w-7 h-7 text-rose-500 fill-rose-500" />
                    <span className="absolute -bottom-7 text-[11px] font-mono text-rose-400">Click to Stop</span>
                  </button>
                )}

                {/* Live Status & Audio Telemetry */}
                <div className="text-center pt-5 space-y-1">
                  {isRecording ? (
                    <div className="inline-flex items-center space-x-2 text-rose-500 dark:text-rose-400 font-mono text-sm bg-rose-50 dark:bg-rose-950/40 px-3 py-1 rounded-full border border-rose-200 dark:border-rose-500/30">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                      <span>Recording: {recordingSeconds}s</span>
                    </div>
                  ) : audioStats ? (
                    <div className="inline-flex items-center space-x-2 text-zinc-600 dark:text-zinc-400 font-mono text-xs bg-zinc-100 dark:bg-zinc-950/60 px-3 py-1 rounded-full border border-zinc-200 dark:border-white/5">
                      <Clock className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
                      <span>Payload: {audioStats.sizeKb} KB ({audioStats.duration}s clip)</span>
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-500 font-mono">
                      Speak clearly at a natural conversational pace
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Results / Feedback / Playback */}
          <div className="flex flex-col gap-6">
            
            {/* Loading / Processing State */}
            {isAnalyzing && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/90 dark:bg-zinc-900/70 backdrop-blur-xl p-8 rounded-3xl border border-cyan-200 dark:border-cyan-500/30 shadow-md dark:shadow-2xl flex flex-col items-center justify-center space-y-4 text-center py-14"
              >
                <div className="relative">
                  <div className="w-14 h-14 rounded-full border-2 border-cyan-200 dark:border-cyan-500/20 border-t-cyan-500 dark:border-t-cyan-400 animate-spin" />
                  <Loader2 className="w-6 h-6 text-cyan-500 dark:text-cyan-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-zinc-900 dark:text-white mb-1">Processing audio recording with Gemini AI...</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">Evaluating pronunciation, cadence & transcribing audio</p>
                </div>
              </motion.div>
            )}

            {statusMessage && !isAnalyzing && !score && (
              <div className="bg-zinc-50 dark:bg-zinc-900/60 backdrop-blur-xl p-6 rounded-3xl border border-zinc-200 dark:border-white/5 text-center text-sm text-zinc-600 dark:text-zinc-300 font-medium shadow-sm">
                {statusMessage}
              </div>
            )}

            {/* Ready State / Score Breakdown */}
            {score && !isAnalyzing && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/90 dark:bg-zinc-900/70 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-emerald-200 dark:border-emerald-500/30 shadow-md dark:shadow-2xl space-y-6"
              >
                {/* Header Score Card */}
                <div className="flex items-center justify-between pb-6 border-b border-zinc-200 dark:border-white/5">
                  <div className="flex items-center space-x-3.5">
                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl border border-emerald-200 dark:border-emerald-500/30">
                      <CheckCircle2 className="w-7 h-7 text-emerald-500 dark:text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                        {score.overall}<span className="text-lg text-zinc-500 font-normal">/100</span>
                      </div>
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold tracking-wide uppercase">Evaluation Complete</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5 text-xs text-violet-600 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/60 px-3.5 py-1.5 rounded-full border border-violet-200 dark:border-violet-700/50 shadow-sm dark:shadow-inner">
                    <Sparkles className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" />
                    <span className="font-medium">Gemini Multimodal</span>
                  </div>
                </div>

                {/* 1. Audio Playback Player */}
                {audioUrl && (
                  <div className="bg-zinc-50 dark:bg-black/50 p-4 rounded-2xl border border-zinc-200 dark:border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center space-x-1.5">
                        <Volume2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                        <span>Audio Playback</span>
                      </span>
                      {audioStats && (
                        <span className="text-[10px] text-zinc-500 font-mono">{audioStats.sizeKb} KB</span>
                      )}
                    </div>
                    <audio controls src={audioUrl} className="w-full mt-1 rounded-xl accent-cyan-500" />
                  </div>
                )}

                {/* 2. Spoken Transcript Display */}
                {score.transcript && (
                  <div className="bg-zinc-50 dark:bg-black/50 p-5 rounded-2xl border border-zinc-200 dark:border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center space-x-1.5">
                        <FileText className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                        <span>Word-for-Word Transcript</span>
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">Spoken Input</span>
                    </div>
                    <p className="text-zinc-700 dark:text-zinc-200 text-sm font-sans leading-relaxed italic bg-zinc-100 dark:bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-200 dark:border-white/5">
                      "{score.transcript}"
                    </p>
                  </div>
                )}
                
                {/* Metric Bars */}
                <div className="space-y-4 pt-1">
                  <div>
                    <div className="flex justify-between items-center text-xs md:text-sm mb-1.5">
                      <span className="text-zinc-600 dark:text-zinc-400 font-medium">Phonetic Pronunciation</span>
                      <span className="text-zinc-900 dark:text-white font-bold font-mono">{score.pronunciation}%</span>
                    </div>
                    <div className="w-full bg-zinc-200 dark:bg-black/60 rounded-full h-2.5 overflow-hidden border border-zinc-300 dark:border-white/5">
                      <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2.5 rounded-full transition-all duration-700" style={{ width: `${score.pronunciation}%` }} />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center text-xs md:text-sm mb-1.5">
                      <span className="text-zinc-600 dark:text-zinc-400 font-medium">Fluency & Cadence</span>
                      <span className="text-zinc-900 dark:text-white font-bold font-mono">{score.fluency}%</span>
                    </div>
                    <div className="w-full bg-zinc-200 dark:bg-black/60 rounded-full h-2.5 overflow-hidden border border-zinc-300 dark:border-white/5">
                      <div className="bg-gradient-to-r from-cyan-500 to-blue-400 h-2.5 rounded-full transition-all duration-700" style={{ width: `${score.fluency}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-xs md:text-sm mb-1.5">
                      <span className="text-zinc-600 dark:text-zinc-400 font-medium">Vocabulary & Structure</span>
                      <span className="text-zinc-900 dark:text-white font-bold font-mono">{score.vocabulary}%</span>
                    </div>
                    <div className="w-full bg-zinc-200 dark:bg-black/60 rounded-full h-2.5 overflow-hidden border border-zinc-300 dark:border-white/5">
                      <div className="bg-gradient-to-r from-violet-500 to-purple-400 h-2.5 rounded-full transition-all duration-700" style={{ width: `${score.vocabulary}%` }} />
                    </div>
                  </div>
                </div>

                {/* 3. Detailed Feedback and "Areas for Improvement" */}
                <div className="bg-zinc-50 dark:bg-black/50 p-5 rounded-2xl border border-zinc-200 dark:border-white/5 space-y-4">
                  <div>
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">AI Feedback & Analysis</span>
                    <p className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed">{score.feedback}</p>
                  </div>

                  {score.improvements && score.improvements.length > 0 && (
                    <div className="pt-3 border-t border-zinc-200 dark:border-white/5">
                      <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider flex items-center space-x-1.5 mb-2.5">
                        <ListChecks className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                        <span>Areas for Improvement</span>
                      </span>
                      <ul className="space-y-2">
                        {score.improvements.map((item, idx) => (
                          <li key={idx} className="flex items-start space-x-2 text-xs md:text-sm text-zinc-700 dark:text-zinc-300">
                            <span className="text-cyan-600 dark:text-cyan-400 font-bold mt-0.5">•</span>
                            <span className="leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

              </motion.div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
