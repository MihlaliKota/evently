import React, { useState, useEffect } from 'react';
import LogoutButton from './components/LogOutButton';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage'; // Import LandingPage
import authFetch from './utils/authFetch';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState(null);
  const [protectedData, setProtectedData] = useState(null);
  const [protectedError, setProtectedError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);


  const handleLoginSuccess = (loggedInUsername) => {
    setIsLoggedIn(true);
    setUsername(loggedInUsername);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setIsLoggedIn(false);
    setUsername(null);
    setProtectedData(null);
    setProtectedError(null);
    console.log('JWT token removed from localStorage. User logged out.');
    alert('Logged out successfully!');
  };


  const handleFetchProtectedData = async () => {
    setProtectedData(null);
    setProtectedError(null);

    try {
      const response = await authFetch('http://localhost:5000/api/protected');

      if (response.ok) {
        const data = await response.json();
        setProtectedData(data);
        setProtectedError(null);
        console.log('Protected data fetched successfully:', data);
      } else {
        setProtectedError(`Failed to fetch protected data. Status: ${response.status}`);
        setProtectedData(null);
        console.error('Failed to fetch protected data:', response);
      }
    } catch (error) {
      setProtectedError('Error fetching protected data: ' + error.message);
      setProtectedData(null);
      console.error('Error during protected data fetch:', error);
    }
  };


  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
      <h1>Evently</h1> {/*  You can keep this for now for app title, or remove it */}

      {isLoggedIn ? (
        <Dashboard username={username} />
      ) : (
        <LandingPage onLoginSuccess={handleLoginSuccess} /> /* Render LandingPage when not logged in */
      )}

      {isLoggedIn && (
        <>
          <LogoutButton onLogout={handleLogout} />
          <button onClick={handleFetchProtectedData} style={{
            padding: '10px 20px',
            borderRadius: '5px',
            border: 'none',
            backgroundColor: '#28a745', // Green color for fetch data (example)
            color: 'white',
            fontSize: '1.1em',
            cursor: 'pointer',
            fontWeight: 'bold',
            marginTop: '20px', // Add some margin above the button
            ':hover': { backgroundColor: '#1e7e34' } // Example hover effect
          }}>Fetch Protected Data</button>
          {protectedError && <p style={{ color: 'red' }}>{protectedError}</p>}
          {protectedData && (
            <div>
              <h3>Protected Data:</h3>
              <pre>{JSON.stringify(protectedData, null, 2)}</pre>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;