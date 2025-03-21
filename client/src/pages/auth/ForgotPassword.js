import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import Spinner from '../../components/layout/Spinner';

const ForgotPassword = ({ showAlert }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  const { forgotPassword, isAuthenticated, error } = useContext(AuthContext);
  const navigate = useNavigate();
  
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
    setEmail(e.target.value);
  };
  
  const onSubmit = async e => {
    e.preventDefault();
    
    if (!email) {
      showAlert('Please enter your email', 'danger');
      return;
    }
    
    setIsLoading(true);
    
    const result = await forgotPassword(email);
    
    setIsLoading(false);
    
    if (result.success) {
      setEmailSent(true);
      showAlert('Password reset email sent. Please check your inbox.', 'success');
    } else {
      showAlert(result.error, 'danger');
    }
  };
  
  if (isLoading) {
    return <Spinner />;
  }
  
  return (
    <div className="auth-form">
      <h1 className="text-center">Forgot Password</h1>
      {emailSent ? (
        <div className="text-center">
          <p className="mb-4">
            A password reset link has been sent to your email address. Please check your inbox and follow the instructions to reset your password.
          </p>
          <Link to="/login" className="btn btn-primary">
            Back to Login
          </Link>
        </div>
      ) : (
        <>
          <p className="text-center mb-4">
            Enter your email address and we'll send you a link to reset your password.
          </p>
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
            <button type="submit" className="btn btn-primary w-100">Send Reset Link</button>
          </form>
          <div className="mt-3 text-center">
            <Link to="/login">Back to Login</Link>
          </div>
        </>
      )}
    </div>
  );
};

export default ForgotPassword;
