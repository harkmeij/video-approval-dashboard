import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Spinner from '../../components/layout/Spinner';

const UserManagement = ({ showAlert }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get('/api/users');
        setUsers(res.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching users:', err.response?.data?.message || err.message);
        showAlert('Error fetching users', 'danger');
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, [showAlert]);
  
  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        setDeleting(userId);
        
        await axios.delete(`/api/users/${userId}`);
        
        setUsers(users.filter(user => user.id !== userId));
        setDeleting(null);
        
        showAlert('User deleted successfully', 'success');
      } catch (err) {
        console.error('Error deleting user:', err.response?.data?.message || err.message);
        showAlert(err.response?.data?.message || 'Error deleting user', 'danger');
        setDeleting(null);
      }
    }
  };
  
  if (loading) {
    return <Spinner />;
  }
  
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>User Management</h1>
        <Link to="/admin/users/add" className="btn btn-primary">
          Add User
        </Link>
      </div>
      
      {users.length === 0 ? (
        <div className="alert alert-info">No users found</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`badge ${user.role === 'editor' ? 'bg-primary' : 'bg-secondary'}`}>
                      {user.role === 'editor' ? 'Editor' : 'Client'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${user.active ? 'bg-success' : 'bg-warning text-dark'}`}>
                      {user.active ? 'Active' : 'Pending'}
                    </span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="btn-group" role="group">
                      <Link 
                        to={`/admin/users/edit/${user.id}`} 
                        className="btn btn-sm btn-outline-primary"
                      >
                        Edit
                      </Link>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(user.id)}
                        disabled={deleting === user.id}
                      >
                        {deleting === user.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
