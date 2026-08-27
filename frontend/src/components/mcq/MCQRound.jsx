// MCQRound: fetches, displays, and submits MCQ questions with a per-question countdown timer.
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function MCQRound() {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [attemptId, setAttemptId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [score, setScore] = useState(null);
  const [error, setError] = useState(null);

  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  const fetchMCQs = useCallback(async () => {
    setLoading(true);
    setError(null);
    setQuestions([]);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setAnswers([]);
    setAttemptId(null);
    setScore(null);
    setTimeLeft(30);

    try {
      const res = await axios.get('/mcq/start');
      const qList = res.data?.questions;
      const id = res.data?.attemptId;

      if (!Array.isArray(qList) || qList.length === 0) {
        throw new Error('The server did not return any MCQ questions.');
      }

      if (!id) {
        throw new Error('MCQ attempt could not be created.');
      }

      setQuestions(qList);
      setAttemptId(id);
      setAnswers(new Array(qList.length).fill(null));
    } catch (err) {
      console.error('MCQ generation failed:', err.response?.data || err);
      setError(err.response?.data?.message || 'We could not generate your MCQ questions. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMCQs();
  }, [fetchMCQs]);

  const handleSubmit = async (finalAnswers) => {
    if (submitting) { return; }

    setSubmitting(true);
    setError(null);

    const mappedAnswers = finalAnswers.map((ans) =>
      ans !== null && ans !== undefined ? ['A', 'B', 'C', 'D'][ans] : null
    );

    try {
      const res = await axios.post('/mcq/submit', { attemptId, answers: mappedAnswers });
      console.log('MCQ submit success:', res.data);

      setScore(res.data.score);
      localStorage.setItem('mcqCompleted', 'true');
      await refreshUser();
      alert(`Score: ${res.data.score}%`);
      navigate('/profile', { replace: true });
    } catch (err) {
      console.error('MCQ submit failed:', err.response?.data || err);
      setError(err.response?.data?.message || 'Failed to submit your MCQ test. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (submitting) { return; }

    const newAnswers = [...answers];
    newAnswers[currentQuestion] = selectedAnswer;
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      const nextQuestion = currentQuestion + 1;
      setCurrentQuestion(nextQuestion);
      setSelectedAnswer(newAnswers[nextQuestion] ?? null);
      setTimeLeft(30);
    } else {
      handleSubmit(newAnswers);
    }
  };

  useEffect(() => {
    if (loading || error || score !== null || questions.length === 0) {
      return;
    }

    if (timeLeft <= 0) {
      handleNext();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, loading, error, score, questions.length]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0d13] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-400 mx-auto mb-6" />
          <p className="text-xl text-gray-300">Generating your MCQ test...</p>
          <p className="text-gray-500 mt-2">Please wait while we prepare your questions.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-[#0b0d13] flex items-center justify-center px-6">
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative w-full max-w-lg rounded-3xl border border-red-500/20 bg-[#121620] shadow-[0_0_50px_rgba(239,68,68,0.15)] p-10 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-4xl">
            ⚠️
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-4">Unable to Generate MCQs</h2>
          <p className="text-gray-400 text-lg leading-relaxed mb-8">
            We couldn't generate your interview questions right now. This can happen if the AI service temporarily fails.
          </p>
          <div className="rounded-xl bg-red-500/5 border border-red-500/10 px-5 py-4 mb-8">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => navigate('/profile', { replace: true })}
              className="flex-1 px-6 py-4 rounded-xl font-bold text-gray-300 bg-gray-800 hover:bg-gray-700 transition"
            >
              Back to Dashboard
            </button>
            <button
              onClick={fetchMCQs}
              className="flex-1 px-6 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.3)] transition"
            >
              Retry ↻
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (score !== null) {
    return (
      <div className="min-h-screen bg-[#0b0d13] flex items-center justify-center">
        <div className="border border-emerald-500/20 rounded-3xl p-16 text-center max-w-2xl bg-[#121620]">
          <div className="text-8xl mb-6">🎉</div>
          <h2 className="text-4xl font-extrabold text-emerald-400 mb-4">MCQ Round Complete!</h2>
          <p className="text-2xl text-gray-300 mb-2">
            Your score:{' '}
            <span className="text-cyan-400 font-extrabold">{score}/{questions.length}</span>
          </p>
          <button
            onClick={() => navigate('/profile', { replace: true })}
            className="mt-8 px-12 py-4 text-lg font-bold bg-gradient-to-r from-cyan-500 to-indigo-600 text-white rounded-xl"
          >
            Go to Dashboard →
          </button>
        </div>
      </div>
    );
  }

  if (!questions.length || !questions[currentQuestion]) {
    return null;
  }

  const q = questions[currentQuestion];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <div className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent mb-4">
          Question {currentQuestion + 1} of {questions.length}
        </div>
        <div className="text-2xl md:text-3xl font-extrabold text-rose-400 mb-6">
          Time Left:{' '}
          <span className="text-cyan-400">{timeLeft}s</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-[#121620] border border-white/5 rounded-3xl p-10">
        <h3 className="text-2xl font-bold text-white mb-8 text-center leading-relaxed">
          {q.question}
        </h3>
        <div className="space-y-4">
          {q.options.map((option, i) => (
            <label
              key={i}
              className={selectedAnswer === i
                ? "block p-6 rounded-2xl border cursor-pointer transition-all text-lg border-indigo-500 bg-indigo-950/40 text-white shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                : "block p-6 rounded-2xl border cursor-pointer transition-all text-lg border-white/5 bg-slate-900/40 text-gray-300 hover:border-indigo-500/50 hover:bg-indigo-950/20"
              }
            >
              <input
                type="radio"
                name="answer"
                checked={selectedAnswer === i}
                onChange={() => setSelectedAnswer(i)}
                className="sr-only"
              />
              <div className="flex items-center">
                <div className={`w-7 h-7 rounded-full border mr-4 flex items-center justify-center ${selectedAnswer === i ? 'border-indigo-500 bg-indigo-500' : 'border-gray-600'}`}>
                  {selectedAnswer === i && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                </div>
                <span className="font-semibold">{option}</span>
              </div>
            </label>
          ))}
        </div>

        <div className="mt-12 text-center">
          <button
            onClick={handleNext}
            disabled={selectedAnswer === null || submitting}
            className="px-12 py-4 text-lg font-bold bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.4)] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentQuestion < questions.length - 1 ? 'Next Question →' : submitting ? 'Submitting...' : 'Submit MCQ'}
          </button>
        </div>
      </div>
    </div>
  );
}