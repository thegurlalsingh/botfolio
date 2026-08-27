// ResumePage: handles resume and job description upload, tracks completion state, and proceeds to dashboard.
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ResumeUpload from '../components/resume/ResumeUpload';
import JdUpload from '../components/jd/JdUpload';

export default function ResumePage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [resumeDone, setResumeDone] = useState(false);
  const [jdDone, setJdDone] = useState(false);

  useEffect(() => {
    if (user?.resumeUrl) {
      setResumeDone(true);
    }
    if (localStorage.getItem('jdUploaded') === 'true') {
      setJdDone(true);
    }
  }, [user]);

  const handleResumeComplete = () => {
    console.log('RESUME COMPLETED SUCCESSFULLY');
    setResumeDone(true);
    localStorage.setItem('resumeUploaded', 'true');
  };

  const handleJdComplete = () => {
    console.log('JD COMPLETED SUCCESSFULLY');
    setJdDone(true);
    localStorage.setItem('jdUploaded', 'true');
  };

  const bothDone = resumeDone && jdDone;

  const handleProceed = async () => {
    if (!resumeDone || !jdDone) { return; }
    try {
      await refreshUser();
      navigate('/profile', { replace: true });
    } catch (error) {
      console.error('Could not load latest profile:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0d13] text-gray-100 flex flex-col items-center py-12 px-6">
      <div className="max-w-6xl w-full text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent mb-4">
          Resume &amp; Job Description Upload
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Upload your resume and provide the job description. Both are required to customize your AI interview.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-6xl items-start">
        <div className="bg-[#121620]/60 backdrop-blur-md rounded-3xl border border-white/5 p-8 relative shadow-2xl">
          <ResumeUpload onComplete={handleResumeComplete} />
        </div>
        <div className="bg-[#121620]/60 backdrop-blur-md rounded-3xl border border-white/5 p-8 relative shadow-2xl">
          <JdUpload onComplete={handleJdComplete} />
        </div>
      </div>
      <div className="w-full max-w-6xl flex flex-col items-center mt-12">
        <button
          onClick={handleProceed}
          disabled={!bothDone}
          className={`
            px-16 py-5 text-xl font-bold rounded-2xl
            text-white transition-all duration-300
            ${
              bothDone
                ? `
                  bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600
                  hover:from-cyan-400 hover:via-indigo-400 hover:to-purple-500
                  shadow-[0_0_30px_rgba(99,102,241,0.4)]
                  hover:shadow-[0_0_40px_rgba(0,245,255,0.6)]
                  hover:-translate-y-1
                `
                : `
                  bg-gray-700
                  text-gray-400
                  cursor-not-allowed
                  opacity-60
                `
            }
          `}
        >
          {bothDone ? 'Continue to Dashboard →' : 'Complete Both Uploads'}
        </button>
        {!bothDone && (
          <p className="text-gray-500 text-sm mt-4">
            Please complete both your resume and job description upload.
          </p>
        )}
        {bothDone && (
          <p className="text-emerald-400 text-sm mt-4 font-medium">
            Resume and Job Description completed successfully ✓
          </p>
        )}
      </div>
    </div>
  );
}