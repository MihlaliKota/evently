import React, { useState, useEffect } from 'react';
import LogoutButton from './components/LogOutButton';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';
import EventsList from './components/EventsList';

// Material UI Components
import { 
    Container, Typography, Box, AppBar, Toolbar, IconButton, CssBaseline, 
    useTheme, ThemeProvider, createTheme, Avatar, Button, Drawer, List,
    ListItem, ListItemIcon, ListItemText, Divider
} from '@mui/material';
import { 
    Brightness4, Brightness7, Dashboard as DashboardIcon, 
    EventNote, AccountCircle, Menu as MenuIcon
} from '@mui/icons-material';

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState(null);
    const [darkMode, setDarkMode] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [activePage, setActivePage] = useState('dashboard');

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (token) {
            setIsLoggedIn(true);
            // Try to get username from localStorage if available
            const savedUsername = localStorage.getItem('username');
            if (savedUsername) {
                setUsername(savedUsername);
            }
        }
    }, []);

    const handleLoginSuccess = (loggedInUsername) => {
        setIsLoggedIn(true);
        setUsername(loggedInUsername);
        localStorage.setItem('username', loggedInUsername);
    };

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('username');
        setIsLoggedIn(false);
        setUsername(null);
        console.log('JWT token removed from localStorage. User logged out.');
    };

    const theme = createTheme({
        palette: {
            mode: darkMode ? 'dark' : 'light',
            primary: { 
                main: darkMode ? '#90caf9' : '#3f51b5' 
            },
            secondary: { 
                main: darkMode ? '#f48fb1' : '#f50057' 
            },
            background: {
                default: darkMode ? '#303030' : '#f5f5f5',
                paper: darkMode ? '#424242' : '#ffffff',
            },
        },
        typography: {
            fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
            h1: {
                fontWeight: 600,
            },
            h2: {
                fontWeight: 500,
            },
            h6: {
                fontWeight: 500,
            },
        },
        shape: {
            borderRadius: 8,
        },
        components: {
            MuiButton: {
                styleOverrides: {
                    root: {
                        textTransform: 'none',
                        fontWeight: 500,
                    },
                },
            },
            MuiPaper: {
                styleOverrides: {
                    root: {
                        boxShadow: darkMode ? '0px 3px 15px rgba(0,0,0,0.2)' : '0px 3px 15px rgba(0,0,0,0.1)',
                    },
                },
            },
        },
    });

    const toggleDrawer = () => {
        setDrawerOpen(!drawerOpen);
    };

    const navigateTo = (page) => {
        setActivePage(page);
        setDrawerOpen(false);
    };

    const renderAppContent = () => {
        if (activePage === 'dashboard') {
            return (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                    <Dashboard username={username} />
                    <Box sx={{ mt: 4, width: '100%', maxWidth: 'md' }}>
                        <EventsList />
                    </Box>
                </Box>
            );
        } else if (activePage === 'events') {
            return <EventsList />;
        } else if (activePage === 'profile') {
            return (
                <Box sx={{ mt: 4, textAlign: 'center' }}>
                    <Avatar sx={{ width: 100, height: 100, mx: 'auto', mb: 2, bgcolor: 'primary.main' }}>
                        {username ? username[0].toUpperCase() : 'U'}
                    </Avatar>
                    <Typography variant="h4" gutterBottom>
                        {username || 'User'}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                        Member since {new Date().toLocaleDateString()}
                    </Typography>
                    <Button 
                        variant="outlined" 
                        color="primary" 
                        sx={{ mt: 2 }}
                        onClick={handleLogout}
                    >
                        Logout
                    </Button>
                </Box>
            );
        }
    };

    const sidebarItems = [
        { text: 'Dashboard', icon: <DashboardIcon />, page: 'dashboard' },
        { text: 'Events', icon: <EventNote />, page: 'events' },
        { text: 'Profile', icon: <AccountCircle />, page: 'profile' },
    ];

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            {isLoggedIn && (
                <>
                    <AppBar position="static" color="primary" elevation={0}>
                        <Toolbar sx={{ justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <IconButton 
                                    edge="start" 
                                    color="inherit" 
                                    aria-label="menu"
                                    onClick={toggleDrawer}
                                    sx={{ mr: 2 }}
                                >
                                    <MenuIcon />
                                </IconButton>
                                <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
                                    Evently
                                </Typography>
                            </Box>
                            <Box>
                                <IconButton onClick={() => setDarkMode(!darkMode)} color="inherit">
                                    {darkMode ? <Brightness7 /> : <Brightness4 />}
                                </IconButton>
                                <Button 
                                    color="inherit" 
                                    onClick={() => navigateTo('profile')}
                                    startIcon={
                                        <Avatar 
                                            sx={{ width: 24, height: 24, bgcolor: 'primary.contrastText' }}
                                        >
                                            {username ? username[0].toUpperCase() : 'U'}
                                        </Avatar>
                                    }
                                >
                                    {username || 'User'}
                                </Button>
                            </Box>
                        </Toolbar>
                    </AppBar>
                    
                    <Drawer
                        anchor="left"
                        open={drawerOpen}
                        onClose={toggleDrawer}
                    >
                        <Box sx={{ width: 250 }} role="presentation">
                            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                                    Evently
                                </Typography>
                            </Box>
                            <Divider />
                            <List>
                                {sidebarItems.map((item) => (
                                    <ListItem 
                                        button 
                                        key={item.text}
                                        onClick={() => navigateTo(item.page)}
                                        selected={activePage === item.page}
                                    >
                                        <ListItemIcon>{item.icon}</ListItemIcon>
                                        <ListItemText primary={item.text} />
                                    </ListItem>
                                ))}
                            </List>
                            <Divider />
                            <Box sx={{ p: 2 }}>
                                <Button 
                                    variant="outlined" 
                                    color="error" 
                                    fullWidth
                                    onClick={handleLogout}
                                >
                                    Logout
                                </Button>
                            </Box>
                        </Box>
                    </Drawer>
                </>
            )}

            <Container 
                maxWidth="lg" 
                sx={{ 
                    mt: 4, 
                    mb: 8,
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    px: { xs: 2, sm: 3 }
                }}
            >
                {!isLoggedIn && (
                    <Typography 
                        variant="h2" 
                        component="h1" 
                        align="center" 
                        gutterBottom
                        sx={{ 
                            fontWeight: 'bold',
                            backgroundImage: 'linear-gradient(45deg, #3f51b5, #f50057)',
                            backgroundClip: 'text',
                            color: 'transparent',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            mb: 4
                        }}
                    >
                        Evently
                    </Typography>
                )}

                {isLoggedIn ? (
                    renderAppContent()
                ) : (
                    <LandingPage onLoginSuccess={handleLoginSuccess} />
                )}
            </Container>
        </ThemeProvider>
    );
}

export default App;