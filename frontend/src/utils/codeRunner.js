/**
 * Safe, strict client-side sandbox test runner for algorithmic problems.
 * Evaluates user solution against explicit test cases and produces granular diffs.
 */

export function deepEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
      if (!keysB.includes(key) || !deepEqual(a[key], b[key])) return false;
    }
    return true;
  }

  return false;
}

export async function runJavaScriptSolution(userCode, functionName, testCases) {
  const startTime = performance.now();
  const consoleLogs = [];

  const sandboxConsole = {
    log: (...args) => consoleLogs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
    error: (...args) => consoleLogs.push('[ERR] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
    warn: (...args) => consoleLogs.push('[WARN] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '))
  };

  let targetFn = null;

  try {
    // Compile user code in a function scope returning the target function
    const wrapper = new Function(
      'console',
      `
      "use strict";
      ${userCode}
      if (typeof ${functionName} === 'function') {
        return ${functionName};
      }
      return null;
      `
    );

    targetFn = wrapper(sandboxConsole);
  } catch (compileErr) {
    return {
      success: false,
      error: `Syntax / Compilation Error: ${compileErr.message}`,
      logs: consoleLogs,
      passedCount: 0,
      totalCount: testCases.length,
      results: testCases.map((tc, idx) => ({
        index: idx + 1,
        passed: false,
        input: JSON.stringify(tc.args),
        expected: JSON.stringify(tc.expected),
        actual: 'None (Compile Failed)',
        error: compileErr.message
      })),
      executionTime: (performance.now() - startTime).toFixed(2)
    };
  }

  if (!targetFn) {
    return {
      success: false,
      error: `Function '${functionName}' was not declared or exported as a valid function.`,
      logs: consoleLogs,
      passedCount: 0,
      totalCount: testCases.length,
      results: testCases.map((tc, idx) => ({
        index: idx + 1,
        passed: false,
        input: JSON.stringify(tc.args),
        expected: JSON.stringify(tc.expected),
        actual: 'undefined',
        error: `Function '${functionName}' is undefined.`
      })),
      executionTime: (performance.now() - startTime).toFixed(2)
    };
  }

  // Execute test cases
  const results = [];
  let passedCount = 0;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const argsClone = JSON.parse(JSON.stringify(tc.args));
    let actualOutput = undefined;
    let testError = null;
    let passed = false;

    try {
      // Execute with cloned args to prevent mutation side-effects between test cases
      actualOutput = targetFn(...argsClone);
      passed = deepEqual(actualOutput, tc.expected);
      if (passed) passedCount++;
    } catch (runErr) {
      testError = runErr.message;
      passed = false;
    }

    results.push({
      index: i + 1,
      name: tc.name || `Test Case ${i + 1}`,
      passed,
      input: JSON.stringify(tc.args),
      expected: JSON.stringify(tc.expected),
      actual: actualOutput !== undefined ? JSON.stringify(actualOutput) : 'undefined',
      error: testError,
      hidden: !!tc.hidden
    });
  }

  const executionTime = (performance.now() - startTime).toFixed(2);
  const success = passedCount === testCases.length;

  return {
    success,
    passedCount,
    totalCount: testCases.length,
    results,
    logs: consoleLogs,
    executionTime
  };
}
