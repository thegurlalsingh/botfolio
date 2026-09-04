// VideoRound: manages camera/mic setup, per-question video recording, upload, and AI submission for the video interview.
import { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function VideoRound() {
  const [question, setQuestion] = useState('');
  const [attemptId, setAttemptId] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [totalSteps, setTotalSteps] = useState(5);
  const [loading, setLoading] = useState(true);
  const [cameraReady, setCameraReady] = useState(false);
  const [recording, setRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const [videoBlob, setVideoBlob] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const uploadedMediaRef = useRef({ videoUrl: '', audioUrl: '' });
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  const clearError = () => { setError(''); };

  const fetchQuestion = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const res = await axios.get('/video/start');
      const data = res.data;

      if (!data.question || !data.attemptId) {
        throw new Error('Invalid response from video interview server');
      }

      setQuestion(data.question);
      setAttemptId(data.attemptId);
      setCurrentStep(data.currentStep || 1);
      setTotalSteps(data.totalSteps || 5);
      setTimeLeft(120);
    } catch (err) {
      console.error('Video start failed:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load interview question.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestion();
  }, [fetchQuestion]);

  useEffect(() => {
    if (!question) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(question);

    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    window.speechSynthesis.speak(utterance);

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [question]);

  // Robust media initialization with fallback constraints & cleanup
  const startMedia = useCallback(async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setCameraReady(false);

    try {
      let mediaStream = null;

      // 1. Try preferred constraints
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });
      } catch (err1) {
        console.warn('Preferred camera constraints failed, trying basic video+audio:', err1);
        // 2. Fallback to generic video+audio
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
        } catch (err2) {
          console.warn('Basic video+audio failed, trying video only:', err2);
          // 3. Fallback to video only
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }
      }

      streamRef.current = mediaStream;
      setCameraReady(true);
      setError('');
      console.log('Camera access granted successfully');

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(e => console.warn('Auto-play blocked:', e));
      }
    } catch (err) {
      console.error('Media error:', err);

      let message = 'Failed to access camera and microphone.';

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = 'Camera and microphone permission was denied. Please allow camera access in browser settings and retry.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        message = 'No camera or microphone was detected on your system.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        message = 'Camera is currently in use by another application (e.g. Zoom, Teams). Please close other apps and retry.';
      } else if (err.name === 'SecurityError') {
        message = 'Camera access requires HTTPS or localhost connection.';
      }

      setError(message);
      setCameraReady(false);
    }
  }, []);

  // Initialize camera on mount and cleanup on unmount
  useEffect(() => {
    startMedia();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [startMedia]);

  // Synchronize camera stream with video DOM element whenever loading state or camera readiness changes
  useEffect(() => {
    if (!loading && cameraReady && streamRef.current && videoRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      videoRef.current.play().catch(err => {
        console.warn('Video auto-play prevented by browser:', err);
      });
    }
  }, [loading, cameraReady]);

  // Countdown timer when recording
  useEffect(() => {
    if (!recording) { return; }

    if (timeLeft <= 0) {
      handleStop();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [recording, timeLeft]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secondsPart = seconds % 60;
    return `${minutes}:${secondsPart.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    clearError();

    if (!streamRef.current || !cameraReady) {
      setError('Camera is not ready. Please enable camera access and retry.');
      return;
    }

    if (recording || uploading || submitting) { return; }

    try {
      chunksRef.current = [];
      let mimeType = '';

      const candidates = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
        'video/mp4;codecs=avc1,mp4a',
        'video/mp4',
      ];

      if (typeof MediaRecorder !== 'undefined') {
        for (const type of candidates) {
          if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(type)) {
            mimeType = type;
            break;
          }
        }
      }

      console.log('Using MediaRecorder MIME type:', mimeType || 'browser default');

      const recorderOptions = mimeType ? { mimeType } : undefined;
      const recorder = new MediaRecorder(streamRef.current, recorderOptions);

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('Recording failed. Please try recording again.');
        setRecording(false);
      };

      recorder.onstop = () => {
        const actualType = mimeType || recorder.mimeType || 'video/webm';
        const blob = new Blob(chunksRef.current, { type: actualType });
        console.log('Created blob:', { type: blob.type, size: blob.size });
        setVideoBlob(blob);
        uploadVideo(blob, actualType);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000);
      setRecording(true);
      setTimeLeft(120);
      setVideoBlob(null);
      uploadedMediaRef.current = { videoUrl: '', audioUrl: '' };
    } catch (err) {
      console.error('Failed to start recorder:', err);
      setError(`Could not start recording: ${err.message || 'Check camera permissions'}`);
    }
  };

  const handleStop = () => {
    if (!mediaRecorderRef.current || !recording) { return; }

    try {
      mediaRecorderRef.current.stop();
    } catch (err) {
      console.error('Failed to stop recorder:', err);
    }

    setRecording(false);
  };

  const uploadVideo = async (blob, blobType) => {
    setUploading(true);
    setError('');

    try {
      const type = blobType || blob?.type || 'video/webm';
      const isMp4 = type.includes('mp4');
      const filename = isMp4 ? 'interview.mp4' : 'interview.webm';
      const videoFile = new File([blob], filename, { type });

      console.log('FILE BEFORE UPLOAD:', { name: videoFile.name, type: videoFile.type, size: videoFile.size });

      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('attemptId', attemptId);

      const uploadRes = await axios.post('/video/upload', formData);
      console.log('Upload successful:', uploadRes.data);

      const submitRes = await axios.post('/video/submit', {
        attemptId,
        videoUrl: uploadRes.data.videoUrl,
        audioUrl: uploadRes.data.audioUrl || ''
      });

      const data = submitRes.data;

      if (data.completed) {
        setSubmitted(true);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        await refreshUser();
        navigate('/profile', { replace: true });
      } else {
        setQuestion(data.nextQuestion);
        setCurrentStep(data.currentStep);
        setVideoBlob(null);
        setTimeLeft(120);
        setError('');
      }
    } catch (err) {
      console.error('Video upload failed:', err.response?.data || err);
      setError(err.response?.data?.message || 'Upload failed. Click Retry to try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRetry = async () => {
    if (!cameraReady) {
      startMedia();
      return;
    }

    if (!videoBlob || videoBlob.size === 0) {
      fetchQuestion();
      return;
    }

    try {
      setUploading(true);
      setError('');

      const type = videoBlob.type || 'video/webm';
      const isMp4 = type.includes('mp4');
      const filename = isMp4 ? 'interview.mp4' : 'interview.webm';
      const videoFile = new File([videoBlob], filename, { type });

      console.log('Retry video:', { name: videoFile.name, type: videoFile.type, size: videoFile.size });

      const formData = new FormData();
      formData.append('video', videoFile, filename);

      const uploadRes = await axios.post('/video/upload', formData);
      console.log('Retry upload successful:', uploadRes.data);

      const { videoUrl, audioUrl } = uploadRes.data;

      if (!videoUrl) {
        throw new Error('Video upload succeeded but video URL is missing');
      }

      const submitRes = await axios.post('/video/submit', { attemptId, videoUrl, audioUrl: audioUrl || '' });
      const data = submitRes.data;
      console.log('Retry submission response:', data);

      if (data.completed) {
        setSubmitted(true);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        await refreshUser();
        navigate('/profile', { replace: true });
        return;
      }

      if (!data.nextQuestion) {
        throw new Error('Server did not return the next interview question');
      }

      setQuestion(data.nextQuestion);
      setCurrentStep(data.currentStep);
      setTotalSteps(data.totalSteps || 5);
      setVideoBlob(null);
      chunksRef.current = [];
      setTimeLeft(120);
      setError('');
    } catch (err) {
      console.error('Video retry failed:', err.response?.data || err);
      setError(err.response?.data?.message || err.message || 'Retry failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0d13] flex items-center justify-center text-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-400 mx-auto mb-6" />
          <p className="text-2xl text-gray-300">Preparing your interview...</p>
          <p className="text-sm text-gray-500 mt-2">Generating your personalized question</p>
        </div>
      </div>
    );
  }

  if (error && !question) {
    return (
      <div className="min-h-screen bg-[#0b0d13] flex items-center justify-center px-6">
        <div className="w-full max-w-lg">
          <div className="glass-panel rounded-3xl border border-red-500/30 bg-red-950/10 p-10 text-center shadow-[0_0_40px_rgba(239,68,68,0.08)]">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Something went wrong</h2>
            <p className="text-gray-400 leading-relaxed mb-8">{error}</p>
            <button
              onClick={handleRetry}
              disabled={loading}
              className="w-full px-6 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 transition-all shadow-[0_0_25px_rgba(99,102,241,0.3)] disabled:opacity-50"
            >
              {loading ? 'Retrying...' : 'Retry'}
            </button>
            <button
              onClick={() => navigate('/profile', { replace: true })}
              className="w-full mt-3 px-6 py-3 rounded-xl font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0b0d13] flex items-center justify-center">
        <div className="glass-panel rounded-3xl p-12 border border-emerald-500/20 text-center max-w-2xl">
          <div className="text-7xl mb-6">✅</div>
          <h2 className="text-3xl font-extrabold text-emerald-400 mb-3">Video Interview Complete!</h2>
          <p className="text-gray-400 text-lg">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0d13] text-gray-100 py-8 relative overflow-hidden">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-cyan-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 relative z-10">
        <div className="text-center mb-8">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent mb-4">
            Video Interview
          </h2>
          <div className="flex items-center justify-center gap-2 mb-4">
            {Array.from({ length: totalSteps }, (_, i) => {
              const stepNumber = i + 1;
              const completed = stepNumber < currentStep;
              const active = stepNumber === currentStep;

              return (
                <div
                  key={stepNumber}
                  className={`h-2 rounded-full transition-all duration-500 ${completed ? 'w-10 bg-gradient-to-r from-cyan-500 to-indigo-500' : active ? 'w-14 bg-indigo-400' : 'w-8 bg-slate-700'}`}
                />
              );
            })}
          </div>
          <p className="text-gray-400 text-lg">
            Step{' '}<span className="text-indigo-400 font-bold">{currentStep}</span>{' '}of{' '}<span className="text-indigo-400 font-bold">{totalSteps}</span>
          </p>
        </div>

        {error && (
          <div className="mb-6">
            <div className="glass-panel border border-red-500/30 bg-red-950/10 rounded-2xl p-5">
              <div className="flex items-start gap-4">
                <div className="text-2xl">⚠️</div>
                <div className="flex-1">
                  <h3 className="font-bold text-red-400 mb-1">Notice / Issue</h3>
                  <p className="text-sm text-gray-400">{error}</p>
                </div>
                <button
                  onClick={handleRetry}
                  disabled={uploading || submitting}
                  className="px-5 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 font-semibold hover:bg-red-500/20 transition disabled:opacity-50"
                >
                  {!cameraReady ? 'Retry Camera' : 'Retry'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="glass-panel rounded-3xl p-8 mb-8 border border-indigo-500/20 neon-glow-indigo">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-2 h-8 rounded-full bg-gradient-to-b from-cyan-400 to-indigo-500" />
            <h3 className="text-lg font-bold text-gray-300 uppercase tracking-widest">Interview Question</h3>
          </div>
          <p className="text-xl leading-relaxed text-white">{question}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="glass-panel rounded-2xl p-6 text-center border border-white/5 flex flex-col justify-center">
            <p className="text-sm text-gray-400 mb-3 uppercase tracking-widest">Time Remaining</p>
            <p className={`text-5xl font-mono font-extrabold ${timeLeft <= 30 ? 'text-rose-400' : 'text-cyan-400'}`}>
              {formatTime(timeLeft)}
            </p>
            <p className="text-xs text-gray-600 mt-4">Maximum response time</p>
          </div>

          <div className="lg:col-span-2 relative bg-black rounded-3xl overflow-hidden aspect-video shadow-2xl border border-indigo-500/30">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />

            {!cameraReady && (
              <div className="absolute inset-0 bg-black/85 flex items-center justify-center p-6 text-center">
                <div className="max-w-md">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-cyan-400 mx-auto mb-4" />
                  <p className="text-gray-300 mb-4">{error || 'Starting camera...'}</p>
                  <button
                    onClick={startMedia}
                    className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-semibold text-sm rounded-xl hover:from-cyan-400 hover:to-indigo-500 transition shadow-lg"
                  >
                    🔄 Enable / Retry Camera
                  </button>
                </div>
              </div>
            )}

            {recording && (
              <div className="absolute top-4 left-4 bg-red-600 text-white px-4 py-2 rounded-full animate-pulse flex items-center gap-2 text-sm font-bold shadow-lg">
                <div className="w-3 h-3 bg-white rounded-full" />
                RECORDING
              </div>
            )}

            {uploading && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-cyan-400 mx-auto mb-4" />
                  <p className="text-cyan-400 font-bold text-lg">Uploading video...</p>
                  <p className="text-gray-500 text-sm mt-2">Please don't close this page</p>
                </div>
              </div>
            )}

            {submitting && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-400 mx-auto mb-4" />
                  <p className="text-indigo-400 font-bold text-lg">Processing your answer...</p>
                  <p className="text-gray-500 text-sm mt-2">Transcribing and evaluating your response</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="text-center space-y-5">
          {!recording && !videoBlob && !uploading && !submitting && (
            <button
              onClick={handleStart}
              disabled={!cameraReady}
              className="px-12 py-4 text-lg font-bold bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white rounded-2xl shadow-[0_0_25px_rgba(99,102,241,0.4)] hover:shadow-[0_0_35px_rgba(0,245,255,0.5)] transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              ● Start Recording
            </button>
          )}

          {recording && (
            <button
              onClick={handleStop}
              className="px-12 py-4 text-lg font-bold bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white rounded-2xl shadow-[0_0_25px_rgba(220,38,38,0.4)] hover:shadow-[0_0_35px_rgba(220,38,38,0.6)] transform hover:-translate-y-1 transition-all duration-300 animate-pulse"
            >
              ■ Stop Recording
            </button>
          )}

          {(uploading || submitting) && (
            <p className="text-gray-500 text-sm">
              {uploading ? 'Uploading your response...' : 'Analyzing your response...'}
            </p>
          )}

          {error && uploadedMediaRef.current.videoUrl && !uploading && !submitting && (
            <button
              onClick={handleRetry}
              className="px-10 py-3 rounded-xl font-bold bg-gradient-to-r from-cyan-500 to-indigo-600 text-white hover:from-cyan-400 hover:to-indigo-500 transition"
            >
              Retry Processing →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
