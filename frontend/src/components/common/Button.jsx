// Button: reusable button component with variant, size, loading, and disabled states.
export default function Button({ children, type = 'button', variant = 'primary', size = 'md', loading = false, disabled = false, className = '', onClick, ...props }) {
  const baseClasses = "font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-slate-900 transition-all duration-200 flex items-center justify-center gap-2";

  const variants = {
    primary: "bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.35)] hover:shadow-[0_0_30px_rgba(0,245,255,0.45)] focus:ring-indigo-500",
    secondary: "border border-white/10 bg-slate-800/60 text-gray-300 hover:bg-slate-700/60 focus:ring-slate-500",
    success: "bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] focus:ring-emerald-500",
    danger: "bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)] focus:ring-red-500",
    outline: "border-2 border-indigo-500 text-indigo-400 hover:bg-indigo-950/40 focus:ring-indigo-500",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-10 py-4 text-lg",
  };

  const disabledClasses = disabled || loading ? "opacity-60 cursor-not-allowed" : "cursor-pointer transform hover:scale-105";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${disabledClasses} ${className}`}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" className="opacity-25" />
          <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
