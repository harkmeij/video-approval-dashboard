import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

// Context
import { AuthProvider } from './context/AuthContext';

// Components
import Navbar from './components/layout/Navbar';
import Alert from './components/layout/Alert';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import SetupPassword from './pages/auth/SetupPassword';
import ResetPassword from './pages/auth/ResetPassword';
import ForgotPassword from './pages/auth/ForgotPassword';
import Dashboard from './pages/Dashboard';
import VideoDetails from './pages/VideoDetails';
import UserManagement from './pages/admin/UserManagement';
import AddUser from './pages/admin/AddUser';
import EditUser from './pages/admin/EditUser';
import VideoManagement from './pages/admin/VideoManagement';
import AddVideo from './pages/admin/AddVideo';
import ClientDashboard from './pages/admin/ClientDashboard';
import AddClient from './pages/admin/AddClient';
import ClientPage from './pages/admin/ClientPage';
import SocialMediaAccounts from './pages/admin/SocialMediaAccounts';
import SocialMediaMetrics from './pages/admin/SocialMediaMetrics';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Set default headers for axios
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Add auth token to headers if available
const token = localStorage.getItem('token');
if (token) {
  axios.defaults.headers.common['x-auth-token'] = token;
}

// Set base URL for axios if available
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
if (API_URL) {
  axios.defaults.baseURL = API_URL;
}

const App = () => {
  const [alert, setAlert] = useState(null);

  // Show alert
  const showAlert = (message, type, timeout = 5000) => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), timeout);
  };

  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <div className="container mt-4">
            {alert && <Alert alert={alert} />}
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login showAlert={showAlert} />} />
              <Route path="/register" element={<Register showAlert={showAlert} />} />
              <Route path="/setup-password/:token" element={<SetupPassword showAlert={showAlert} />} />
              <Route path="/reset-password/:token" element={<ResetPassword showAlert={showAlert} />} />
              <Route path="/forgot-password" element={<ForgotPassword showAlert={showAlert} />} />
              
              {/* Private Routes */}
              <Route path="/" element={<PrivateRoute><Dashboard showAlert={showAlert} /></PrivateRoute>} />
              <Route path="/videos/:id" element={<PrivateRoute><VideoDetails showAlert={showAlert} /></PrivateRoute>} />
              <Route path="/profile" element={<PrivateRoute><Profile showAlert={showAlert} /></PrivateRoute>} />
              
              {/* Admin Routes */}
              <Route path="/admin/users" element={<AdminRoute><UserManagement showAlert={showAlert} /></AdminRoute>} />
              <Route path="/admin/users/add" element={<AdminRoute><AddUser showAlert={showAlert} /></AdminRoute>} />
              <Route path="/admin/users/edit/:userId" element={<AdminRoute><EditUser showAlert={showAlert} /></AdminRoute>} />
              <Route path="/admin/videos" element={<AdminRoute><VideoManagement showAlert={showAlert} /></AdminRoute>} />
              <Route path="/admin/videos/add" element={<AdminRoute><AddVideo showAlert={showAlert} /></AdminRoute>} />
              <Route path="/admin/clients" element={<AdminRoute><ClientDashboard showAlert={showAlert} /></AdminRoute>} />
              <Route path="/admin/add-client" element={<AdminRoute><AddClient showAlert={showAlert} /></AdminRoute>} />
              <Route path="/admin/clients/:clientId" element={<AdminRoute><ClientPage showAlert={showAlert} /></AdminRoute>} />
              
              {/* Social Media Routes */}
              <Route path="/admin/social-media/accounts" element={<AdminRoute><SocialMediaAccounts showAlert={showAlert} /></AdminRoute>} />
              <Route path="/admin/social-media/metrics" element={<AdminRoute><SocialMediaMetrics showAlert={showAlert} /></AdminRoute>} />
              
              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
};

// Private Route component
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

// Admin Route component
const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  
  if (!token) {
    return <Navigate to="/login" />;
  }
  
  if (user && user.role !== 'editor') {
    return <Navigate to="/" />;
  }
  
  return children;
};

export default App;
