import React, { useState } from 'react';
import { 
    TextField, Button, Typography, Box, Alert, 
    InputAdornment, IconButton, CircularProgress
} from '@mui/material';
import { 
    Visibility, VisibilityOff, PersonAdd
} from '@mui/icons-material';

const RegisterForm = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Centralized API URL configuration
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://evently-production-cd21.up.railway.app';

    const validateForm = () => {
        if (!username) {
            setError('Username is required');
            return false;
        }

        if (!email || !email.includes('@')) {
            setError('A valid email address is required');
            return false;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters long');
            return false;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        // Validate form before submission
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        
        // Optional admin code
        const adminCode = prompt('Enter admin code (optional):');
    
        try {
            const response = await fetch(`${API_BASE_URL}/api/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    username, 
                    password, 
                    email, 
                    adminCode  // Optional admin registration
                }),
            });
    
            const data = await response.json();
            
            // Detailed logging
            console.group('Registration Response');
            console.log('Status:', response.status);
            console.log('Response Data:', data);
            console.log('Assigned Role:', data.role);
            console.groupEnd();
    
            if (response.ok) {
                // Clear form on successful registration
                setUsername('');
                setPassword('');
                setConfirmPassword('');
                setEmail('');

                // Provide specific feedback based on registration type
                const registrationType = data.role === 'admin' 
                    ? 'Admin registration successful!' 
                    : 'Registration successful!';

                // Trigger login success callback
                setTimeout(() => {
                    onLoginSuccess(username, data.role);
                }, 1500);
                
            } else {
                // Handle registration errors
                setError(data.error || 'Registration failed. Please try again.');
                console.error('Registration Error:', data);
            }
    
        } catch (err) {
            console.error('Network Registration Error:', err);
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
                    label="Email"
                    type="email"
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
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
                
                <TextField
                    label="Confirm Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    required
                    error={password !== confirmPassword && confirmPassword !== ''}
                    helperText={password !== confirmPassword && confirmPassword !== '' ? 'Passwords do not match' : ''}
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
                    disabled={loading}
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