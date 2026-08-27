// ResultScreen: fetches and displays overall score, per-round breakdowns, strengths, weaknesses, and submitted code.
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function ResultsPage() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/results');
        setResults(res.data.results);
      } catch (err) {
        console.error('Failed to load results:', err);
        setError(err.response?.data?.message || 'Failed to load results. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0d13] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-400 mx-auto mb-6"></div>
          <p className="text-2xl text-gray-300">Loading your results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0b0d13] flex items-center justify-center px-6">
        <div className="glass-panel border border-red-500/20 rounded-3xl p-12 text-center max-w-lg">
          <div className="text-6xl mb-6">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-3">Unable to Load Results</h2>
          <p className="text-red-400 text-lg">{error}</p>
        </div>
      </div>
    );
  }

  if (!results) { return null; }

  const { name, mcq, video, coding, overall } = results;

  const getScoreColor = (score = 0) => {
    if (score >= 80) { return 'text-emerald-400'; }
    if (score >= 60) { return 'text-cyan-400'; }
    if (score >= 40) { return 'text-amber-400'; }
    return 'text-red-400';
  };

  const getProgressWidth = (score = 0) => {
    const value = Number(score) || 0;
    return `${Math.min(Math.max(value, 0), 100)}%`;
  };

  const mcqScore = Number(mcq?.score ?? 0);
  const mcqCorrect = Number(mcq?.correctAnswers ?? 0);
  const mcqTotal = Number(mcq?.totalQuestions ?? 0);

  const videoScore = Number(video?.score ?? 0);
  const videoAnswered = Number(video?.answeredQuestions ?? 0);
  const videoTotal = Number(video?.totalQuestions ?? 0);

  const codingScore = Number(coding?.assessment?.score ?? 0);
  const codingFeedback = coding?.assessment?.feedback ?? null;
  const codingLanguage = coding?.submission?.language ?? null;
  const codingCode = coding?.submission?.code ?? null;
  const codingTotal = Number(coding?.testCases?.total ?? 0);
  const codingVisible = Number(coding?.testCases?.visible ?? 0);

  return (
    <div className="min-h-screen bg-[#0b0d13] text-gray-100 py-16 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-indigo-600/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-cyan-600/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-purple-600/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 relative">
        <div className="text-center mb-14">
          <div className="text-7xl mb-6">🎉</div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent mb-5">
            Congratulations{name ? `, ${name}` : ''}!
          </h1>
          <p className="text-xl text-gray-400">You've completed all rounds of the interview.</p>
        </div>

        <div className="glass-panel rounded-3xl p-10 mb-10 text-center border border-indigo-500/20 neon-glow-indigo">
          <p className="text-sm text-gray-400 uppercase tracking-[0.25em] mb-4">Overall Score</p>
          <div className="text-8xl font-extrabold bg-gradient-to-r from-cyan-400 to-indigo-500 bg-clip-text text-transparent mb-3">
            {overall?.percentage ?? 0}%
          </div>
          <p className="text-gray-400 text-lg mb-7">Combined Performance Across All Rounds</p>
          <div className="w-full max-w-xl mx-auto bg-slate-800 rounded-full h-4 overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 h-4 rounded-full transition-all duration-1000" style={{ width: getProgressWidth(overall?.percentage) }} />
          </div>
          <div className="flex justify-center flex-wrap gap-4 mt-7">
            <span className="px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm">MCQ · {overall?.weights?.mcq ?? 30}%</span>
            <span className="px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm">Video · {overall?.weights?.video ?? 30}%</span>
            <span className="px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-sm">Coding · {overall?.weights?.coding ?? 40}%</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="glass-panel rounded-3xl p-7 border border-white/5 hover:border-indigo-500/30 transition-all">
            <div className="flex items-center justify-between mb-6">
              <div className="text-4xl">📝</div>
              <span className="text-xs px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">30% Weight</span>
            </div>
            <h3 className="text-xl font-bold mb-2">MCQ Round</h3>
            <p className={`text-4xl font-extrabold ${getScoreColor(mcqScore)}`}>{mcqScore}%</p>
            <p className="text-gray-500 mt-2">{mcqCorrect} correct out of {mcqTotal}</p>
            <div className="mt-5 bg-slate-800 rounded-full h-2">
              <div className="bg-gradient-to-r from-indigo-500 to-cyan-500 h-2 rounded-full" style={{ width: getProgressWidth(mcqScore) }} />
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-7 border border-white/5 hover:border-purple-500/30 transition-all">
            <div className="flex items-center justify-between mb-6">
              <div className="text-4xl">🎥</div>
              <span className="text-xs px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">30% Weight</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Video Interview</h3>
            <p className={`text-4xl font-extrabold ${getScoreColor(videoScore)}`}>{videoScore}%</p>
            <p className="text-gray-500 mt-2">{videoAnswered} answered out of {videoTotal}</p>
            <div className="mt-5 bg-slate-800 rounded-full h-2">
              <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full" style={{ width: getProgressWidth(videoScore) }} />
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-7 border border-white/5 hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between mb-6">
              <div className="text-4xl">💻</div>
              <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">40% Weight</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Coding Challenge</h3>
            <p className={`text-4xl font-extrabold ${getScoreColor(codingScore)}`}>{codingScore}%</p>
            <p className="text-gray-500 mt-2">{codingVisible} visible test cases out of {codingTotal}</p>
            <div className="mt-5 bg-slate-800 rounded-full h-2">
              <div className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-2 rounded-full" style={{ width: getProgressWidth(codingScore) }} />
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-8 mb-10 border border-white/5">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-2 h-8 rounded-full bg-gradient-to-b from-indigo-400 to-cyan-500"></div>
            <div>
              <h2 className="text-2xl font-extrabold">MCQ Performance</h2>
              <p className="text-gray-500 text-sm">Topic-wise performance analysis</p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-5">Topic Performance</h3>
              {mcq?.topicPerformance?.length > 0 ? (
                <div className="space-y-4">
                  {mcq.topicPerformance.map((topic, index) => (
                    <div key={index}>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-300">{topic.topic}</span>
                        <span className={`font-bold ${getScoreColor(topic.percentage)}`}>{topic.percentage}%</span>
                      </div>
                      <div className="bg-slate-800 rounded-full h-2">
                        <div className="bg-gradient-to-r from-indigo-500 to-cyan-500 h-2 rounded-full" style={{ width: getProgressWidth(topic.percentage) }} />
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{topic.correct}/{topic.total} correct</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No topic data available.</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="rounded-2xl bg-emerald-500/5 border border-emerald-500/10 p-5">
                <h3 className="text-lg font-bold text-emerald-400 mb-4">💪 Strengths</h3>
                {mcq?.strengths?.length > 0 ? (
                  <div className="space-y-3">
                    {mcq.strengths.map((topic, index) => (
                      <div key={index} className="bg-emerald-500/5 rounded-xl p-3">
                        <p className="text-gray-300 text-sm">{topic.topic}</p>
                        <p className="text-emerald-400 font-bold">{topic.percentage}%</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No major strengths identified.</p>
                )}
              </div>

              <div className="rounded-2xl bg-red-500/5 border border-red-500/10 p-5">
                <h3 className="text-lg font-bold text-red-400 mb-4">⚠️ Areas to Improve</h3>
                {mcq?.weaknesses?.length > 0 ? (
                  <div className="space-y-3">
                    {mcq.weaknesses.map((topic, index) => (
                      <div key={index} className="bg-red-500/5 rounded-xl p-3">
                        <p className="text-gray-300 text-sm">{topic.topic}</p>
                        <p className="text-red-400 font-bold">{topic.percentage}%</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No major weaknesses identified.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-8 mb-10 border border-white/5">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-2 h-8 rounded-full bg-gradient-to-b from-purple-400 to-indigo-500"></div>
            <div>
              <h2 className="text-2xl font-extrabold">Video Interview Analysis</h2>
              <p className="text-gray-500 text-sm">Communication and response performance</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            {[
              { label: 'Relevance', value: video?.summary?.relevance ?? 0 },
              { label: 'Clarity', value: video?.summary?.clarity ?? 0 },
              { label: 'Confidence', value: video?.summary?.confidence ?? 0 }
            ].map((item, index) => (
              <div key={index} className="bg-slate-900/50 rounded-2xl p-6 text-center border border-white/5">
                <p className="text-gray-500 text-sm uppercase tracking-wider mb-3">{item.label}</p>
                <p className={`text-4xl font-extrabold ${getScoreColor(item.value)}`}>{item.value}</p>
              </div>
            ))}
          </div>

          {video?.questions?.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-5">Interview Responses</h3>
              <div className="space-y-5">
                {video.questions.map((item, index) => (
                  <div key={index} className="bg-slate-900/40 border border-white/5 rounded-2xl p-6">
                    <div className="flex justify-between gap-4 mb-4">
                      <div>
                        <span className="text-xs text-purple-400 font-bold uppercase">Question {item.stepNumber}</span>
                        <p className="text-white font-semibold mt-2">{item.question}</p>
                      </div>
                      <span className={`text-xl font-bold ${getScoreColor(item.score)}`}>{item.score ?? 0}</span>
                    </div>

                    {item.answer && (
                      <div className="bg-slate-800/70 rounded-xl p-4 mb-4">
                        <p className="text-xs text-gray-500 uppercase mb-2">Your Answer</p>
                        <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{item.answer}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                      <div className="bg-slate-800/50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">Relevance</p>
                        <p className="text-cyan-400 font-bold">{item.relevance ?? 0}</p>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">Clarity</p>
                        <p className="text-indigo-400 font-bold">{item.clarity ?? 0}</p>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">Confidence</p>
                        <p className="text-purple-400 font-bold">{item.confidence ?? 0}</p>
                      </div>
                    </div>

                    {item.feedback && (
                      <p className="text-sm text-gray-500 italic">"{item.feedback}"</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="glass-panel rounded-3xl p-8 mb-12 border border-white/5">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-2 h-8 rounded-full bg-gradient-to-b from-cyan-400 to-emerald-500"></div>
            <div>
              <h2 className="text-2xl font-extrabold">Coding Challenge</h2>
              <p className="text-gray-500 text-sm">Final submission and execution performance</p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-7">
            <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/5 text-center">
              <p className="text-gray-500 text-sm uppercase mb-2">Score</p>
              <p className={`text-5xl font-extrabold ${getScoreColor(codingScore)}`}>{codingScore}%</p>
            </div>
            <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/5 text-center">
              <p className="text-gray-500 text-sm uppercase mb-2">Test Cases</p>
              <p className="text-5xl font-extrabold text-cyan-400">{codingVisible}/{codingTotal}</p>
              <p className="text-xs text-gray-600 mt-2">Visible / Total</p>
            </div>
            <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/5 text-center">
              <p className="text-gray-500 text-sm uppercase mb-2">Language</p>
              <p className="text-3xl font-extrabold text-indigo-400 mt-3">{codingLanguage || 'N/A'}</p>
            </div>
          </div>

          {codingFeedback && (
            <div className="bg-cyan-500/5 border border-cyan-500/10 rounded-2xl p-6 mb-7">
              <p className="text-xs uppercase tracking-wider text-cyan-400 font-bold mb-3">Feedback</p>
              <p className="text-gray-300 leading-relaxed">{codingFeedback}</p>
            </div>
          )}

          {codingCode && (
            <div>
              <h3 className="text-lg font-bold mb-4">Submitted Code</h3>
              <div className="bg-[#080a0f] rounded-2xl border border-white/5 overflow-hidden">
                <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
                  <span className="text-sm text-gray-400">{codingLanguage || 'Code'}</span>
                  <span className="text-xs text-gray-600">Final submission</span>
                </div>
                <pre className="p-6 overflow-x-auto text-sm text-gray-300 leading-relaxed">
                  <code>{codingCode}</code>
                </pre>
              </div>
            </div>
          )}
        </div>

        <div className="glass-panel rounded-3xl p-12 text-center border border-indigo-500/20">
          <div className="w-16 h-1 mx-auto rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 mb-8"></div>
          <div className="text-5xl mb-5">🚀</div>
          <h2 className="text-3xl font-extrabold bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent mb-4">Thank You!</h2>
          <p className="text-gray-400 text-lg leading-relaxed max-w-2xl mx-auto mb-6">
            Your interview has been successfully submitted. Our team will review your performance and get back to you soon.
          </p>
          <p className="text-2xl font-bold text-indigo-400">Best of luck! 🚀</p>
        </div>
      </div>
    </div>
  );
}