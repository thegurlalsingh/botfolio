// StepGuard: redirects users to the correct pipeline step based on their current interview progress.
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function StepGuard({ allowedSteps, children, redirectTo = '/profile' }) {
  const { user, loading, refreshUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  if (loading) {
    return <div>Loading user state...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedSteps.includes(user.currentStep)) {
    const stepToPath = {
      info: '/resume',
      mcq: '/mcq',
      video: '/video',
      coding: '/coding',
      completed: '/results'
    };
    const correctPath = stepToPath[user.currentStep] || redirectTo;
    return <Navigate to={correctPath} replace />;
  }

  return children;
}