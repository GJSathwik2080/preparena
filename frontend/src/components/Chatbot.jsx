import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Loader2, Bot } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { GoogleGenAI } from '@google/genai';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function Chatbot({ contextData, openSignal }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'model', content: "Hello! I'm your Elite Technical Tutor. How can I help you dominate this assessment?" }
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
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      let contextString = "";
      if (contextData) {
        contextString = `\n\n[CURRENT TEST CONTEXT]: The user is currently viewing this question:\nQuestion: ${contextData.questionText}\nOptions: ${JSON.stringify(contextData.options)}\n`;
      }

      const systemPrompt = "You are an elite technical tutor helping a final-year Computer Science student prepare for rigorous software engineering campus placements. Guide the user to the correct logic across topics like Data Structures, DBMS, Cloud, Operating Systems, and Pseudocode without just giving them the raw answer immediately. Be concise, mathematically accurate, and pedagogical.";

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("VITE_GEMINI_API_KEY is not set in your .env file.");
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const contents = [
        ...messages.map(m => ({
          role: m.role,
          parts: [{ text: m.content }]
        })),
        {
          role: 'user',
          parts: [{ text: userMessage + contextString }]
        }
      ];

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7
        }
      });

      const botReply = response.text;
      setMessages(prev => [...prev, { role: 'model', content: botReply }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'model', content: `Error: ${error.message}` }]);
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
            whileHover={{ scale: 1.1, boxShadow: "0px 0px 20px rgba(34,211,238,0.6)" }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-2xl border border-cyan-400/50"
          >
            <MessageSquare className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[400px] z-50 bg-gray-950/90 backdrop-blur-xl border-l border-cyan-500/30 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900/50">
              <div className="flex items-center space-x-3">
                <div className="bg-cyan-500/20 p-2 rounded-lg border border-cyan-500/50">
                  <Bot className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold tracking-wider">Elite Tutor AI</h3>
                  <p className="text-xs text-cyan-400 animate-pulse">Online & Ready</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={cn(
                    "flex w-full",
                    msg.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  <div className={cn(
                    "max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-lg",
                    msg.role === 'user' 
                      ? "bg-violet-600 text-white rounded-br-sm border border-violet-500" 
                      : "bg-gray-800 text-gray-200 rounded-bl-sm border border-gray-700"
                  )}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex w-full justify-start">
                  <div className="bg-gray-800 text-cyan-400 rounded-2xl rounded-bl-sm p-4 border border-cyan-500/30 flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm font-mono">Analyzing context...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-800 bg-gray-900/80">
              <div className="relative flex items-end">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask for an explanation..."
                  className="w-full bg-gray-950 border border-gray-700 rounded-xl py-3 pl-4 pr-12 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none min-h-[50px] max-h-[150px]"
                  rows={1}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 bottom-2 p-2 rounded-lg bg-cyan-600 text-white hover:bg-cyan-500 disabled:opacity-50 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="text-center mt-2 text-[10px] text-gray-600 uppercase tracking-widest font-bold">
                Powered by Gemini
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
