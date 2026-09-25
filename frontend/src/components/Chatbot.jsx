import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Loader2, Bot, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { GoogleGenAI } from '@google/genai';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function Chatbot({ contextData, openSignal }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      role: 'model', 
      content: "Hello! I am your AI Technical Tutor powered by Gemini. Ask me about algorithms, cloud architecture, pseudocode, or any concept you need help breaking down!" 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (openSignal) {
      setIsOpen(true);
    }
  }, [openSignal]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    const updatedMessages = [...messages, { role: 'user', content: userText }];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("VITE_GEMINI_API_KEY is not defined in frontend .env.");
      }

      const ai = new GoogleGenAI({ apiKey });

      let contextPrompt = "";
      if (contextData) {
        contextPrompt = `\n\n[ACTIVE ASSESSMENT CONTEXT]: The candidate is currently reviewing this question:
Question: ${contextData.questionText}
Options: ${JSON.stringify(contextData.options || [])}
${contextData.explanation ? `Explanation: ${contextData.explanation}` : ''}
`;
      }

      const systemInstruction = `You are an elite, highly encouraging computer science technical tutor assisting an engineering student.
Provide crisp, deeply pedagogical explanations across Data Structures & Algorithms, Cloud & Distributed Systems, Computer Networks, Operating Systems, Database Management, and Pseudocode.
When answering questions about the active test question, guide the user's reasoning step-by-step with mathematical and architectural intuition rather than giving shallow answers. Keep responses structured and concise.`;

      // Build conversational memory contents for Gemini API
      // Ensure alternating user/model roles format
      const historyContents = updatedMessages.map((m, index) => {
        let text = m.content;
        // Inject context only into the latest user prompt
        if (index === updatedMessages.length - 1 && m.role === 'user') {
          text = text + contextPrompt;
        }
        return {
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text }]
        };
      });

      let responseText = "";
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: historyContents,
          config: {
            systemInstruction,
            temperature: 0.7
          }
        });
        responseText = response.text;
      } catch (geminiErr) {
        // Fallback to gemini-3.8-flash if 3.5 has temporary spike
        console.warn("Retrying with fallback model...", geminiErr);
        const retryResponse = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: historyContents,
          config: {
            systemInstruction,
            temperature: 0.7
          }
        });
        responseText = retryResponse.text;
      }

      setMessages(prev => [...prev, { role: 'model', content: responseText }]);
    } catch (error) {
      console.error("Chatbot Error:", error);
      setMessages(prev => [...prev, { 
        role: 'model', 
        content: `I encountered an issue connecting to Gemini AI: ${error.message}. Please verify your API key or network connection.` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xl dark:shadow-[0_0_20px_rgba(255,255,255,0.1)] border border-zinc-800 dark:border-zinc-200 flex items-center space-x-2 transition-transform duration-300 ease-out"
          >
            <MessageSquare className="w-6 h-6" />
            <span className="text-xs font-bold font-mono hidden md:inline pr-1">Ask AI Tutor</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Side Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[420px] z-50 bg-white/95 dark:bg-[#0a0d1d]/95 backdrop-blur-2xl border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col font-sans transition-colors duration-300"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-[#09090b]/80">
              <div className="flex items-center space-x-3">
                <div className="bg-zinc-200 dark:bg-zinc-800 p-2 rounded-xl border border-zinc-300 dark:border-zinc-700">
                  <Bot className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />
                </div>
                <div>
                  <h3 className="text-zinc-900 dark:text-white font-bold tracking-wide text-sm flex items-center space-x-1.5">
                    <span>Elite AI Tutor</span>
                    <Sparkles className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">Gemini 3.5 Live</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Context Badge if active question */}
            {contextData && (
              <div className="px-4 py-2 bg-zinc-100 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-600 dark:text-zinc-400 flex items-center justify-between">
                <span className="truncate max-w-[280px]">📌 Context: {contextData.questionText?.substring(0, 45)}...</span>
                <span className="font-mono text-zinc-500 dark:text-zinc-500 text-[10px] font-bold uppercase">Attached</span>
              </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/50 dark:bg-[#050711]/50">
              {messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={cn(
                    "flex w-full",
                    msg.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  <div className={cn(
                    "max-w-[85%] rounded-2xl p-4 text-xs md:text-sm leading-relaxed shadow-sm whitespace-pre-wrap transition-colors duration-300",
                    msg.role === 'user' 
                      ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-br-sm" 
                      : "bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 rounded-bl-sm border border-zinc-200 dark:border-zinc-800"
                  )}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex w-full justify-start">
                  <div className="bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 rounded-2xl rounded-bl-sm p-3.5 border border-zinc-200 dark:border-zinc-800 flex items-center space-x-2 text-xs font-mono shadow-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-900 dark:text-white" />
                    <span>Gemini is generating explanation...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-[#09090b]/90">
              <div className="relative flex items-end">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a technical question or follow-up..."
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-4 pr-12 text-xs md:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 resize-none min-h-[46px] max-h-[120px] transition-colors"
                  rows={1}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 bottom-2 p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 disabled:opacity-40 transition-colors shadow-sm"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="text-center mt-2 text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                Multimodal Conversational Memory Enabled
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
