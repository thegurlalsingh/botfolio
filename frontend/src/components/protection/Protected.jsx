// Protected: proctored layout that enforces full-screen mode, blocks dev tools/copy-paste, and tracks violations.
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const MAX_STRIKES = 3;

const ProctoredLayout = ({ children }) => {
  const navigate = useNavigate();
  const [strikes, setStrikes] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const initialSize = useRef({ width: window.innerWidth, height: window.innerHeight });
  const violationTimeout = useRef(null);

  useEffect(() => {
    const checkDevice = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isSmall = window.innerWidth < 1024 || window.innerHeight < 768;

      if (isMobileDevice || isSmall) {
        setIsMobile(true);
        document.body.innerHTML = `
          <div style="height:100vh;display:flex;align-items:center;justify-content:center;background:#000;color:#fff;text-align:center;padding:40px;font-size:1.5rem;">
            <div>
              <h1>Desktop Only</h1>
              <p>This section must be completed on a desktop or laptop in full-screen mode.</p>
              <p>Mobile devices, tablets, and split-screen mode are not allowed.</p>
            </div>
          </div>
        `;
      }
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  const enterFullScreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) { elem.requestFullscreen(); }
    else if (elem.webkitRequestFullscreen) { elem.webkitRequestFullscreen(); }
    else if (elem.msRequestFullscreen) { elem.msRequestFullscreen(); }
  };

  useEffect(() => {
    const onFSChange = () => {
      const isFS = !!document.fullscreenElement;
      setIsFullScreen(isFS);
      if (!isFS) {
        violationTimeout.current = setTimeout(handleViolation, 0);
      }
    };

    document.addEventListener('fullscreenchange', onFSChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFSChange);
      clearTimeout(violationTimeout.current);
    };
  }, []);

  const handleViolation = () => {
    if (strikes >= MAX_STRIKES) { return; }

    setStrikes(prev => {
      const newStrikes = prev + 1;
      if (newStrikes >= MAX_STRIKES) {
        setTimeout(() => {
          alert('Maximum allowed violations reached. Assessment terminated.');
          navigate('/terminated');
        }, 0);
      } else {
        setShowWarning(true);
      }
      return newStrikes;
    });
  };

  useEffect(() => {
    const onVisChange = () => document.hidden && handleViolation();
    const onBlur = () => handleViolation();

    const onResize = () => {
      if (window.innerWidth < initialSize.current.width * 0.8 || window.innerHeight < initialSize.current.height * 0.8) {
        handleViolation();
      }
    };

    document.addEventListener('visibilitychange', onVisChange);
    window.addEventListener('blur', onBlur);
    window.addEventListener('resize', onResize);

    return () => {
      document.removeEventListener('visibilitychange', onVisChange);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('resize', onResize);
      clearTimeout(violationTimeout.current);
    };
  }, [strikes]);

  useEffect(() => {
    const prevent = e => e.preventDefault();

    document.addEventListener('copy', prevent);
    document.addEventListener('cut', prevent);
    document.addEventListener('paste', prevent);
    document.addEventListener('contextmenu', prevent);

    const blockDev = e => {
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key)) || (e.ctrlKey && e.key === 'U')) {
        e.preventDefault();
        handleViolation();
      }
    };

    document.addEventListener('keydown', blockDev);

    return () => {
      document.removeEventListener('copy', prevent);
      document.removeEventListener('cut', prevent);
      document.removeEventListener('paste', prevent);
      document.removeEventListener('contextmenu', prevent);
      document.removeEventListener('keydown', blockDev);
    };
  }, [strikes]);

  if (isMobile) { return null; }

  return (
    <>
      {!isFullScreen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, background: '#ff4444', color: 'white', padding: '12px', textAlign: 'center', zIndex: 1000 }}>
          Assessment requires full-screen mode
          <button onClick={enterFullScreen} style={{ marginLeft: '20px', padding: '8px 16px', background: '#fff', color: '#000' }}>
            Enter Full Screen
          </button>
        </div>
      )}
      {children}
      {showWarning && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 9999, textAlign: 'center', padding: '20px', fontSize: '2rem' }}>
          <h1>Warning</h1>
          <p>You exited full-screen or switched window.</p>
          <p>Strikes: {strikes} / {MAX_STRIKES}</p>
          <p>Assessment will terminate after {MAX_STRIKES} violations.</p>
          <button
            onClick={() => { setShowWarning(false); enterFullScreen(); }}
            style={{ marginTop: '30px', padding: '15px 40px', fontSize: '1.4rem', background: '#238636', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            Return to Full Screen
          </button>
        </div>
      )}
    </>
  );
};

export default ProctoredLayout;