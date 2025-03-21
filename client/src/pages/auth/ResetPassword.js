import React, { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import Spinner from '../../components/layout/Spinner';

const ResetPassword = ({ showAlert }) => {
  const [formData, setFormData] = useState({
    password: '',
    password2: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  
  const { resetPassword, isAuthenticated, error } = useContext(AuthContext);
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
    
    const result = await resetPassword(token, password);
    
    setIsLoading(false);
    
    if (result.success) {
      setResetComplete(true);
      showAlert('Password reset successfully. You can now log in with your new password.', 'success');
    } else {
      showAlert(result.error, 'danger');
    }
  };
  
  if (isLoading) {
    return <Spinner />;
  }
  
  return (
    <div className="auth-form">
      <h1 className="text-center">Reset Password</h1>
      
      {resetComplete ? (
        <div className="text-center">
          <p className="mb-4">
            Your password has been reset successfully. You can now log in with your new password.
          </p>
          <Link to="/login" className="btn btn-primary">
            Go to Login
          </Link>
        </div>
      ) : (
        <>
          <p className="text-center mb-4">
            Enter your new password
          </p>
          <form onSubmit={onSubmit}>
            <div className="mb-3">
              <label htmlFor="password" className="form-label">New Password</label>
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
              <label htmlFor="password2" className="form-label">Confirm New Password</label>
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
            <button type="submit" className="btn btn-primary w-100">Reset Password</button>
          </form>
          <div className="mt-3 text-center">
            <Link to="/login">Back to Login</Link>
          </div>
        </>
      )}
    </div>
  );
};

export default ResetPassword;
