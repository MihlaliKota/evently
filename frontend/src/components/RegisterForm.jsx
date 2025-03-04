// RegisterForm.jsx
import React, { useState } from 'react';
import { 
    TextField, Button, Typography, Box, Alert, 
    InputAdornment, IconButton, CircularProgress,
    Paper
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
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

    const handleConfirmPasswordChange = (e) => {
        setConfirmPassword(e.target.value);
        setError('');
        setSuccessMessage('');
    };

    const handleEmailChange = (e) => {
        setEmail(e.target.value);
        setError('');
        setSuccessMessage('');
    };

    const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Add admin code input
    const adminCode = prompt('Enter admin code (optional):');

    try {
        const response = await fetch('http://localhost:5000/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                username, 
                password, 
                email, 
                adminCode  // Include admin code
            }),
        });

        const data = await response.json();
        
        // Enhanced logging
        console.group('Registration Response');
        console.log('Status:', response.status);
        console.log('Response Data:', data);
        console.log('Assigned Role:', data.role);
        console.groupEnd();

        if (response.ok) {
            // Additional checks
            if (data.role === 'admin') {
                console.log('🎉 Successfully registered as ADMIN');
            } else {
                console.warn('Registered as regular user');
            }
        }
    } catch (err) {
        console.error('Registration Error:', err);
    }
};

    return (
        <Box>
            <Typography variant="h5" component="h2" align="center" gutterBottom sx={{ fontWeight: 'bold' }}>
                Create New Account
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
                    label="Email"
                    type="email"
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    value={email}
                    onChange={handleEmailChange}
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
                
                <TextField
                    label="Confirm Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
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
                    sx={{ mt: 3, mb: 2, py: 1.5, fontWeight: 'bold' }}
                >
                    {loading ? 'Registering...' : 'Create Account'}
                </Button>
            </Box>
        </Box>
    );
};

export default RegisterForm;