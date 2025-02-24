import React from 'react';
import RegisterForm from './RegisterForm';
import LoginForm from './LoginForm';

const LandingPage = ({ onLoginSuccess }) => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '40px',
            fontFamily: 'Arial, sans-serif',
        }}>
            <header style={{
                marginBottom: '30px',
                textAlign: 'center',
            }}>
                <h1 style={{
                    fontSize: '2.5em',
                    color: '#333',
                    marginBottom: '10px',
                }}>Welcome to Evently</h1>
                <p style={{
                    fontSize: '1.1em',
                    color: '#666',
                }}>Your platform for organizing and managing events.</p>
            </header>

            <main style={{
                display: 'flex',
                justifyContent: 'space-around',
                width: '80%',
                maxWidth: '900px',
                marginBottom: '30px',
            }}>
                <div style={{
                    padding: '20px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    width: '45%',
                }}>
                    <RegisterForm onLoginSuccess={onLoginSuccess} />
                </div>
                <div style={{
                    padding: '20px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    width: '45%',
                }}>
                    <LoginForm onLoginSuccess={onLoginSuccess} />
                </div>
            </main>

            <footer style={{
                textAlign: 'center',
                marginTop: '20px',
                color: '#888',
            }}>
                <p>&copy; 2024 Evently. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default LandingPage;