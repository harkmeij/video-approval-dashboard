import React, { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import Spinner from '../../components/layout/Spinner';

const SetupPassword = ({ showAlert }) => {
  const [formData, setFormData] = useState({
    password: '',
    password2: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  
  const { setupPassword, isAuthenticated, error } = useContext(AuthContext);
  const navigate = useNavigate();
  const { token } = useParams();
  
  const { password, password2 } = formData;
  
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
    
    if (password !== password2) {
      showAlert('Passwords do not match', 'danger');
      return;
    }
    
    if (password.length < 6) {
      showAlert('Password must be at least 6 characters', 'danger');
      return;
    }
    
    setIsLoading(true);
    
    const result = await setupPassword(token, password);
    
    setIsLoading(false);
    
    if (result.success) {
      showAlert('Password set successfully. You can now log in.', 'success');
      navigate('/login');
    } else {
      showAlert(result.error, 'danger');
    }
  };
  
  if (isLoading) {
    return <Spinner />;
  }
  
  return (
    <div className="auth-form">
      <h1 className="text-center">Set Up Password</h1>
      <p className="text-center mb-4">
        Create a password for your account
      </p>
      <form onSubmit={onSubmit}>
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
        <button type="submit" className="btn btn-primary w-100">Set Password</button>
      </form>
      <div className="mt-3 text-center">
        <Link to="/login">Back to Login</Link>
      </div>
    </div>
  );
};

export default SetupPassword;
