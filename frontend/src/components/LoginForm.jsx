import React, { useState, useCallback } from 'react';
import {
    TextField, Button, Typography, Box, Alert,
    InputAdornment, IconButton, CircularProgress
} from '@mui/material';
import {
    Visibility, VisibilityOff, Login as LoginIcon
} from '@mui/icons-material';
import api from '../utils/api';

const LoginForm = ({ onLoginSuccess }) => {
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError(''); // Clear errors when input changes
    }, []);

    const togglePasswordVisibility = useCallback(() => {
        setShowPassword(prev => !prev);
    }, []);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            const { username, password } = formData;
            
            if (!username || !password) {
                throw new Error('Username and password are required');
            }
            
            const data = await api.auth.login({
                username,
                password
            });
    
            // Store token and handle login success
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('username', data.username);
            
            // Notify parent component of successful login
            onLoginSuccess(data.username, data.role);
            
        } catch (error) {
            setError(error.message || 'Login failed. Please check your credentials.');
            console.error('Login Error:', error);
        } finally {
            setLoading(false);
        }
    }, [formData, onLoginSuccess]);

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
                    name="username"
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    value={formData.username}
                    onChange={handleInputChange}
                    disabled={loading}
                    required
                    autoFocus
                />

                <TextField
                    label="Password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={loading}
                    required
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    onClick={togglePasswordVisibility}
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