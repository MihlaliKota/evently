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
        setError('');
        setSuccessMessage('');
        setLoading(true);

        if (!username || !password || !confirmPassword || !email) {
            setError('All fields are required.');
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password, email }),
            });

            const data = await response.json();

            if (response.ok) {
                // Registration successful
                setSuccessMessage(data.message || 'Registration successful! You can now log in.');
                setError('');
                setUsername('');
                setPassword('');
                setConfirmPassword('');
                setEmail('');
                
                // If the API returns a token automatically after registration
                if (data.token) {
                    localStorage.setItem('authToken', data.token);
                    console.log('JWT token stored in localStorage after registration');
                    
                    if (onLoginSuccess) {
                        onLoginSuccess(username);
                    }
                }
            } else {
                // Registration failed
                setError(data.error || 'Registration failed.');
                setSuccessMessage('');
                console.error('Registration failed:', data);
            }

        } catch (err) {
            setError('Failed to connect to server. Please try again later.');
            setSuccessMessage('');
            console.error('Fetch error during registration:', err);
        } finally {
            setLoading(false);
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