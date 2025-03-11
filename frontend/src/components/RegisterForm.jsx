import React, { useState, useCallback } from 'react';
import {
    TextField, Button, Typography, Box, Alert,
    InputAdornment, IconButton, CircularProgress
} from '@mui/material';
import {
    Visibility, VisibilityOff, PersonAdd
} from '@mui/icons-material';
import api from '../utils/api';

const RegisterForm = ({ onLoginSuccess }) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError(''); // Clear errors when input changes
    }, []);

    const validateForm = useCallback(() => {
        if (!formData.username) {
            setError('Username is required');
            return false;
        }

        if (!formData.email || !formData.email.includes('@')) {
            setError('A valid email address is required');
            return false;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            return false;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return false;
        }

        return true;
    }, [formData]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMessage('');

        if (!validateForm()) {
            setLoading(false);
            return;
        }

        try {
            // Register user
            await api.auth.register({
                username: formData.username,
                email: formData.email,
                password: formData.password
            });

            // After successful registration, log the user in
            const loginData = await api.auth.login({
                username: formData.username,
                password: formData.password
            });

            // Store the token in localStorage
            localStorage.setItem('authToken', loginData.token);
            localStorage.setItem('username', loginData.username);

            // Show success message
            setSuccessMessage('Registration successful! Logging you in...');

            // Trigger login success callback
            setTimeout(() => {
                onLoginSuccess(formData.username, loginData.role);
            }, 1500);

        } catch (error) {
            setError(error.message || 'Registration failed. Please try again.');
            console.error('Registration Error:', error);
        } finally {
            setLoading(false);
        }
    }, [formData, validateForm, onLoginSuccess]);

    return (
        <Box sx={{ maxWidth: 400, margin: 'auto' }}>
            <Typography
                variant="h4"
                component="h1"
                align="center"
                gutterBottom
                sx={{ fontWeight: 'bold', mb: 3 }}
            >
                Create Your Account
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

            {successMessage && (
                <Alert
                    severity="success"
                    sx={{ mb: 2 }}
                >
                    {successMessage}
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
                    disabled={loading || !!successMessage}
                    required
                    autoFocus
                />

                <TextField
                    label="Email"
                    name="email"
                    type="email"
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={loading || !!successMessage}
                    required
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
                    disabled={loading || !!successMessage}
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

                <TextField
                    label="Confirm Password"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    disabled={loading || !!successMessage}
                    required
                    error={formData.password !== formData.confirmPassword && formData.confirmPassword !== ''}
                    helperText={formData.password !== formData.confirmPassword && formData.confirmPassword !== '' ? 'Passwords do not match' : ''}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    edge="end"
                                    aria-label="toggle confirm password visibility"
                                >
                                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        )
                    }}
                />

                <Button
                    type="submit"
                    variant="contained"
                    color="secondary"
                    fullWidth
                    size="large"
                    disabled={loading || !!successMessage}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PersonAdd />}
                    sx={{
                        mt: 3,
                        mb: 2,
                        py: 1.5,
                        fontWeight: 'bold',
                        '&:hover': {
                            backgroundColor: 'secondary.dark'
                        }
                    }}
                >
                    {loading ? 'Registering...' : 'Create Account'}
                </Button>
            </Box>
        </Box>
    );
};

export default RegisterForm;