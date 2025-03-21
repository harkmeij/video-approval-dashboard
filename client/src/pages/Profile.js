import React, { useState, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import Spinner from '../components/layout/Spinner';

const Profile = ({ showAlert }) => {
  const { user, updateProfile, changePassword } = useContext(AuthContext);
  
  const [profileData, setProfileData] = useState({
    name: user ? user.name : ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  const { name } = profileData;
  const { currentPassword, newPassword, confirmPassword } = passwordData;
  
  const onProfileChange = e => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };
  
  const onPasswordChange = e => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };
  
  const onProfileSubmit = async e => {
    e.preventDefault();
    
    if (!name) {
      showAlert('Name is required', 'danger');
      return;
    }
    
    setProfileLoading(true);
    
    const result = await updateProfile(name);
    
    setProfileLoading(false);
    
    if (result.success) {
      showAlert('Profile updated successfully', 'success');
    } else {
      showAlert(result.error, 'danger');
    }
  };
  
  const onPasswordSubmit = async e => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      showAlert('Passwords do not match', 'danger');
      return;
    }
    
    if (newPassword.length < 6) {
      showAlert('Password must be at least 6 characters', 'danger');
      return;
    }
    
    setPasswordLoading(true);
    
    const result = await changePassword(currentPassword, newPassword);
    
    setPasswordLoading(false);
    
    if (result.success) {
      showAlert('Password changed successfully', 'success');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } else {
      showAlert(result.error, 'danger');
    }
  };
  
  if (!user) {
    return <Spinner />;
  }
  
  return (
    <div>
      <h1 className="mb-4">Profile</h1>
      
      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Update Profile</h5>
            </div>
            <div className="card-body">
              <form onSubmit={onProfileSubmit}>
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="name"
                    name="name"
                    value={name}
                    onChange={onProfileChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    value={user.email}
                    disabled
                  />
                  <div className="form-text">Email cannot be changed</div>
                </div>
                <div className="mb-3">
                  <label htmlFor="role" className="form-label">Role</label>
                  <input
                    type="text"
                    className="form-control"
                    id="role"
                    value={user.role === 'editor' ? 'Editor' : 'Client'}
                    disabled
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={profileLoading}
                >
                  {profileLoading ? 'Updating...' : 'Update Profile'}
                </button>
              </form>
            </div>
          </div>
        </div>
        
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Change Password</h5>
            </div>
            <div className="card-body">
              <form onSubmit={onPasswordSubmit}>
                <div className="mb-3">
                  <label htmlFor="currentPassword" className="form-label">Current Password</label>
                  <input
                    type="password"
                    className="form-control"
                    id="currentPassword"
                    name="currentPassword"
                    value={currentPassword}
                    onChange={onPasswordChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="newPassword" className="form-label">New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    id="newPassword"
                    name="newPassword"
                    value={newPassword}
                    onChange={onPasswordChange}
                    minLength="6"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={onPasswordChange}
                    minLength="6"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={passwordLoading}
                >
                  {passwordLoading ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
