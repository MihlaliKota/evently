import React, { useState } from 'react';
import {
    TextField, Button, Typography, Box, Alert,
    InputAdornment, IconButton, CircularProgress
} from '@mui/material';
import {
    Visibility, VisibilityOff, Login as LoginIcon
} from '@mui/icons-material';

const LoginForm = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Centralized API URL configuration
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://evently-production-cd21.up.railway.app';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
    
        try {
            // Comprehensive error logging and handling
            const response = await fetch(`${API_BASE_URL}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Origin': window.location.origin
                },
                credentials: 'include',
                body: JSON.stringify({ username, password }),
            });
    
            const data = await response.json();
    
            // Detailed logging for debugging
            console.group('Login Response');
            console.log('Status:', response.status);
            console.log('Response Data:', data);
            console.groupEnd();
    
            if (response.ok) {
                // Secure token and user info storage
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('username', data.username);
                localStorage.setItem('userRole', data.role || 'user');
    
                // Callback for successful login
                onLoginSuccess(data.username, data.role || 'user');
            } else {
                // User-friendly error messages
                setError(data.error || 'Login failed. Please check your credentials.');
                console.error('Login Error:', data);
            }
        } catch (err) {
            // Network or unexpected error handling
            console.error('Login Network Error:', err);
            setError('Unable to connect to the server. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ maxWidth: 400, margin: 'auto' }}>
            <Typography 
                variant="h4" 
                component="h1" 
                align="center" 
                gutterBottom 
                sx={{ fontWeight: 'bold', mb: 3 }}
            >
                Welcome Back
            </Typography>

            {error && (
                <Alert 
                    severity="error" 
                    sx={{ mb: 2 }}
                    onClose={() => setError('')}
                >
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
                    onChange={(e) => setUsername(e.target.value)}
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
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    onClick={() => setShowPassword(!showPassword)}
                                    edge="end"
                                    aria-label="toggle password visibility"
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
                    sx={{ 
                        mt: 3, 
                        mb: 2, 
                        py: 1.5, 
                        fontWeight: 'bold',
                        '&:hover': {
                            backgroundColor: 'primary.dark'
                        }
                    }}
                >
                    {loading ? 'Logging in...' : 'Login'}
                </Button>
            </Box>
        </Box>
    );
};

export default LoginForm;