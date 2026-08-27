// src/context/AuthContext.jsx

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef
} from 'react';

import axios from 'axios';


const AuthContext = createContext();


export const useAuth = () =>
  useContext(AuthContext);


export const AuthProvider = ({ children }) => {

  const [user, setUser] = useState(null);

  const [token, setToken] = useState(
    localStorage.getItem('accessToken')
  );

  const [loading, setLoading] = useState(true);


  /*
   * Prevent multiple requests from
   * refreshing the token simultaneously.
   */

  const isRefreshing = useRef(false);

  const refreshPromise = useRef(null);


  const BACKEND_URL =
    'http://localhost:5050';


  axios.defaults.baseURL =
    `${BACKEND_URL}/api`;


  // =====================================================
  // LOCAL STORAGE FLAGS
  // =====================================================

  const syncLocalStorageFlags = (
    step,
    resumeUrl = null
  ) => {

    if (!step) return;


    if (resumeUrl) {

      localStorage.setItem(
        'resumeUploaded',
        'true'
      );

    }


    if (step !== 'info') {

      localStorage.setItem(
        'resumeUploaded',
        'true'
      );

      localStorage.setItem(
        'jdUploaded',
        'true'
      );

    }


    if (
      ['video', 'coding', 'completed']
        .includes(step)
    ) {

      localStorage.setItem(
        'mcqCompleted',
        'true'
      );

    }


    if (
      ['coding', 'completed']
        .includes(step)
    ) {

      localStorage.setItem(
        'videoCompleted',
        'true'
      );

    }


    if (step === 'completed') {

      localStorage.setItem(
        'codingCompleted',
        'true'
      );

    }

  };


  // =====================================================
  // SET ACCESS TOKEN
  // =====================================================

  const setAccessToken = (newToken) => {

    localStorage.setItem(
      'accessToken',
      newToken
    );


    setToken(newToken);


    axios.defaults.headers.common[
      'Authorization'
    ] =
      `Bearer ${newToken}`;

  };


  // =====================================================
  // CLEAR AUTH
  // =====================================================

  const clearAuth = () => {

    localStorage.removeItem(
      'accessToken'
    );

    localStorage.removeItem(
      'refreshToken'
    );

    localStorage.removeItem(
      'token'
    );


    setToken(null);

    setUser(null);


    delete axios.defaults.headers.common[
      'Authorization'
    ];

  };


  // =====================================================
  // REFRESH ACCESS TOKEN
  // =====================================================

  const refreshAccessToken = async () => {

    /*
     * If another API request is already
     * refreshing the token, wait for it.
     */

    if (isRefreshing.current) {

      return refreshPromise.current;

    }


    isRefreshing.current = true;


    refreshPromise.current =
      (async () => {

        try {

          const refreshToken =
            localStorage.getItem(
              'refreshToken'
            );


          if (!refreshToken) {

            throw new Error(
              'No refresh token available'
            );

          }


          console.log(
            '[Auth] Access token expired. Refreshing...'
          );


          /*
           * IMPORTANT:
           *
           * This request does NOT require
           * the expired access token.
           */

          const response =
            await axios.post(
              '/user/refresh',
              {
                refreshToken
              }
            );


          const newAccessToken =
            response.data.accessToken;


          if (!newAccessToken) {

            throw new Error(
              'No access token returned'
            );

          }


          /*
           * Save the new access token.
           */

          setAccessToken(
            newAccessToken
          );


          console.log(
            '[Auth] Access token refreshed successfully'
          );


          return newAccessToken;

        }

        catch (error) {

          console.error(
            '[Auth] Refresh failed:',
            error
          );


          /*
           * Refresh token itself is invalid.
           * User must genuinely login again.
           */

          clearAuth();


          window.location.href =
            '/login';


          throw error;

        }

        finally {

          isRefreshing.current = false;

          refreshPromise.current = null;

        }

      })();


    return refreshPromise.current;

  };


  // =====================================================
  // AXIOS RESPONSE INTERCEPTOR
  // =====================================================

  useEffect(() => {

    const interceptor =
      axios.interceptors.response.use(

        /*
         * Successful requests
         */

        (response) => {

          return response;

        },


        /*
         * Failed requests
         */

        async (error) => {

          const originalRequest =
            error.config;


          if (!originalRequest) {

            return Promise.reject(error);

          }


          /*
           * Check whether the backend
           * specifically says the access token
           * has expired.
           */

          const tokenExpired =
            error.response?.status === 401 &&
            error.response?.data?.code ===
              'TOKEN_EXPIRED';


          /*
           * Never intercept the refresh request itself.
           */

          const isRefreshRequest =
            originalRequest.url?.includes(
              '/user/refresh'
            );


          /*
           * Only refresh once per request.
           */

          if (
            tokenExpired &&
            !isRefreshRequest &&
            !originalRequest._retry
          ) {

            originalRequest._retry = true;


            try {

              /*
               * Get new access token.
               */

              const newAccessToken =
                await refreshAccessToken();


              /*
               * Add new token to
               * original failed request.
               */

              originalRequest.headers =
                originalRequest.headers || {};


              originalRequest.headers[
                'Authorization'
              ] =
                `Bearer ${newAccessToken}`;


              /*
               * Retry original request.
               */

              return axios(
                originalRequest
              );

            }

            catch (refreshError) {

              return Promise.reject(
                refreshError
              );

            }

          }


          return Promise.reject(
            error
          );

        }

      );


    /*
     * Remove interceptor when
     * AuthProvider unmounts.
     */

    return () => {

      axios.interceptors.response.eject(
        interceptor
      );

    };

  }, []);


  // =====================================================
  // INITIAL AUTH RESTORATION
  // =====================================================

  useEffect(() => {

    const initAuth = async () => {

      const storedToken =
        localStorage.getItem(
          'accessToken'
        );


      /*
       * No access token.
       */

      if (!storedToken) {

        setLoading(false);

        return;

      }


      /*
       * Put stored token into React state.
       */

      setToken(
        storedToken
      );


      /*
       * Put stored token into Axios.
       */

      axios.defaults.headers.common[
        'Authorization'
      ] =
        `Bearer ${storedToken}`;


      try {

        /*
         * If access token is valid,
         * this works normally.
         *
         * If access token has expired,
         * Axios interceptor automatically
         * refreshes it.
         */

        const response =
          await axios.get(
            '/user/me'
          );


        const userData =
          response.data.user ||
          response.data;


        setUser(
          userData
        );


        syncLocalStorageFlags(
          userData.currentStep,
          userData.resumeUrl
        );

      }

      catch (error) {

        console.error(
          '[Auth] Failed to restore authentication:',
          error
        );

      }

      finally {

        setLoading(false);

      }

    };


    initAuth();

  }, []);


  // =====================================================
  // LOGIN
  // =====================================================

  const login = async (
    email,
    password
  ) => {

    const response =
      await axios.post(
        '/user/login',
        {
          email,
          password
        }
      );


    const userData =
      response.data.user;


    const accessToken =
      response.data.token ||
      response.data.accessToken;


    const refreshToken =
      response.data.refreshToken;


    /*
     * Backend MUST return access token.
     */

    if (!accessToken) {

      throw new Error(
        'Access token missing from login response'
      );

    }


    /*
     * Backend MUST return refresh token.
     */

    if (!refreshToken) {

      throw new Error(
        'Refresh token missing from login response'
      );

    }


    /*
     * Save access token.
     */

    setAccessToken(
      accessToken
    );


    /*
     * Save refresh token.
     */

    localStorage.setItem(
      'refreshToken',
      refreshToken
    );


    /*
     * Save user.

     */

    setUser(
      userData
    );


    syncLocalStorageFlags(
      userData.currentStep,
      userData.resumeUrl
    );


    return userData;

  };


  // =====================================================
  // REFRESH USER
  // =====================================================

  const refreshUser = async (
    freshUserData = null
  ) => {

    /*
     * If caller already has user data,
     * don't make another request.
     */

    if (freshUserData) {

      setUser(
        freshUserData
      );


      syncLocalStorageFlags(
        freshUserData.currentStep,
        freshUserData.resumeUrl
      );


      return freshUserData;

    }


    try {

      const response =
        await axios.get(
          '/user/me'
        );


      const userData =
        response.data.user ||
        response.data;


      setUser(
        userData
      );


      syncLocalStorageFlags(
        userData.currentStep,
        userData.resumeUrl
      );


      return userData;

    }

    catch (error) {

      console.error(
        '[Auth] refreshUser failed:',
        error
      );


      throw error;

    }

  };


  // =====================================================
  // LOGOUT
  // =====================================================

  const logout = () => {

    clearAuth();


    /*
     * Keep interview progress flags.
     */

    window.location.href =
      '/login';

  };


  // =====================================================
  // PROVIDER
  // =====================================================

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