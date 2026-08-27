// Dashboard page: displays the candidate's interview pipeline progress with step cards and navigation.
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const steps = [
  { id: 'info', name: 'Resume & Job Description', path: '/resume' },
  { id: 'mcq', name: 'MCQ Test', path: '/mcq' },
  { id: 'video', name: 'Video Interview', path: '/video' },
  { id: 'coding', name: 'Coding Challenge', path: '/coding' },
  { id: 'completed', name: 'Results', path: '/results' }
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate('/login');
    return null;
  }

  const currentStepIndex = steps.findIndex(s => s.id === user.currentStep);
  const isCompleted = user.currentStep === 'completed';

  const getCardStyle = (index) => {
    if (index < currentStepIndex) {
      return "bg-[#121620]/40 border border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.05)] cursor-pointer hover:border-emerald-500/40 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all duration-300";
    }
    if (index === currentStepIndex) {
      return "bg-indigo-950/20 border-2 border-indigo-500 text-white shadow-[0_0_25px_rgba(99,102,241,0.25)] scale-105 cursor-pointer hover:border-cyan-400 transition-all duration-300";
    }
    return "bg-[#121620]/20 border border-white/5 text-gray-500 opacity-50 cursor-not-allowed";
  };

  const getStatusText = (index) => {
    if (index < currentStepIndex) { return "Completed ✅"; }
    if (index === currentStepIndex) { return "In Progress ⏳"; }
    return "Locked 🔒";
  };

  const handleCardClick = (step, index) => {
    if (index <= currentStepIndex) {
      navigate(step.path);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0d13] text-gray-100 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-3xl pointer-events-none"></div>
      <header className="bg-slate-900/40 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-cyan-400 to-indigo-500 bg-clip-text text-transparent">
            Botfolio
          </h1>
          <div className="flex items-center gap-6">
            <span className="text-gray-300 hidden md:block">Welcome, <strong className="text-indigo-400">{user.name}</strong></span>
            <button onClick={logout} className="text-red-400 hover:text-red-300 font-semibold transition-colors duration-200">
              Logout
            </button>
          </div>
        </div>
      </header>
      <div className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-4xl md:text-5xl font-extrabold text-center tracking-tight bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent mb-16">
          Your Interview Journey
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div
              key={step.id}
              onClick={() => handleCardClick(step, index)}
              className={`p-10 rounded-3xl text-center transition-all ${getCardStyle(index)}`}
            >
              <div className="text-6xl mb-6">
                {index < currentStepIndex ? '✨' : index + 1}
              </div>
              <h3 className="text-2xl font-bold mb-4">{step.name}</h3>
              <p className="text-lg font-medium">
                {getStatusText(index)}
              </p>
              {index === currentStepIndex && (
                <p className="mt-4 text-cyan-400 font-semibold animate-pulse">Click to continue →</p>
              )}
            </div>
          ))}
        </div>
        {isCompleted && (
          <div className="mt-20 text-center glass-panel p-12 rounded-3xl max-w-2xl mx-auto border border-emerald-500/20">
            <div className="text-8xl mb-8">🎉</div>
            <h2 className="text-4xl font-extrabold text-emerald-400 mb-4">Interview Completed!</h2>
            <p className="text-xl text-gray-300">Thank you for your time. We will review your submission and get back soon.</p>
          </div>
        )}
      </div>
    </div>
  );
}