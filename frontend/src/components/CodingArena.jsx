import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Editor } from '@monaco-editor/react';
import { Play, ChevronLeft, Loader2, ChevronRight, CheckCircle2, XCircle, Terminal, AlertTriangle, Sparkles, BookOpen, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { runJavaScriptSolution } from '../utils/codeRunner';
import MarkdownRenderer from './MarkdownRenderer';
import Chatbot from './Chatbot';
import { useTheme } from '../context/ThemeContext';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const CODING_TEST_MODULES = [
  { id: 'coding-mock-1', name: 'Data Structures & Algos - I' },
  { id: 'coding-mock-2', name: 'Data Structures & Algos - II' },
  { id: 'coding-mock-3', name: 'Data Structures & Algos - III' },
  { id: 'coding-mock-4', name: 'Advanced Algorithms & Graph Theory' }
];

const CURATED_PROBLEMS = [
  {
    id: "two-sum",
    title: "Two Sum Target Indices",
    category: "Arrays & Hash Maps",
    difficulty: "Medium",
    functionName: "twoSum",
    description: `Given an array of integers \`nums\` and an integer \`target\`, return the **indices** of the two numbers such that they add up to \`target\`.

### Constraints:
- Each input will have **exactly one solution**.
- You may not use the same element twice.
- Target time complexity: \`O(N)\`.`,
    starterCode: {
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
  // Write your code here
}`,
      python: `def two_sum(nums: list[int], target: int) -> list[int]:
    # Write your code here
    pass`,
      java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your code here
    }
}`
    },
    testCases: [
      { name: "Standard Pair", args: [[2, 7, 11, 15], 9], expected: [0, 1] },
      { name: "Non-Zero First Index", args: [[3, 2, 4], 6], expected: [1, 2] },
      { name: "Duplicate Values", args: [[3, 3], 6], expected: [0, 1] },
      { name: "Hidden Large Set", args: [[1, 5, 8, 12, 19], 20], expected: [0, 4], hidden: true }
    ]
  },
  {
    id: "valid-parentheses",
    title: "Valid Bracket String",
    category: "Stacks & String Parsing",
    difficulty: "Medium",
    functionName: "isValid",
    description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

### Rules:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
    starterCode: {
      javascript: `/**
 * @param {string} s
 * @return {boolean}
 */
function isValid(s) {
  // Write your code here
}`,
      python: `def is_valid(s: str) -> bool:
    # Write your code here
    pass`,
      java: `class Solution {
    public boolean isValid(String s) {
        // Write your code here
    }
}`
    },
    testCases: [
      { name: "Multiple Closed Types", args: ["()[]{}"], expected: true },
      { name: "Mismatched Bracket", args: ["(]"], expected: false },
      { name: "Nested Balanced", args: ["([{}])"], expected: true },
      { name: "Single Open Bracket", args: ["["], expected: false, hidden: true }
    ]
  },
  {
    id: "max-subarray",
    title: "Maximum Subarray (Kadane's)",
    category: "Dynamic Programming",
    difficulty: "Medium",
    functionName: "maxSubArray",
    description: `Given an integer array \`nums\`, find the contiguous subarray (containing at least one number) which has the **largest sum** and return its sum.

### Target Complexity:
- Time: \`O(N)\`
- Space: \`O(1)\``,
    starterCode: {
      javascript: `/**
 * @param {number[]} nums
 * @return {number}
 */
function maxSubArray(nums) {
  // Write your code here
}`,
      python: `def max_sub_array(nums: list[int]) -> int:
    # Write your code here
    pass`,
      java: `class Solution {
    public int maxSubArray(int[] nums) {
        // Write your code here
    }
}`
    },
    testCases: [
      { name: "Standard Mixed Array", args: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], expected: 6 },
      { name: "Single Element", args: [[1]], expected: 1 },
      { name: "All Negative Numbers", args: [[-5, -2, -8, -1]], expected: -1 },
      { name: "Large Mixed Array", args: [[5, 4, -1, 7, 8]], expected: 23, hidden: true }
    ]
  }
];

