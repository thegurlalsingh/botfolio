// AuthContext: provides React authentication state, login/logout actions, user profile restoration, and an Axios interceptor for automatic token refresh.
import { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('accessToken'));
  const [loading, setLoading] = useState(true);
  const isRefreshing = useRef(false);
  const refreshPromise = useRef(null);

  const BACKEND_URL = 'https://botfolio-backend-final.onrender.com';
  axios.defaults.baseURL = `${BACKEND_URL}/api`;

  const syncLocalStorageFlags = (step, resumeUrl = null) => {
    if (!step) {
      return;
    }
    if (resumeUrl) {
      localStorage.setItem('resumeUploaded', 'true');
    }
    if (step !== 'info') {
      localStorage.setItem('resumeUploaded', 'true');
      localStorage.setItem('jdUploaded', 'true');
    }
    if (['video', 'coding', 'completed'].includes(step)) {
      localStorage.setItem('mcqCompleted', 'true');
    }
    if (['coding', 'completed'].includes(step)) {
      localStorage.setItem('videoCompleted', 'true');
    }
    if (step === 'completed') {
      localStorage.setItem('codingCompleted', 'true');
    }
  };

  const setAccessToken = (newToken) => {
    localStorage.setItem('accessToken', newToken);
    setToken(newToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  };

  const clearAuth = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const refreshAccessToken = async () => {
    if (isRefreshing.current) {
      return refreshPromise.current;
    }
    isRefreshing.current = true;
    refreshPromise.current = (async () => {
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        console.log('[Auth] Access token expired. Refreshing...');
        const response = await axios.post('/user/refresh', { refreshToken });
        const newAccessToken = response.data.accessToken;
        if (!newAccessToken) {
          throw new Error('No access token returned');
        }
        setAccessToken(newAccessToken);
        console.log('[Auth] Access token refreshed successfully');
        return newAccessToken;
      } catch (error) {
        console.error('[Auth] Refresh failed:', error);
        clearAuth();
        window.location.href = '/login';
        throw error;
      } finally {
        isRefreshing.current = false;
        refreshPromise.current = null;
      }
    })();
    return refreshPromise.current;
  };

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error) => {
        const originalRequest = error.config;
        if (!originalRequest) {
          return Promise.reject(error);
        }
        const tokenExpired = error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED';
        const isRefreshRequest = originalRequest.url?.includes('/user/refresh');
        if (tokenExpired && !isRefreshRequest && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const newAccessToken = await refreshAccessToken();
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
            return axios(originalRequest);
          } catch (refreshError) {
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('accessToken');
      if (!storedToken) {
        setLoading(false);
        return;
      }
      setToken(storedToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      try {
        const response = await axios.get('/user/me');
        const userData = response.data.user || response.data;
        setUser(userData);
        syncLocalStorageFlags(userData.currentStep, userData.resumeUrl);
      } catch (error) {
        console.error('[Auth] Failed to restore authentication:', error);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const response = await axios.post('/user/login', { email, password });
    const userData = response.data.user;
    const accessToken = response.data.token || response.data.accessToken;
    const refreshToken = response.data.refreshToken;
    if (!accessToken) {
      throw new Error('Access token missing from login response');
    }
    if (!refreshToken) {
      throw new Error('Refresh token missing from login response');
    }
    setAccessToken(accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setUser(userData);
    syncLocalStorageFlags(userData.currentStep, userData.resumeUrl);
    return userData;
  };

  const refreshUser = async (freshUserData = null) => {
    if (freshUserData) {
      setUser(freshUserData);
      syncLocalStorageFlags(freshUserData.currentStep, freshUserData.resumeUrl);
      return freshUserData;
    }
    try {
      const response = await axios.get('/user/me');
      const userData = response.data.user || response.data;
      setUser(userData);
      syncLocalStorageFlags(userData.currentStep, userData.resumeUrl);
      return userData;
    } catch (error) {
      console.error('[Auth] refreshUser failed:', error);
      throw error;
    }
  };

  const logout = () => {
    clearAuth();
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        loading,
        refreshUser,
        refreshAccessToken
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
