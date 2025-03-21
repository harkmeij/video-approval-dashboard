import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import Spinner from '../../components/layout/Spinner';

const Login = ({ showAlert }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, isAuthenticated, error } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const { email, password } = formData;
  
  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      navigate('/');
    }
    
    // Show error alert if there is an error
    if (error) {
      showAlert(error, 'danger');
    }
  }, [isAuthenticated, navigate, error, showAlert]);
  
  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const onSubmit = async e => {
    e.preventDefault();
    
    if (!email || !password) {
      showAlert('Please enter all fields', 'danger');
      return;
    }
    
    setIsLoading(true);
    
    const result = await login(email, password);
    
    setIsLoading(false);
    
    if (result.success) {
      showAlert('Login successful', 'success');
      navigate('/');
    } else {
      showAlert(result.error, 'danger');
    }
  };
  
  if (isLoading) {
    return <Spinner />;
  }
  
  return (
    <div className="auth-form">
      <h1 className="text-center">Login</h1>
      <form onSubmit={onSubmit}>
        <div className="mb-3">
          <label htmlFor="email" className="form-label">Email</label>
          <input
            type="email"
            className="form-control"
            id="email"
            name="email"
            value={email}
            onChange={onChange}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="password" className="form-label">Password</label>
          <input
            type="password"
            className="form-control"
            id="password"
            name="password"
            value={password}
            onChange={onChange}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary w-100">Login</button>
      </form>
      <div className="mt-3 text-center">
        <Link to="/forgot-password">Forgot Password?</Link>
      </div>
      <div className="mt-2 text-center">
        Don't have an account? <Link to="/register">Register</Link>
      </div>
    </div>
  );
};

export default Login;