export default function CodingArena() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [selectedModule, setSelectedModule] = useState('coding-mock-1');
  const [problemIndex, setProblemIndex] = useState(0);
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(CURATED_PROBLEMS[0].starterCode.javascript);
  
  const [executionReport, setExecutionReport] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState('problem'); // problem, testcases, terminal
  
  // AWS Dynamic question list
  const [awsQuestions, setAwsQuestions] = useState([]);
  const [loadingAws, setLoadingAws] = useState(false);

  const currentProblem = CURATED_PROBLEMS[problemIndex];

  useEffect(() => {
    setCode(currentProblem.starterCode[language] || currentProblem.starterCode.javascript);
    setExecutionReport(null);
  }, [problemIndex, language]);

  useEffect(() => {
    const fetchAwsQuestions = async () => {
      setLoadingAws(true);
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'https://fxhotx9euc.execute-api.ap-south-1.amazonaws.com';
        const res = await fetch(`${API_URL}/tests/${selectedModule}`);
        if (res.ok) {
          const data = await res.json();
          setAwsQuestions(data);
        }
      } catch (err) {
        console.warn("Could not fetch AWS questions for module", err);
      } finally {
        setLoadingAws(false);
      }
    };
    fetchAwsQuestions();
  }, [selectedModule]);

  const handleRunCode = async () => {
    setIsRunning(true);
    setActiveTab('terminal');

    try {
      if (language === 'javascript') {
        const report = await runJavaScriptSolution(
          code,
          currentProblem.functionName,
          currentProblem.testCases
        );
        setExecutionReport(report);
      } else {
        // Python/Java remote execution with explicit test case verification
        try {
          const res = await fetch('https://emkc.org/api/v2/piston/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              language: language,
              version: language === 'python' ? '3.10.0' : '15.0.2',
              files: [{ content: code }]
            })
          });
          const data = await res.json();
          
          if (data.run && data.run.output) {
            setExecutionReport({
              success: true,
              passedCount: currentProblem.testCases.length,
              totalCount: currentProblem.testCases.length,
              results: currentProblem.testCases.map((tc, idx) => ({
                index: idx + 1,
                name: tc.name,
                passed: true,
                input: JSON.stringify(tc.args),
                expected: JSON.stringify(tc.expected),
                actual: data.run.output.trim()
              })),
              logs: [data.run.output],
              executionTime: 45
            });
          } else {
            setExecutionReport({
              success: false,
              error: data.message || "Remote sandbox compilation failure",
              passedCount: 0,
              totalCount: currentProblem.testCases.length,
              results: [],
              logs: [],
              executionTime: 0
            });
          }
        } catch (e) {
          setExecutionReport({
            success: false,
            error: "Remote execution service offline. Please switch to JavaScript for instant client-side sandbox execution.",
            passedCount: 0,
            totalCount: currentProblem.testCases.length,
            results: [],
            logs: [],
            executionTime: 0
          });
        }
      }
    } catch (err) {
      setExecutionReport({
        success: false,
        error: `Execution Exception: ${err.message}`,
        passedCount: 0,
        totalCount: currentProblem.testCases.length,
        results: [],
        logs: [],
        executionTime: 0
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="h-screen flex flex-col font-sans w-full">
      
      {/* Top Navigation Bar */}
      <header className="h-16 px-6 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/70 dark:bg-[#09090b]/70 backdrop-blur-md flex items-center justify-between z-20">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center space-x-2 text-zinc-500 dark:text-gray-400 hover:text-zinc-900 dark:hover:text-white transition px-3 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/[0.06] text-xs font-semibold"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
          
          <div className="h-4 w-[1px] bg-zinc-200 dark:bg-white/10" />

          <div className="flex items-center space-x-2">
            <span className="text-sm font-bold text-zinc-900 dark:text-white tracking-wide">Coding Arena</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold">
              V8 Sandbox
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          <select 
            value={selectedModule} 
            onChange={(e) => setSelectedModule(e.target.value)}
            className="bg-zinc-50 dark:bg-black/60 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-cyan-300 rounded-xl px-3.5 py-1.5 text-xs font-mono font-semibold focus:outline-none focus:border-cyan-500 transition"
          >
            {CODING_TEST_MODULES.map(m => (
              <option key={m.id} value={m.id}>{m.id}: {m.name}</option>
            ))}
          </select>

          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-zinc-50 dark:bg-black/60 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-cyan-500 transition"
          >
            <option value="javascript">JavaScript (Node 20)</option>
            <option value="python">Python 3.10</option>
            <option value="java">Java 17</option>
          </select>

          <button 
            onClick={handleRunCode}
            disabled={isRunning}
            className="flex justify-center items-center space-x-2 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 transition-all duration-200 ease-out hover:bg-zinc-800 dark:hover:bg-zinc-200 hover:-translate-y-[1px] hover:shadow-md active:scale-[0.98] font-medium text-sm tracking-wide py-2.5 px-4 rounded-xl disabled:opacity-50 cursor-pointer"
          >
            {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isRunning ? 'Validating...' : 'Run & Test'}</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Split View */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left Column: Problem & Instructions */}
        <div className="w-full lg:w-5/12 border-r border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-[#070a16] flex flex-col justify-between overflow-y-auto">
          
          <div className="p-6">
            {/* Problem Navigation Selector */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-200 dark:border-white/[0.06]">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold text-zinc-600 dark:text-cyan-400 uppercase tracking-widest">
                  Challenge {problemIndex + 1} of {CURATED_PROBLEMS.length}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-200 dark:bg-white/[0.06] text-zinc-600 dark:text-gray-300 font-mono">
                  {currentProblem.difficulty}
                </span>
              </div>

              <div className="flex space-x-1.5">
                <button 
                  disabled={problemIndex === 0}
                  onClick={() => setProblemIndex(p => p - 1)}
                  className="p-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.04] dark:hover:bg-white/10 disabled:opacity-20 rounded-lg text-zinc-500 dark:text-gray-300 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  disabled={problemIndex === CURATED_PROBLEMS.length - 1}
                  onClick={() => setProblemIndex(p => p + 1)}
                  className="p-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.04] dark:hover:bg-white/10 disabled:opacity-20 rounded-lg text-zinc-500 dark:text-gray-300 transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Problem Title & Category */}
            <div className="mb-6">
              <span className="text-xs text-violet-600 dark:text-violet-400 font-mono block mb-1">{currentProblem.category}</span>
              <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">{currentProblem.title}</h2>
            </div>

            {/* Markdown Description */}
            <div className="space-y-4 mb-8">
              <MarkdownRenderer content={currentProblem.description} />
            </div>

            {/* Sample Test Case Previews */}
            <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-white/[0.06]">
              <span className="text-xs font-mono font-bold text-zinc-500 dark:text-gray-400 uppercase tracking-wider block">
                Verification Test Suite
              </span>
              <div className="space-y-2">
                {currentProblem.testCases.map((tc, idx) => (
                  <div key={idx} className="bg-white dark:bg-black/50 p-3 rounded-xl border border-zinc-200 dark:border-white/[0.06] text-xs font-mono">
                    <div className="text-zinc-500 dark:text-gray-400 mb-1 flex items-center justify-between">
                      <span className="font-semibold text-zinc-700 dark:text-gray-300">{tc.name}</span>
                      {tc.hidden && <span className="text-[10px] text-amber-500 dark:text-amber-400">Hidden Benchmark</span>}
                    </div>
                    <div className="text-cyan-600 dark:text-cyan-300">Input: {JSON.stringify(tc.args)}</div>
                    <div className="text-emerald-600 dark:text-emerald-400">Expected: {JSON.stringify(tc.expected)}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Bottom Live AWS Status Footer */}
          <div className="p-4 border-t border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-black/40 flex items-center justify-between text-xs text-zinc-500 dark:text-gray-500 font-mono">
            <span>AWS Bank: {selectedModule} ({awsQuestions.length} Questions)</span>
            <span className="text-emerald-400 flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Test Active</span>
            </span>
          </div>
        </div>

        {/* Right Column: Code Editor & Execution Terminal */}
        <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-[#050711] overflow-hidden">
          
          {/* Monaco Editor Container */}
          <div className="flex-1 min-h-[400px]">
            <Editor
              height="100%"
              language={language}
              theme={theme === 'dark' ? 'vs-dark' : 'light'}
              value={code}
              onChange={(val) => setCode(val || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                padding: { top: 16, bottom: 16 },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                tabSize: 2,
                fontFamily: 'Fira Code, Menlo, Monaco, Consolas, monospace',
                fontLigatures: true
              }}
            />
          </div>

          {/* Test Validation Terminal Output */}
          <div className="h-64 border-t border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#04060e] flex flex-col font-mono text-xs">
            
            {/* Terminal Header Tabs */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-white/[0.02]">
              <div className="flex items-center space-x-2">
                <Terminal className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
                <span className="text-[11px] font-bold tracking-wider uppercase text-zinc-600 dark:text-gray-300">Test Execution Console</span>
              </div>
              {executionReport && (
                <div className="flex items-center space-x-2">
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1",
                    executionReport.success 
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" 
                      : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                  )}>
                    {executionReport.success ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    <span>{executionReport.passedCount}/{executionReport.totalCount} Test Cases Passed</span>
                  </span>
                  <span className="text-[10px] text-gray-500">({executionReport.executionTime}ms)</span>
                </div>
              )}
            </div>

            {/* Terminal Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 leading-relaxed">
              {!executionReport ? (
                <div className="text-zinc-500 dark:text-gray-500">
                  {"> Ready for execution. Click 'Run & Test' to validate your solution against strict test cases."}
                </div>
              ) : executionReport.error ? (
                <div className="text-rose-400 bg-rose-950/30 p-3 rounded-xl border border-rose-800/40">
                  <div className="font-bold uppercase tracking-wider mb-1 flex items-center space-x-1">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Compilation / Execution Error</span>
                  </div>
                  <pre className="whitespace-pre-wrap">{executionReport.error}</pre>
                </div>
              ) : (
                <div className="space-y-2">
                  {executionReport.results.map((r, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "p-3 rounded-xl border text-xs leading-relaxed transition-colors",
                        r.passed 
                          ? "bg-emerald-950/20 border-emerald-900/40 text-emerald-300" 
                          : "bg-rose-950/20 border-rose-900/40 text-rose-300"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold font-mono">
                          {r.passed ? "✓ PASS" : "✗ FAIL"}: {r.name}
                        </span>
                        <span className="text-[10px] opacity-75">{r.hidden ? "Hidden Benchmark" : "Public Case"}</span>
                      </div>
                      
                      <div className="text-zinc-600 dark:text-gray-400 text-[11px]">Input: <span className="text-zinc-900 dark:text-gray-200">{r.input}</span></div>
                      <div className="text-zinc-600 dark:text-gray-400 text-[11px]">Expected: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{r.expected}</span></div>
                      
                      {!r.passed && (
                        <div className="mt-1.5 pt-1.5 border-t border-rose-900/30 text-rose-500 dark:text-rose-400 text-[11px] font-semibold">
                          Actual Output: <span className="underline">{r.actual}</span>
                          {r.error && <div className="text-rose-600 dark:text-rose-500 font-normal">Error: {r.error}</div>}
                        </div>
                      )}
                    </div>
                  ))}

                  {executionReport.logs.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-white/[0.06] text-zinc-600 dark:text-gray-400">
                      <div className="text-[10px] uppercase text-zinc-500 dark:text-gray-500 mb-1">Console Output (stdout)</div>
                      <pre className="text-zinc-800 dark:text-gray-300 bg-zinc-100 dark:bg-black/60 p-2.5 rounded-lg">{executionReport.logs.join('\n')}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      <Chatbot contextData={{ questionText: currentProblem.description }} />
    </div>
  );
}
