import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';
import EventsList from './components/EventsList';
import UserProfile from './components/UserProfile';
import SimpleEventCalendar from './components/SimpleEventCalendar';
import AdminDashboard from './components/AdminDashboard';
import { AdminPanelSettings, PeopleAlt, Security } from '@mui/icons-material'

import {
    Container, Typography, Box, AppBar, Toolbar, IconButton, CssBaseline,
    useTheme, ThemeProvider, createTheme, Avatar, Button, Drawer, List,
    ListItem, ListItemIcon, ListItemText, Divider, Chip
} from '@mui/material';
import {
    Brightness4, Brightness7, Dashboard as DashboardIcon,
    EventNote, AccountCircle, Menu as MenuIcon, CalendarMonth,
    Event, Comment
} from '@mui/icons-material';

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState(null);
    const [darkMode, setDarkMode] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [activePage, setActivePage] = useState('dashboard');
    const [userRole, setUserRole] = useState('user');

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        const storedUsername = localStorage.getItem('username');
        const storedRole = localStorage.getItem('userRole');

        if (token) {
            try {
                const payload = token.split('.')[1];
                const decodedPayload = JSON.parse(atob(payload));

                setIsLoggedIn(true);
                setUsername(storedUsername);

                if (decodedPayload.role) {
                    setUserRole(decodedPayload.role);
                    if (decodedPayload.role !== storedRole) {
                        localStorage.setItem('userRole', decodedPayload.role);
                    }
                } else if (storedRole) {
                    setUserRole(storedRole);
                }
            } catch (error) {
                console.error('Token Decoding Error:', error);
                localStorage.removeItem('authToken');
                localStorage.removeItem('username');
                localStorage.removeItem('userRole');
                setIsLoggedIn(false);
            }
        }
    }, []);

    useEffect(() => {
        const handleNavigation = (event) => {
            if (event.detail && typeof event.detail === 'string') {
                setActivePage(event.detail);
            }
        };

        window.addEventListener('navigate', handleNavigation);

        return () => {
            window.removeEventListener('navigate', handleNavigation);
        };
    }, []);

    const handleLoginSuccess = (loggedInUsername, role = 'user') => {
        setIsLoggedIn(true);
        setUsername(loggedInUsername);
        setUserRole(role);
        localStorage.setItem('username', loggedInUsername);
        localStorage.setItem('userRole', role);
    };

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('username');
        setIsLoggedIn(false);
        setUsername(null);
        setUserRole(null);
        setActivePage('dashboard');
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
                </Box>
            );
        } else if (activePage === 'events') {
            return <EventsList />;
        } else if (activePage === 'calendar') {
            return <SimpleEventCalendar />;
        } else if (activePage === 'profile') {
            return <UserProfile />;
        } else if (activePage === 'admin-dashboard' && userRole === 'admin') {
            return <AdminDashboard />;
        } else {
            // Fallback to dashboard if page not found or not authorized
            return (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                    <Dashboard username={username} />
                </Box>
            );
        }
    };

    const sidebarItems = [
        { text: 'Dashboard', icon: <DashboardIcon />, page: 'dashboard' },
        { text: 'Events', icon: <EventNote />, page: 'events' },
        { text: 'Calendar', icon: <CalendarMonth />, page: 'calendar' },
        { text: 'Profile', icon: <AccountCircle />, page: 'profile' },

        ...(userRole === 'admin' ? [
            { text: 'Admin Dashboard', icon: <AdminPanelSettings />, page: 'admin-dashboard' },
            { text: 'User Management', icon: <PeopleAlt />, page: 'admin-users' },
            { text: 'Content Moderation', icon: <Security />, page: 'admin-moderation' }
        ] : [])
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
                maxWidth={false}
                sx={{
                    mt: 4,
                    mb: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
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