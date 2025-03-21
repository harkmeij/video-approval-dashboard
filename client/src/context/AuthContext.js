import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user on initial render
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        setAuthToken(token);
        try {
          // Fetch user data from the server
          const response = await axios.get(`${API_URL}/api/auth/me`);
          
          if (response.data) {
            // Normalize the user data to handle potential nulls for new fields
            const normalizedUser = {
              ...response.data,
              // Ensure keywords is always an array
              keywords: Array.isArray(response.data.keywords) ? response.data.keywords : [],
              // Ensure website_url is always a string
              website_url: response.data.website_url || '',
              // Ensure location is always a string
              location: response.data.location || ''
            };
            
            setUser(normalizedUser);
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
            setIsAuthenticated(false);
          }
        } catch (err) {
          console.error('Error loading user:', err);
          const errorResponse = err.response?.data;
          const errorMessage = errorResponse?.message || 'Failed to load user';
          const debugInfo = process.env.NODE_ENV === 'development' 
            ? `Debug: ${JSON.stringify(errorResponse || err.message || err)}`
            : '';
          
          const fullErrorMessage = debugInfo 
            ? `${errorMessage} - ${debugInfo}`
            : errorMessage;
          
          setError(fullErrorMessage);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [token]);

  // Set auth token in axios headers
  const setAuthToken = (token) => {
    if (token) {
      axios.defaults.headers.common['x-auth-token'] = token;
      localStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['x-auth-token'];
      localStorage.removeItem('token');
    }
  };

  // Set base URL for axios if API_URL is configured
  if (API_URL) {
    axios.defaults.baseURL = API_URL;
  }

  // Add request interceptor to ensure token is set for every request
  axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers['x-auth-token'] = token;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Register user
  const register = async (name, email, password) => {
    try {
      // Make API request to register endpoint
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        name,
        email,
        password
      });
      
      const { token, user } = response.data;
      
      setToken(token);
      setAuthToken(token);
      setUser(user);
      setIsAuthenticated(true);
      setLoading(false);
      setError(null);
      
      // Store user in localStorage for role-based routing
      localStorage.setItem('user', JSON.stringify(user));
      
      return { success: true };
    } catch (err) {
      console.error('Registration error:', err);
      const errorResponse = err.response?.data;
      const errorMessage = errorResponse?.message || 'Registration failed';
      const debugInfo = process.env.NODE_ENV === 'development' 
        ? `Debug: ${JSON.stringify(errorResponse || err.message || err)}`
        : '';
      
      const fullErrorMessage = debugInfo 
        ? `${errorMessage} - ${debugInfo}`
        : errorMessage;
      
      setError(fullErrorMessage);
      return { success: false, error: fullErrorMessage };
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      // Make API request to login endpoint
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password
      });
      
      const { token, user } = response.data;
      
      setToken(token);
      setAuthToken(token);
      setUser(user);
      setIsAuthenticated(true);
      setLoading(false);
      setError(null);
      
      // Store user in localStorage for role-based routing
      localStorage.setItem('user', JSON.stringify(user));
      
      return { success: true };
    } catch (err) {
      console.error('Login error:', err);
      const errorResponse = err.response?.data;
      const errorMessage = errorResponse?.message || 'Login failed';
      const debugInfo = process.env.NODE_ENV === 'development' 
        ? `Debug: ${JSON.stringify(errorResponse || err.message || err)}`
        : '';
      
      const fullErrorMessage = debugInfo 
        ? `${errorMessage} - ${debugInfo}`
        : errorMessage;
      
      setError(fullErrorMessage);
      return { success: false, error: fullErrorMessage };
    }
  };

  // Logout user
  const logout = () => {
    setToken(null);
    setAuthToken(null);
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // Setup password
  const setupPassword = async (token, password) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/setup-password`, {
        token,
        password
      });
      
      setError(null);
      return { success: true, message: response.data.message };
    } catch (err) {
      console.error('Password setup error:', err);
      const errorResponse = err.response?.data;
      const errorMessage = errorResponse?.message || 'Password setup failed';
      const debugInfo = process.env.NODE_ENV === 'development' 
        ? `Debug: ${JSON.stringify(errorResponse || err.message || err)}`
        : '';
      
      const fullErrorMessage = debugInfo 
        ? `${errorMessage} - ${debugInfo}`
        : errorMessage;
      
      setError(fullErrorMessage);
      return { success: false, error: fullErrorMessage };
    }
  };

  // Reset password
  const resetPassword = async (token, password) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/reset-password`, {
        token,
        password
      });
      
      setError(null);
      return { success: true, message: response.data.message };
    } catch (err) {
      console.error('Password reset error:', err);
      const errorResponse = err.response?.data;
      const errorMessage = errorResponse?.message || 'Password reset failed';
      const debugInfo = process.env.NODE_ENV === 'development' 
        ? `Debug: ${JSON.stringify(errorResponse || err.message || err)}`
        : '';
      
      const fullErrorMessage = debugInfo 
        ? `${errorMessage} - ${debugInfo}`
        : errorMessage;
      
      setError(fullErrorMessage);
      return { success: false, error: fullErrorMessage };
    }
  };

  // Forgot password
  const forgotPassword = async (email) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/forgot-password`, {
        email
      });
      
      setError(null);
      return { success: true, message: response.data.message };
    } catch (err) {
      console.error('Forgot password error:', err);
      const errorResponse = err.response?.data;
      const errorMessage = errorResponse?.message || 'Failed to send password reset email';
      const debugInfo = process.env.NODE_ENV === 'development' 
        ? `Debug: ${JSON.stringify(errorResponse || err.message || err)}`
        : '';
      
      const fullErrorMessage = debugInfo 
        ? `${errorMessage} - ${debugInfo}`
        : errorMessage;
      
      setError(fullErrorMessage);
      return { 
        success: false, 
        error: fullErrorMessage
      };
    }
  };

  // Update profile
  const updateProfile = async (name) => {
    try {
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      setAuthToken(token);
      
      const response = await axios.put(`${API_URL}/api/users/profile`, {
        name
      });
      
      const updatedUser = { ...user, name };
      setUser(updatedUser);
      
      // Update user in localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setError(null);
      return { success: true, message: response.data.message };
    } catch (err) {
      console.error('Update profile error:', err);
      const errorResponse = err.response?.data;
      const errorMessage = errorResponse?.message || 'Failed to update profile';
      const debugInfo = process.env.NODE_ENV === 'development' 
        ? `Debug: ${JSON.stringify(errorResponse || err.message || err)}`
        : '';
      
      const fullErrorMessage = debugInfo 
        ? `${errorMessage} - ${debugInfo}`
        : errorMessage;
      
      setError(fullErrorMessage);
      return { 
        success: false, 
        error: fullErrorMessage
      };
    }
  };

  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      setAuthToken(token);
      
      const response = await axios.put(`${API_URL}/api/users/password`, {
        currentPassword,
        newPassword
      });
      
      setError(null);
      return { success: true, message: response.data.message };
    } catch (err) {
      console.error('Change password error:', err);
      const errorResponse = err.response?.data;
      const errorMessage = errorResponse?.message || 'Failed to change password';
      const debugInfo = process.env.NODE_ENV === 'development' 
        ? `Debug: ${JSON.stringify(errorResponse || err.message || err)}`
        : '';
      
      const fullErrorMessage = debugInfo 
        ? `${errorMessage} - ${debugInfo}`
        : errorMessage;
      
      setError(fullErrorMessage);
      return { 
        success: false, 
        error: fullErrorMessage
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        isAuthenticated,
        loading,
        user,
        error,
        register,
        login,
        logout,
        setupPassword,
        resetPassword,
        forgotPassword,
        updateProfile,
        changePassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
