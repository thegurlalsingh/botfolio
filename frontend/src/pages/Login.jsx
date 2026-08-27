// Login page: handles candidate email/password authentication and redirects to profile on success.
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/profile');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
      console.error('Login Error:', err.response);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0d13] flex items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="max-w-md w-full glass-panel rounded-3xl overflow-hidden relative z-10 neon-glow-indigo">
        <div className="bg-indigo-950/40 border-b border-white/5 px-10 py-12 text-center">
          <h1 className="text-4xl font-extrabold mb-3 tracking-tight bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent">
            BotFolio Login
          </h1>
          <p className="text-gray-400">Log in with the credentials provided by your interviewer to continue your AI interview</p>
        </div>
        <div className="p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-5 py-3.5 bg-slate-900/60 border border-white/10 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition text-white placeholder-gray-500"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-5 py-3.5 bg-slate-900/60 border border-white/10 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition text-white placeholder-gray-500"
                placeholder="••••••••"
              />
            </div>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 text-lg font-bold bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(0,245,255,0.5)] transform hover:-translate-y-0.5 transition disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}