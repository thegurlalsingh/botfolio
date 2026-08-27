// CodingRound: fetches a coding problem, provides a Monaco editor with language switching, and handles run/submit.
import { useState, useEffect } from 'react';
import axios from 'axios';
import Editor from '@monaco-editor/react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const languages = [
  { value: 'javascript', label: 'JavaScript', mode: 'javascript' },
  { value: 'python', label: 'Python', mode: 'python' },
  { value: 'cpp', label: 'C++', mode: 'cpp' },
  { value: 'java', label: 'Java', mode: 'java' },
];

const defaultCode = {
  javascript: '// Write your solution here\nfunction solution() {\n  // code\n}',
  python: '# Write your solution here\ndef solution():\n    pass',
  cpp: '#include <bits/stdc++.h>\nusing namespace std;\n\n// Write your solution here\nint main() {\n    // code\n    return 0;\n}',
  java: 'public class Solution {\n    public static void main(String[] args) {\n        // Write your code here\n    }\n}',
};

export default function CodingRound() {
  const [problem, setProblem] = useState(null);
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(defaultCode.javascript);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [attemptId, setAttemptId] = useState(null);
  const [submissionFailed, setSubmissionFailed] = useState(false);

  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const loadProblem = async () => {
      try {
        setLoading(true);
        setError('');

        const res = await axios.get('/coding/start');

        if (!mounted) { return; }

        const p = res.data.problem;

        if (!p) {
          throw new Error('Backend did not return a coding problem');
        }

        setProblem(p);
        setAttemptId(res.data.attemptId);
        setCode(p.starterCode?.[language] || defaultCode[language]);

        if (res.data.completed === true) {
          setSubmitted(true);
        }
      } catch (err) {
        console.error('Coding problem load failed:', err.response?.data || err);
        setError(err.response?.data?.message || err.message || 'Failed to load coding problem');
      } finally {
        if (mounted) { setLoading(false); }
      }
    };

    loadProblem();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!problem || submitted) { return; }
    setCode(problem.starterCode?.[language] || defaultCode[language]);
  }, [language, problem, submitted]);

  const handleRun = async () => {
    if (!attemptId) {
      setError('Coding attempt is not ready yet.');
      return;
    }

    if (!code.trim()) {
      setError('Please write some code before running.');
      return;
    }

    if (running || submitting || submitted) { return; }

    try {
      setRunning(true);
      setError('');
      setResult(null);

      const res = await axios.post('/coding/run', { code, attemptId });
      console.log('Code execution:', res.data);
      setResult(res.data);
    } catch (err) {
      console.error('Code execution failed:', err.response?.data || err);
      setError(err.response?.data?.message || err.message || 'Execution failed');
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!attemptId || submitted || submitting) { return; }

    if (!code.trim()) {
      setError('Please write your solution before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      setSubmissionFailed(false);
      setError('');
      setResult(null);

      const res = await axios.post('/coding/submit', { attemptId, code, language });
      console.log('Coding submission successful:', res.data);

      if (!res.data.success) {
        throw new Error(res.data.message || 'Submission failed');
      }

      setResult(res.data);
      setSubmitted(true);
      await refreshUser();
      navigate('/profile', { replace: true });
    } catch (err) {
      console.error('Coding submission failed:', err.response?.data || err);
      setSubmitted(false);
      setSubmissionFailed(true);
      setError(err.response?.data?.message || err.message || 'Submission failed. Please retry.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0d13] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-400 mx-auto mb-6"></div>
          <p className="text-2xl text-gray-300">Loading challenge...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0d13] text-gray-100 py-10 relative overflow-hidden">
      <div className="absolute top-0 left-1/3 w-[600px] h-[400px] bg-indigo-600/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-cyan-600/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent mb-4">
            Coding Challenge
          </h2>
          <div className="inline-flex items-center gap-4 glass-panel px-6 py-3 rounded-2xl border border-white/10">
            <label className="text-gray-300 font-semibold">Language:</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={submitted || submitting}
              className="bg-slate-900/80 border border-indigo-500/30 text-white px-4 py-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 transition"
            >
              {languages.map(lang => (
                <option key={lang.value} value={lang.value}>{lang.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="glass-panel rounded-3xl p-8 border border-white/5 overflow-y-auto max-h-[600px]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-8 rounded-full bg-gradient-to-b from-cyan-400 to-indigo-500"></div>
              <div>
                <h3 className="text-xl font-extrabold text-white">{problem?.title}</h3>
                {problem?.difficulty && (
                  <span className="text-xs font-bold px-2 py-1 rounded-full bg-amber-500/15 text-amber-400">
                    {problem.difficulty.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap text-base mb-6">
              {problem?.description}
            </p>
            {problem?.testCases && (
              <div>
                <h4 className="text-base font-bold text-gray-200 mb-3 uppercase tracking-wider">Sample Test Cases</h4>
                {problem.testCases.filter(t => !t.hidden).map((t, i) => (
                  <div key={i} className="bg-slate-900/60 border border-white/5 rounded-xl p-4 mb-3">
                    <p className="text-sm mb-1 text-gray-400">
                      <span className="text-cyan-400 font-semibold">Input:</span>{' '}
                      <code className="bg-slate-800 px-2 py-0.5 rounded text-white whitespace-pre-wrap">{t.input}</code>
                    </p>
                    <p className="text-sm text-gray-400">
                      <span className="text-emerald-400 font-semibold">Expected:</span>{' '}
                      <code className="bg-slate-800 px-2 py-0.5 rounded text-white whitespace-pre-wrap">{t.expectedOutput}</code>
                    </p>
                  </div>
                ))}
                <p className="text-xs text-gray-500 mt-2">
                  +{' '}{problem.testCases.filter(t => t.hidden).length}{' '}hidden test cases will run on submission.
                </p>
              </div>
            )}
          </div>

          <div className="glass-panel rounded-3xl overflow-hidden border border-white/5 flex flex-col">
            <div className="bg-slate-900/80 border-b border-white/5 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/60"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500/60"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500/60"></div>
                <span className="ml-3 text-gray-300 font-medium text-sm">
                  {languages.find(l => l.value === language)?.label || 'Code'}
                </span>
              </div>
              {submitted && <span className="text-emerald-400 text-sm font-bold">✓ Submitted</span>}
            </div>
            <div className="flex-1 min-h-[400px]">
              <Editor
                height="450px"
                language={languages.find(l => l.value === language)?.mode || 'javascript'}
                value={code}
                onChange={(value) => !submitted && !submitting && setCode(value || '')}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 15,
                  readOnly: submitted || submitting,
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  lineNumbers: 'on',
                  renderLineHighlight: 'all',
                  padding: { top: 16 },
                }}
              />
            </div>
          </div>
        </div>

        {result && (
          <div className="glass-panel rounded-3xl p-8 mb-8 border border-white/5 text-center">
            <h3 className="text-2xl font-bold mb-4 text-gray-200">
              {submitted ? 'Final Score' : 'Test Results'}
            </h3>
            <div className="flex items-center justify-center gap-4 mb-4">
              <span className="text-6xl font-extrabold bg-gradient-to-r from-cyan-400 to-indigo-500 bg-clip-text text-transparent">
                {result.testCasesPassed || `${result.passed} / ${result.total}`}
              </span>
            </div>
            {result.feedback && (
              <p className="text-gray-400 text-base max-w-2xl mx-auto italic">"{result.feedback}"</p>
            )}
          </div>
        )}

        <div className="text-center space-y-4 pb-10">
          {!submitted && (
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={handleRun}
                disabled={running || submitting}
                className="px-10 py-4 text-base font-bold border-2 border-indigo-500 text-indigo-400 hover:bg-indigo-950/40 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {running ? '⏳ Running...' : '▶ Run Code'}
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || running || submitted}
                className="px-10 py-4 text-base font-bold bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? '⏳ Submitting...' : submissionFailed ? '🔄 Retry Submission' : '🚀 Submit Final Solution'}
              </button>
            </div>
          )}

          {submitted && (
            <div className="glass-panel rounded-3xl p-12 border border-emerald-500/20">
              <div className="text-7xl mb-6">🏆</div>
              <h2 className="text-3xl font-extrabold text-emerald-400 mb-3">Coding Round Complete!</h2>
              <p className="text-gray-400 text-lg">Thank you for completing the interview! Redirecting to dashboard...</p>
            </div>
          )}

          {error && (
            <div className="glass-panel border border-red-500/20 rounded-2xl p-4 text-center text-red-400 max-w-2xl mx-auto">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}