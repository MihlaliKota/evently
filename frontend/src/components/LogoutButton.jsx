import React from 'react';

const LogoutButton = ({ onLogout }) => {

    const handleClick = () => {
        localStorage.removeItem('authToken');
        console.log('JWT token removed from localStorage. User logged out.');

        if (onLogout) {
            onLogout();
        }

        alert('Logged out successfully!');
    };

    return (
        <button onClick={handleClick} style={{
            padding: '10px 20px',
            borderRadius: '5px',
            border: 'none',
            backgroundColor: '#dc3545', // Red color for logout
            color: 'white',
            fontSize: '1.1em',
            cursor: 'pointer',
            fontWeight: 'bold',
            ':hover': { backgroundColor: '#c82333' } // Example hover effect
        }}>Logout</button>
    );
};

export default LogoutButton;