import React, { useState } from 'react';

const RegisterForm = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

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

        if (!username || !password) {
            setError('Username and password are required.');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Registration successful
                setSuccessMessage(data.message || 'Registration successful!');
                setError('');
                setUsername('');
                setPassword('');
                console.log('Registration successful:', data);

                // if (onLoginSuccess) {
                //     onLoginSuccess(username);
                // }


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
        }
    };

    return (
        <div style={{
            padding: '20px',
        }}>
            <h2 style={{ marginBottom: '20px', textAlign: 'center', color: '#333' }}>Register</h2>
            {successMessage && <p style={{ color: 'green', marginBottom: '15px', fontWeight: 'bold' }}>{successMessage}</p>}
            {error && <p style={{ color: 'red', marginBottom: '15px', fontWeight: 'bold' }}>{error}</p>}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label htmlFor="username" style={{ marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>Username:</label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={handleUsernameChange}
                        style={{
                            padding: '10px',
                            borderRadius: '5px',
                            border: '1px solid #ccc',
                            fontSize: '1em'
                        }}
                    />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label htmlFor="password" style={{ marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>Password:</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={handlePasswordChange}
                        style={{
                            padding: '10px',
                            borderRadius: '5px',
                            border: '1px solid #ccc',
                            fontSize: '1em'
                        }}
                    />
                </div>
                <button type="submit" style={{
                    padding: '10px 20px',
                    borderRadius: '5px',
                    border: 'none',
                    backgroundColor: '#007bff',
                    color: 'white',
                    fontSize: '1.1em',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    ':hover': { backgroundColor: '#0056b3' } // Example of hover effect (might not work directly in inline styles)
                }}>Register</button>
            </form>
        </div>
    );
};

export default RegisterForm;