import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Welcome.css';

function Welcome() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch current user information
    fetch('/api/user')
      .then(response => {
        if (!response.ok) {
          throw new Error('Not authenticated');
        }
        return response.json();
      })
      .then(data => {
        setUser(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching user:', error);
        // Redirect to login if not authenticated
        navigate('/login');
      });
  }, [navigate]);

  const handleLogout = () => {
    fetch('/api/logout', { method: 'POST' })
      .then(() => {
        navigate('/login');
      })
      .catch(error => {
        console.error('Error logging out:', error);
        navigate('/login');
      });
  };

  if (loading) {
    return (
      <div className="welcome-container">
        <div className="welcome-card">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="welcome-container">
      <div className="welcome-card">
        <h1>Welcome!</h1>
        {user && (
          <div className="user-info">
            <p className="greeting">Hello, <strong>{user.name}</strong></p>
            {user.email && (
              <p className="email">{user.email}</p>
            )}
            {user.provider && (
              <p className="provider">Signed in with {user.provider}</p>
            )}
          </div>
        )}
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}

export default Welcome;
