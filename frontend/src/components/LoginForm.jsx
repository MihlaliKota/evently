// LoginForm.jsx
import React, { useState } from 'react';
import {
    TextField, Button, Typography, Box, Alert,
    InputAdornment, IconButton, CircularProgress,
    Paper
} from '@mui/material';
import {
    Visibility, VisibilityOff, Login as LoginIcon
} from '@mui/icons-material';

const LoginForm = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleUsernameChange = (e) => {
        setUsername(e.target.value);
        setError('');
        setSuccessMessage('');
    };

    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
        setError('');
        setSuccessMessage('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setLoading(true);
    
        if (!username || !password) {
            setError('Username and password are required.');
            setLoading(false);
            return;
        }
    
        try {
            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
            const response = await fetch(`${apiUrl}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Add Origin header to help with CORS
                    'Origin': window.location.origin
                },
                credentials: 'include', // This is important for CORS and cookies
                body: JSON.stringify({ username, password }),
            });
    
            const data = await response.json();
    
            // Log full response for debugging
            console.log('Full login response:', {
                status: response.status,
                headers: Object.fromEntries(response.headers.entries()),
                body: data
            });
    
            if (response.ok) {
                // Login successful
                setSuccessMessage(data.message || 'Login successful!');
                setError('');
                
                // Store token and user info
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('username', data.username);
                localStorage.setItem('userRole', data.role);
    
                if (onLoginSuccess) {
                    onLoginSuccess(data.username);
                }
            } else {
                // Login failed
                setError(data.error || 'Login failed.');
                setSuccessMessage('');
                console.error('Login failed:', data);
            }
    
        } catch (err) {
            setError('Failed to connect to server. Please try again later.');
            setSuccessMessage('');
            console.error('Fetch error during login:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box>
            <Typography variant="h5" component="h2" align="center" gutterBottom sx={{ fontWeight: 'bold' }}>
                Login to Your Account
            </Typography>

            {successMessage && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    {successMessage}
                </Alert>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                <TextField
                    label="Username"
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    value={username}
                    onChange={handleUsernameChange}
                    disabled={loading}
                    required
                    autoFocus
                />

                <TextField
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    value={password}
                    onChange={handlePasswordChange}
                    disabled={loading}
                    required
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    onClick={() => setShowPassword(!showPassword)}
                                    edge="end"
                                >
                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        )
                    }}
                />

                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="large"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
                    sx={{ mt: 3, mb: 2, py: 1.5, fontWeight: 'bold' }}
                >
                    {loading ? 'Logging in...' : 'Login'}
                </Button>
            </Box>
        </Box>
    );
};

export default LoginForm;