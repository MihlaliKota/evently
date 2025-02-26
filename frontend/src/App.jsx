import React, { useState, useEffect } from 'react';
import LogoutButton from './components/LogOutButton';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';
import EventsList from './components/EventsList';
// Import Material UI components
import { Container, Typography, Box, AppBar, Toolbar } from '@mui/material';

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState(null);

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
        console.log('JWT token removed from localStorage. User logged out.');
        alert('Logged out successfully!');
    };

    return (
        <>
            {isLoggedIn && (
                <AppBar position="static" color="primary">
                    <Toolbar sx={{ justifyContent: 'space-between' }}>
                        <Typography variant="h6" component="div">
                            Evently
                        </Typography>
                        <LogoutButton onLogout={handleLogout} />
                    </Toolbar>
                </AppBar>
            )}
            
            <Container maxWidth="md" sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {!isLoggedIn && (
                    <Typography variant="h2" component="h1" align="center" gutterBottom>
                        Evently
                    </Typography>
                )}

                {isLoggedIn ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                        <Dashboard username={username} />
                        <Box sx={{ mt: 4, width: '100%', maxWidth: 'md' }}>
                            <EventsList />
                        </Box>
                    </Box>
                ) : (
                    <LandingPage onLoginSuccess={handleLoginSuccess} />
                )}
            </Container>
        </>
    );
}

export default App;