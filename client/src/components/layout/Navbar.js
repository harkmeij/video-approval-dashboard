import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate('/login');
  };

  const authLinks = (
    <ul className="navbar-nav ms-auto">
      {user && user.role === 'editor' && (
        <li className="nav-item dropdown">
          <a
            className="nav-link dropdown-toggle"
            href="#!"
            id="adminDropdown"
            role="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            Admin
          </a>
          <ul className="dropdown-menu" aria-labelledby="adminDropdown">
            <li>
              <Link className="dropdown-item" to="/admin/users">
                Manage Users
              </Link>
            </li>
            <li>
              <Link className="dropdown-item" to="/admin/videos">
                Manage Videos
              </Link>
            </li>
            <li>
              <Link className="dropdown-item" to="/admin/clients">
                Client Dashboard
              </Link>
            </li>
            <li>
              <Link className="dropdown-item" to="/admin/users/add">
                Add Client
              </Link>
            </li>
            <li><hr className="dropdown-divider" /></li>
            <li>
              <h6 className="dropdown-header">Social Media</h6>
            </li>
            <li>
              <Link className="dropdown-item" to="/admin/social-media/accounts">
                <i className="fas fa-hashtag me-1"></i> Manage Accounts
              </Link>
            </li>
            <li>
              <Link className="dropdown-item" to="/admin/social-media/metrics">
                <i className="fas fa-chart-line me-1"></i> Performance Metrics
              </Link>
            </li>
          </ul>
        </li>
      )}
      <li className="nav-item">
        <Link className="nav-link" to="/profile">
          Profile
        </Link>
      </li>
      <li className="nav-item">
        <a onClick={onLogout} className="nav-link" href="#!">
          Logout
        </a>
      </li>
    </ul>
  );

  const guestLinks = (
    <ul className="navbar-nav ms-auto">
      <li className="nav-item">
        <Link className="nav-link" to="/login">
          Login
        </Link>
      </li>
      <li className="nav-item">
        <Link className="nav-link" to="/register">
          Register
        </Link>
      </li>
    </ul>
  );

  return (
    <nav className="navbar navbar-expand-lg navbar-light">
      <div className="container py-2">
        <Link className="navbar-brand" to="/">
          Video Approval Dashboard
        </Link>
        <button
          className="navbar-toggler border-0"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarMain"
          aria-controls="navbarMain"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarMain">
          {isAuthenticated ? authLinks : guestLinks}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
