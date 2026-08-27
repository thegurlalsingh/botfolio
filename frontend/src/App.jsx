// Root app component: sets up AuthProvider, BrowserRouter, and all protected/public routes for the hiring pipeline.
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ResumePage from './pages/ResumePage.jsx';
import MCQPage from './pages/MCQPage.jsx';
import VideoPage from './pages/VideoPage.jsx';
import CodingPage from './pages/CodingPage.jsx';
import ResultPage from './pages/ResultPage.jsx';
import MainPage from './pages/MainPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<ProtectedRoute requiredStep="info"> <Dashboard /> </ProtectedRoute>} />
          <Route path="/resume" element={<ProtectedRoute requiredStep="info"> <ResumePage /> </ProtectedRoute>} />
          <Route path="/mcq" element={<ProtectedRoute requiredStep="mcq"> <MCQPage /> </ProtectedRoute>} />
          <Route path="/video" element={<ProtectedRoute requiredStep="video"> <VideoPage /> </ProtectedRoute>} />
          <Route path="/coding" element={<ProtectedRoute requiredStep="coding"> <CodingPage /> </ProtectedRoute>} />
          <Route path="/results" element={<ProtectedRoute requiredStep="completed"> <ResultPage /> </ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;