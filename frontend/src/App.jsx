import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';
import EventsList from './components/EventsList';
import UserProfile from './components/UserProfile';
import SimpleEventCalendar from './components/SimpleEventCalendar';
import AdminDashboard from './components/AdminDashboard';
import {
    Container, Typography, Box, AppBar, Toolbar, IconButton, CssBaseline,
    useTheme, ThemeProvider, createTheme, Avatar, Button, Drawer, List,
    ListItem, ListItemIcon, ListItemText, Divider, Alert
} from '@mui/material';
import {
    Brightness4, Brightness7, Dashboard as DashboardIcon,
    EventNote, AccountCircle, Menu as MenuIcon, CalendarMonth,
    AdminPanelSettings
} from '@mui/icons-material';
import api from './utils/api';

// Add ErrorBoundary to prevent blank screen on errors
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("React Error Boundary caught an error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <Box sx={{ m: 4, p: 4, border: '1px solid #f44336', borderRadius: 2 }}>
                    <Typography variant="h5" color="error" gutterBottom>
                        Something went wrong
                    </Typography>
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {this.state.error && this.state.error.toString()}
                    </Alert>
                    <Typography variant="body1" gutterBottom>
                        Please try refreshing the page or contact support if the issue persists.
                    </Typography>
                    <Button 
                        variant="contained" 
                        color="primary" 
                        sx={{ mt: 2 }}
                        onClick={() => window.location.reload()}
                    >
                        Refresh Page
                    </Button>
                </Box>
            );
        }
        return this.props.children;
    }
}

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState(null);
    const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [userRole, setUserRole] = useState('user');
    const [activePage, setActivePage] = useState(() => {
        return localStorage.getItem('activePage') || 'dashboard';
    });
    
    // Add state for profile picture
    const [profilePicture, setProfilePicture] = useState(() => {
        return localStorage.getItem('profilePicture') || null;
    });
    
    // Add error state for API issues
    const [apiError, setApiError] = useState(null);

    // Load auth state on mount - only runs once
    useEffect(() => {
        const token = localStorage.getItem('authToken');
        const storedUsername = localStorage.getItem('username');
        const storedRole = localStorage.getItem('userRole');
        const storedProfilePicture = localStorage.getItem('profilePicture');

        if (storedProfilePicture) {
            setProfilePicture(storedProfilePicture);
        }

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
                // Token is invalid, clear auth data
                console.error("Error parsing JWT token:", error);
                localStorage.removeItem('authToken');
                localStorage.removeItem('username');
                localStorage.removeItem('userRole');
                localStorage.removeItem('profilePicture');
                setIsLoggedIn(false);
                setProfilePicture(null);
                setApiError("Authentication error. Please log in again.");
            }
        }
    }, []);

    // Fetch profile data including profile picture when logged in
    useEffect(() => {
        if (isLoggedIn) {
            fetchUserProfile();
        }
    }, [isLoggedIn]);

    // Function to fetch user profile data
    const fetchUserProfile = useCallback(async () => {
        try {
            setApiError(null);
            const profileData = await api.users.getProfile();
            
            if (profileData && profileData.profile_picture) {
                // Store profile picture in state and localStorage
                setProfilePicture(profileData.profile_picture);
                localStorage.setItem('profilePicture', profileData.profile_picture);
                console.log("Profile picture updated:", profileData.profile_picture);
            }
        } catch (error) {
            console.error('Error fetching profile data:', error);
            // Don't set apiError here to prevent blocking the UI
        }
    }, []);

    // Memoize handlers to prevent recreation on each render
    const handleLoginSuccess = useCallback((loggedInUsername, role = 'user') => {
        setIsLoggedIn(true);
        setUsername(loggedInUsername);
        setUserRole(role);
        localStorage.setItem('username', loggedInUsername);
        localStorage.setItem('userRole', role);
        
        // Fetch profile data after successful login
        setTimeout(() => {
            fetchUserProfile();
        }, 500); // Small delay to ensure token is properly set
    }, [fetchUserProfile]);

    const handleLogout = useCallback(() => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('username');
        localStorage.removeItem('userRole');
        localStorage.removeItem('profilePicture');
        setIsLoggedIn(false);
        setUsername(null);
        setUserRole(null);
        setProfilePicture(null);
        setActivePage('dashboard');
    }, []);

    const toggleDrawer = useCallback(() => {
        setDrawerOpen(prev => !prev);
    }, []);

    const navigateTo = useCallback((page) => {
        setActivePage(page);
        localStorage.setItem('activePage', page);
        setDrawerOpen(false);
    }, []);

    const toggleDarkMode = useCallback(() => {
        setDarkMode(prev => {
            const newMode = !prev;
            localStorage.setItem('darkMode', newMode.toString());
            return newMode;
        });
    }, []);

    // Handle profile picture update from UserProfile component
    const handleProfileUpdate = useCallback(() => {
        fetchUserProfile();
    }, [fetchUserProfile]);

    // Memoize theme to prevent unnecessary re-renders
    const theme = useMemo(() => createTheme({
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
            h1: { fontWeight: 600 },
            h2: { fontWeight: 500 },
            h6: { fontWeight: 500 },
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
    }), [darkMode]);

    // Memoize sidebar items to prevent recreation on each render
    const sidebarItems = useMemo(() => [
        { text: 'Dashboard', icon: <DashboardIcon />, page: 'dashboard' },
        { text: 'Events', icon: <EventNote />, page: 'events' },
        { text: 'Calendar', icon: <CalendarMonth />, page: 'calendar' },
        { text: 'Profile', icon: <AccountCircle />, page: 'profile' },
        ...(userRole === 'admin' ? [
            { text: 'Admin Dashboard', icon: <AdminPanelSettings />, page: 'admin-dashboard' }
        ] : [])
    ], [userRole]);

    // Memoize content rendering to prevent unnecessary re-renders
    const appContent = useMemo(() => {
        if (!isLoggedIn) {
            return (
                <>
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
                    <LandingPage onLoginSuccess={handleLoginSuccess} />
                </>
            );
        }

        switch (activePage) {
            case 'events':
                return <EventsList profilePicture={profilePicture} />;
            case 'calendar':
                return <SimpleEventCalendar />;
            case 'profile':
                return <UserProfile onProfileUpdate={handleProfileUpdate} />;
            case 'admin-dashboard':
                return userRole === 'admin' ? 
                    <AdminDashboard profilePicture={profilePicture} /> : 
                    <Dashboard username={username} profilePicture={profilePicture} />;
            case 'dashboard':
            default:
                return (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                        <Dashboard username={username} profilePicture={profilePicture} />
                    </Box>
                );
        }
    }, [isLoggedIn, activePage, username, userRole, profilePicture, handleLoginSuccess, handleProfileUpdate]);

    return (
        <ErrorBoundary>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                {apiError && (
                    <Alert 
                        severity="error" 
                        sx={{ mb: 0 }}
                        onClose={() => setApiError(null)}
                    >
                        {apiError}
                    </Alert>
                )}
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
                                    <IconButton onClick={toggleDarkMode} color="inherit">
                                        {darkMode ? <Brightness7 /> : <Brightness4 />}
                                    </IconButton>
                                    <Button
                                        color="inherit"
                                        onClick={() => navigateTo('profile')}
                                        startIcon={
                                            <Avatar
                                                src={profilePicture || ''}
                                                sx={{ 
                                                    width: 24, 
                                                    height: 24, 
                                                    bgcolor: 'primary.contrastText' 
                                                }}
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
                    {appContent}
                </Container>
            </ThemeProvider>
        </ErrorBoundary>
    );
}

export default App;