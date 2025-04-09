import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';
import EventsList from './components/EventsList';
import UserProfile from './components/UserProfile';
import SimpleEventCalendar from './components/SimpleEventCalendar';
import AdminDashboard from './components/AdminDashboard';
import NotificationsMenu from './components/NotificationsMenu';
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
    // Enhanced theme for both light and dark modes
    const theme = useMemo(() => createTheme({
        palette: {
            mode: darkMode ? 'dark' : 'light',
            primary: {
                main: darkMode ? '#82b1ff' : '#4f6af0', // More vibrant blue
                light: darkMode ? '#b6e3ff' : '#7b96ff',
                dark: darkMode ? '#4d82cb' : '#3949ab',
                contrastText: '#ffffff',
            },
            secondary: {
                main: darkMode ? '#ff80ab' : '#ff3366', // More vibrant pink/red
                light: darkMode ? '#ffb2dd' : '#ff6b8b',
                dark: darkMode ? '#c94f7c' : '#c4001d',
                contrastText: '#ffffff',
            },
            error: {
                main: darkMode ? '#ff8a80' : '#f44336',
                light: darkMode ? '#ffbcaf' : '#ff7961',
                dark: darkMode ? '#c85a54' : '#ba000d',
            },
            warning: {
                main: darkMode ? '#ffd180' : '#ff9800',
                light: darkMode ? '#ffffb0' : '#ffc947',
                dark: darkMode ? '#caa052' : '#c77800',
            },
            info: {
                main: darkMode ? '#82b1ff' : '#2196f3',
                light: darkMode ? '#b6e3ff' : '#64b5f6',
                dark: darkMode ? '#4d82cb' : '#0d47a1',
            },
            success: {
                main: darkMode ? '#b9f6ca' : '#4caf50',
                light: darkMode ? '#ecfffd' : '#80e27e',
                dark: darkMode ? '#88c399' : '#087f23',
            },
            background: {
                default: darkMode ? '#121212' : '#f9f9fc', // Slightly blue-tinted white for light mode
                paper: darkMode ? '#1e1e1e' : '#ffffff',
                subtle: darkMode ? '#2c2c2c' : '#f5f7fa', // For subtle highlights
            },
            text: {
                primary: darkMode ? '#e0e0e0' : '#2c2c2c',
                secondary: darkMode ? '#b0b0b0' : '#5f6368',
                disabled: darkMode ? '#6e6e6e' : '#9aa0a6',
            },
            divider: darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
        },
        typography: {
            fontFamily: '"Inter", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
            fontSize: 14,
            fontWeightLight: 300,
            fontWeightRegular: 400,
            fontWeightMedium: 500,
            fontWeightBold: 600,
            h1: {
                fontWeight: 700,
                fontSize: '2.5rem',
                lineHeight: 1.3,
                letterSpacing: '-0.01562em',
            },
            h2: {
                fontWeight: 600,
                fontSize: '2rem',
                lineHeight: 1.35,
                letterSpacing: '-0.00833em',
            },
            h3: {
                fontWeight: 600,
                fontSize: '1.75rem',
                lineHeight: 1.375,
                letterSpacing: '0em',
            },
            h4: {
                fontWeight: 600,
                fontSize: '1.5rem',
                lineHeight: 1.375,
                letterSpacing: '0.00735em',
            },
            h5: {
                fontWeight: 600,
                fontSize: '1.25rem',
                lineHeight: 1.375,
                letterSpacing: '0em',
            },
            h6: {
                fontWeight: 600,
                fontSize: '1.125rem',
                lineHeight: 1.4,
                letterSpacing: '0.0075em',
            },
            subtitle1: {
                fontWeight: 500,
                fontSize: '1rem',
                lineHeight: 1.5,
                letterSpacing: '0.00938em',
            },
            subtitle2: {
                fontWeight: 500,
                fontSize: '0.875rem',
                lineHeight: 1.57,
                letterSpacing: '0.00714em',
            },
            body1: {
                fontWeight: 400,
                fontSize: '1rem',
                lineHeight: 1.5,
                letterSpacing: '0.00938em',
            },
            body2: {
                fontWeight: 400,
                fontSize: '0.875rem',
                lineHeight: 1.43,
                letterSpacing: '0.01071em',
            },
            button: {
                fontWeight: 500,
                fontSize: '0.875rem',
                lineHeight: 1.75,
                letterSpacing: '0.02857em',
                textTransform: 'none', // No uppercase transformation
            },
            caption: {
                fontWeight: 400,
                fontSize: '0.75rem',
                lineHeight: 1.66,
                letterSpacing: '0.03333em',
            },
            overline: {
                fontWeight: 500,
                fontSize: '0.75rem',
                lineHeight: 2.66,
                letterSpacing: '0.08333em',
            },
        },
        shape: {
            borderRadius: 10, // Slightly increased for a more modern look
        },
        shadows: [
            'none',
            '0px 2px 4px rgba(0,0,0,0.03), 0px 1px 2px rgba(0,0,0,0.06)',
            '0px 4px 8px rgba(0,0,0,0.04), 0px 2px 4px rgba(0,0,0,0.08)',
            '0px 6px 12px rgba(0,0,0,0.05), 0px 3px 6px rgba(0,0,0,0.1)',
            '0px 8px 16px rgba(0,0,0,0.06), 0px 4px 8px rgba(0,0,0,0.12)',
            // ... additional shadow definitions ...
            '0px 24px 38px rgba(0,0,0,0.14), 0px 9px 46px rgba(0,0,0,0.12), 0px 11px 15px rgba(0,0,0,0.2)',
        ],
        components: {
            MuiCssBaseline: {
                styleOverrides: {
                    body: {
                        scrollbarWidth: 'thin',
                        '&::-webkit-scrollbar': {
                            width: '8px',
                            height: '8px',
                        },
                        '&::-webkit-scrollbar-track': {
                            background: darkMode ? '#1e1e1e' : '#f1f1f1',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            background: darkMode ? '#555555' : '#c1c1c1',
                            borderRadius: '4px',
                        },
                        '&::-webkit-scrollbar-thumb:hover': {
                            background: darkMode ? '#666666' : '#a1a1a1',
                        },
                    },
                },
            },
            MuiButton: {
                styleOverrides: {
                    root: {
                        textTransform: 'none',
                        fontWeight: 500,
                        padding: '8px 20px',
                        borderRadius: '8px',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: darkMode ? '0 4px 12px rgba(130, 177, 255, 0.3)' : '0 4px 12px rgba(79, 106, 240, 0.15)',
                        },
                    },
                    contained: {
                        boxShadow: darkMode ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
                    },
                    outlined: {
                        borderWidth: '1.5px',
                        '&:hover': {
                            borderWidth: '1.5px',
                        },
                    },
                    text: {
                        '&:hover': {
                            backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                        },
                    },
                    containedPrimary: {
                        background: darkMode
                            ? 'linear-gradient(45deg, #4d82cb 10%, #82b1ff 90%)'
                            : 'linear-gradient(45deg, #3949ab 10%, #4f6af0 90%)',
                        '&:hover': {
                            background: darkMode
                                ? 'linear-gradient(45deg, #4d82cb 20%, #82b1ff 100%)'
                                : 'linear-gradient(45deg, #3949ab 20%, #4f6af0 100%)',
                        },
                    },
                    containedSecondary: {
                        background: darkMode
                            ? 'linear-gradient(45deg, #c94f7c 10%, #ff80ab 90%)'
                            : 'linear-gradient(45deg, #c4001d 10%, #ff3366 90%)',
                        '&:hover': {
                            background: darkMode
                                ? 'linear-gradient(45deg, #c94f7c 20%, #ff80ab 100%)'
                                : 'linear-gradient(45deg, #c4001d 20%, #ff3366 100%)',
                        },
                    },
                },
            },
            MuiPaper: {
                styleOverrides: {
                    root: {
                        backgroundImage: 'none',
                        boxShadow: darkMode
                            ? '0 3px 15px rgba(0, 0, 0, 0.4)'
                            : '0 3px 15px rgba(0, 0, 0, 0.05)',
                        border: darkMode
                            ? '1px solid rgba(255, 255, 255, 0.05)'
                            : '1px solid rgba(0, 0, 0, 0.02)',
                    },
                    rounded: {
                        borderRadius: '12px',
                    },
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: darkMode
                            ? '0 4px 15px rgba(0, 0, 0, 0.3)'
                            : '0 4px 15px rgba(0, 0, 0, 0.06)',
                        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                        '&:hover': {
                            boxShadow: darkMode
                                ? '0 8px 25px rgba(0, 0, 0, 0.5)'
                                : '0 8px 25px rgba(0, 0, 0, 0.1)',
                        },
                    },
                },
            },
            MuiTextField: {
                styleOverrides: {
                    root: {
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '8px',
                            transition: 'all 0.2s ease-in-out',
                            '&.Mui-focused': {
                                boxShadow: darkMode
                                    ? '0 0 0 2px rgba(130, 177, 255, 0.3)'
                                    : '0 0 0 2px rgba(79, 106, 240, 0.15)',
                            },
                            '& fieldset': {
                                borderWidth: '1px',
                                borderColor: darkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)',
                            },
                            '&:hover fieldset': {
                                borderColor: darkMode ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)',
                            },
                            '&.Mui-focused fieldset': {
                                borderWidth: '1.5px',
                            },
                        },
                    },
                },
            },
            MuiChip: {
                styleOverrides: {
                    root: {
                        borderRadius: '8px',
                        '&.MuiChip-colorPrimary': {
                            background: darkMode
                                ? 'rgba(130, 177, 255, 0.15)'
                                : 'rgba(79, 106, 240, 0.08)',
                            color: darkMode ? '#82b1ff' : '#4f6af0',
                            fontWeight: 500,
                        },
                        '&.MuiChip-colorSecondary': {
                            background: darkMode
                                ? 'rgba(255, 128, 171, 0.15)'
                                : 'rgba(255, 51, 102, 0.08)',
                            color: darkMode ? '#ff80ab' : '#ff3366',
                            fontWeight: 500,
                        },
                        '&.MuiChip-colorSuccess': {
                            background: darkMode
                                ? 'rgba(185, 246, 202, 0.15)'
                                : 'rgba(76, 175, 80, 0.08)',
                            color: darkMode ? '#b9f6ca' : '#4caf50',
                            fontWeight: 500,
                        },
                        '&.MuiChip-colorError': {
                            background: darkMode
                                ? 'rgba(255, 138, 128, 0.15)'
                                : 'rgba(244, 67, 54, 0.08)',
                            color: darkMode ? '#ff8a80' : '#f44336',
                            fontWeight: 500,
                        },
                        '&.MuiChip-colorWarning': {
                            background: darkMode
                                ? 'rgba(255, 209, 128, 0.15)'
                                : 'rgba(255, 152, 0, 0.08)',
                            color: darkMode ? '#ffd180' : '#ff9800',
                            fontWeight: 500,
                        },
                        '&.MuiChip-colorInfo': {
                            background: darkMode
                                ? 'rgba(130, 177, 255, 0.15)'
                                : 'rgba(33, 150, 243, 0.08)',
                            color: darkMode ? '#82b1ff' : '#2196f3',
                            fontWeight: 500,
                        },
                    },
                    label: {
                        fontWeight: 500,
                    },
                },
            },
            MuiAppBar: {
                styleOverrides: {
                    root: {
                        boxShadow: darkMode
                            ? '0 2px 10px rgba(0, 0, 0, 0.5)'
                            : '0 2px 10px rgba(0, 0, 0, 0.06)',
                        backdropFilter: 'blur(8px)',
                        backgroundColor: darkMode
                            ? 'rgba(30, 30, 30, 0.8)'
                            : 'rgba(255, 255, 255, 0.8)',
                    },
                },
            },
            MuiDrawer: {
                styleOverrides: {
                    paper: {
                        backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
                        backgroundImage: 'none',
                    },
                },
            },
            MuiTableCell: {
                styleOverrides: {
                    root: {
                        borderBottom: darkMode
                            ? '1px solid rgba(255, 255, 255, 0.08)'
                            : '1px solid rgba(0, 0, 0, 0.06)',
                    },
                    head: {
                        fontWeight: 600,
                        backgroundColor: darkMode
                            ? 'rgba(30, 30, 30, 0.5)'
                            : 'rgba(249, 249, 252, 0.5)',
                    },
                },
            },
            MuiDivider: {
                styleOverrides: {
                    root: {
                        borderColor: darkMode
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'rgba(0, 0, 0, 0.06)',
                    },
                },
            },
            MuiAvatar: {
                styleOverrides: {
                    root: {
                        boxShadow: darkMode
                            ? '0 2px 6px rgba(0, 0, 0, 0.3)'
                            : '0 2px 6px rgba(0, 0, 0, 0.1)',
                    },
                },
            },
            MuiTooltip: {
                styleOverrides: {
                    tooltip: {
                        backgroundColor: darkMode ? '#424242' : '#616161',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        padding: '6px 10px',
                        boxShadow: darkMode
                            ? '0 2px 10px rgba(0, 0, 0, 0.5)'
                            : '0 2px 10px rgba(0, 0, 0, 0.2)',
                    },
                    arrow: {
                        color: darkMode ? '#424242' : '#616161',
                    },
                },
            },
            MuiList: {
                styleOverrides: {
                    root: {
                        padding: '8px 0',
                    },
                },
            },
            MuiListItem: {
                styleOverrides: {
                    root: {
                        borderRadius: '8px',
                        transition: 'background-color 0.2s ease',
                        '&.Mui-selected': {
                            backgroundColor: darkMode
                                ? 'rgba(130, 177, 255, 0.15)'
                                : 'rgba(79, 106, 240, 0.08)',
                            '&:hover': {
                                backgroundColor: darkMode
                                    ? 'rgba(130, 177, 255, 0.25)'
                                    : 'rgba(79, 106, 240, 0.12)',
                            },
                        },
                    },
                },
            },
            MuiTabs: {
                styleOverrides: {
                    root: {
                        '& .MuiTabs-indicator': {
                            height: '3px',
                            borderRadius: '3px 3px 0 0',
                        },
                    },
                    indicator: {
                        backgroundColor: darkMode ? '#82b1ff' : '#4f6af0',
                    },
                },
            },
            MuiTab: {
                styleOverrides: {
                    root: {
                        textTransform: 'none',
                        fontWeight: 500,
                        borderRadius: '8px 8px 0 0',
                        transition: 'all 0.2s ease',
                        '&.Mui-selected': {
                            color: darkMode ? '#82b1ff' : '#4f6af0',
                            fontWeight: 600,
                        },
                    },
                },
            },
            MuiDialog: {
                styleOverrides: {
                    paper: {
                        borderRadius: '12px',
                        boxShadow: darkMode
                            ? '0 8px 40px rgba(0, 0, 0, 0.4)'
                            : '0 8px 40px rgba(0, 0, 0, 0.1)',
                        backgroundImage: 'none',
                    },
                },
            },
            MuiDialogTitle: {
                styleOverrides: {
                    root: {
                        fontSize: '1.25rem',
                        fontWeight: 600,
                    },
                },
            },
            MuiBadge: {
                styleOverrides: {
                    badge: {
                        fontWeight: 600,
                    },
                },
            },
            MuiLinearProgress: {
                styleOverrides: {
                    root: {
                        borderRadius: '6px',
                        height: '6px',
                    },
                },
            },
            MuiCircularProgress: {
                styleOverrides: {
                    circle: {
                        strokeLinecap: 'round',
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
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <IconButton onClick={toggleDarkMode} color="inherit">
                                        {darkMode ? <Brightness7 /> : <Brightness4 />}
                                    </IconButton>

                                    {isLoggedIn && <NotificationsMenu />}

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