import React, { useState } from 'react';
import {
    TextField, Button, Typography, Box, Alert,
    InputAdornment, IconButton, CircularProgress
} from '@mui/material';
import {
    Visibility, VisibilityOff, Login as LoginIcon
} from '@mui/icons-material';
import { fetchApi } from '../utils/api';

const LoginForm = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = await fetchApi('/api/register', {
                method: 'POST',
                body: JSON.stringify({ username, password, email })
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries([...response.headers]));

            // Detailed logging for debugging
            console.group('Login Response');
            console.log('Status:', response.status);
            console.log('Response Data:', data);
            console.groupEnd();

            if (response.ok) {
                // Secure token and user info storage
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('username', data.username);
                onLoginSuccess(data.username, data.role || 'user');

            } else {
                // User-friendly error messages
                setError(data.error || 'Login failed. Please check your credentials.');
                console.error('Login Error:', data);
            }
        } catch (error) {
            setError(error.message);
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