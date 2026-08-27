// ProtectedRoute: validates user auth and step hierarchy before rendering protected children.
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requiredStep }) {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  const stepHierarchy = ['info', 'mcq', 'video', 'coding', 'completed'];
  const userStepIndex = stepHierarchy.indexOf(user.currentStep || 'info');
  const requiredStepIndex = stepHierarchy.indexOf(requiredStep);

  if (requiredStepIndex !== -1 && userStepIndex < requiredStepIndex) {
    return <Navigate to="/profile" replace />;
  }

  return <>{children}</>;
}
