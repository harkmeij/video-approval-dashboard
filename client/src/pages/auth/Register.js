import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import Spinner from '../../components/layout/Spinner';

const Register = ({ showAlert }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password2: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  
  const { register, isAuthenticated, error } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const { name, email, password, password2 } = formData;
  
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
    
    if (!name || !email || !password) {
      showAlert('Please enter all fields', 'danger');
      return;
    }
    
    if (password !== password2) {
      showAlert('Passwords do not match', 'danger');
      return;
    }
    
    if (password.length < 6) {
      showAlert('Password must be at least 6 characters', 'danger');
      return;
    }
    
    setIsLoading(true);
    
    const result = await register(name, email, password);
    
    setIsLoading(false);
    
    if (result.success) {
      showAlert('Registration successful', 'success');
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
      <h1 className="text-center">Register</h1>
      <form onSubmit={onSubmit}>
        <div className="mb-3">
          <label htmlFor="name" className="form-label">Name</label>
          <input
            type="text"
            className="form-control"
            id="name"
            name="name"
            value={name}
            onChange={onChange}
            required
          />
        </div>
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
            minLength="6"
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="password2" className="form-label">Confirm Password</label>
          <input
            type="password"
            className="form-control"
            id="password2"
            name="password2"
            value={password2}
            onChange={onChange}
            minLength="6"
            required
          />
        </div>
        <button type="submit" className="btn btn-primary w-100">Register</button>
      </form>
      <div className="mt-3 text-center">
        Already have an account? <Link to="/login">Login</Link>
      </div>
    </div>
  );
};

export default Register;
