// LandingPage.jsx
import React, { useState, useCallback } from 'react';
import RegisterForm from './RegisterForm';
import LoginForm from './LoginForm';
import {
    Box, Typography, Paper, Grid, Container,
    Card, CardContent, Button, Stack, Divider,
    Tabs, Tab, useTheme, AppBar, Toolbar, 
    Link, Avatar, AvatarGroup, Chip, TextField,
    InputAdornment, Checkbox, FormControlLabel
} from '@mui/material';
import {
    EventAvailable, Security, People, BarChart,
    CalendarMonth, KeyboardArrowRight, Mail, Lock,
    Place, ArrowForward, Check, Facebook, 
    Twitter, LinkedIn
} from '@mui/icons-material';

const FeatureCard = ({ icon, title, description }) => {
    const theme = useTheme();

    return (
        <Card sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            transition: 'all 0.3s',
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'divider',
            '&:hover': {
                transform: 'translateY(-12px)',
                boxShadow: 6,
                borderColor: 'primary.main',
            },
        }}>
            <CardContent sx={{ 
                flexGrow: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                p: 4 
            }}>
                <Box sx={{
                    p: 2,
                    borderRadius: 3,
                    background: theme => `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                    color: 'white',
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {icon}
                </Box>
                <Typography variant="h5" component="h3" gutterBottom align="center" sx={{ fontWeight: 'bold', mb: 2 }}>
                    {title}
                </Typography>
                <Typography variant="body1" color="text.secondary" align="center">
                    {description}
                </Typography>
            </CardContent>
        </Card>
    );
};

const NavBar = () => {
    const theme = useTheme();
    
    return (
        <AppBar position="sticky" elevation={0} color="default" sx={{ bgcolor: 'background.paper' }}>
            <Toolbar sx={{ justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ 
                        width: 40, 
                        height: 40, 
                        borderRadius: 2, 
                        background: theme => `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 1
                    }}>
                        <CalendarMonth sx={{ color: 'white' }} />
                    </Box>
                    <Typography 
                        variant="h6" 
                        component="div" 
                        sx={{ 
                            fontWeight: 'bold',
                            background: theme => `linear-gradient(to right, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                            backgroundClip: 'text',
                            textFillColor: 'transparent',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        Evently
                    </Typography>
                </Box>
                <Box>
                    <Button color="inherit" sx={{ mr: 2 }}>Login</Button>
                    <Button 
                        variant="contained" 
                        disableElevation 
                        sx={{ 
                            borderRadius: 28, 
                            px: 3,
                            background: theme => `linear-gradient(to right, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                            '&:hover': {
                                boxShadow: 3
                            }
                        }}
                    >
                        Sign Up
                    </Button>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

const LandingPage = ({ onLoginSuccess }) => {
    const theme = useTheme();
    const [authTab, setAuthTab] = useState(0);

    const handleAuthTabChange = useCallback((event, newValue) => {
        setAuthTab(newValue);
    }, []);

    const features = [
        {
            icon: <EventAvailable fontSize="large" />,
            title: "Event Management",
            description: "Create and manage events with ease. Set dates, locations, and reminders all in one place."
        },
        {
            icon: <People fontSize="large" />,
            title: "Attendee Tracking",
            description: "Track RSVPs, send invitations, and manage your guest list effortlessly."
        },
        {
            icon: <CalendarMonth fontSize="large" />,
            title: "Calendar Integration",
            description: "Sync with your favorite calendar apps to keep all your events organized."
        },
        {
            icon: <BarChart fontSize="large" />,
            title: "Insightful Analytics",
            description: "Get detailed analytics on attendance, engagement, and event performance."
        },
    ];

    return (
        <>
            <NavBar />
            <Container maxWidth="lg">
                {/* Hero Section */}
                <Box sx={{
                    py: { xs: 6, md: 12 },
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: { xs: 0, md: 8 },
                    mt: 4
                }}>
                    {/* Decorative elements */}
                    <Box sx={{
                        position: 'absolute',
                        width: '500px',
                        height: '500px',
                        borderRadius: '50%',
                        background: theme => `linear-gradient(135deg, ${theme.palette.primary.main}22, ${theme.palette.secondary.main}22)`,
                        top: '-200px',
                        right: '-100px',
                        zIndex: 0,
                        animation: 'float 8s ease-in-out infinite',
                        '@keyframes float': {
                            '0%, 100%': { transform: 'translateY(0)' },
                            '50%': { transform: 'translateY(-20px)' },
                        }
                    }} />
                    <Box sx={{
                        position: 'absolute',
                        width: '400px',
                        height: '400px',
                        borderRadius: '50%',
                        background: theme => `linear-gradient(135deg, ${theme.palette.secondary.main}22, ${theme.palette.primary.main}22)`,
                        bottom: '-150px',
                        left: '-50px',
                        zIndex: 0,
                        animation: 'float 10s ease-in-out infinite 1s',
                        '@keyframes float': {
                            '0%, 100%': { transform: 'translateY(0)' },
                            '50%': { transform: 'translateY(-30px)' },
                        }
                    }} />

                    <Grid container spacing={6} alignItems="center">
                        <Grid item xs={12} md={6} sx={{ position: 'relative', zIndex: 1 }}>
                            <Typography
                                variant="h1"
                                component="h1"
                                gutterBottom
                                sx={{
                                    fontWeight: 800,
                                    lineHeight: 1.1,
                                    fontSize: { xs: '2.5rem', md: '3.5rem', lg: '4rem' },
                                    background: theme => theme.palette.mode === 'dark'
                                        ? 'linear-gradient(90deg, #82b1ff, #ff80ab)'
                                        : 'linear-gradient(90deg, #4f6af0, #ff3366)',
                                    backgroundClip: 'text',
                                    textFillColor: 'transparent',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    mb: 3
                                }}
                            >
                                Plan, Manage, and Host Amazing Events
                            </Typography>
                            <Typography
                                variant="h5"
                                color="text.secondary"
                                paragraph
                                sx={{
                                    mb: 4,
                                    fontSize: { xs: '1.1rem', md: '1.25rem' },
                                    lineHeight: 1.6
                                }}
                            >
                                Evently simplifies event planning with powerful tools for organizers and a seamless experience for attendees.
                            </Typography>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 4 }}>
                                <Button
                                    variant="contained"
                                    size="large"
                                    color="primary"
                                    endIcon={<KeyboardArrowRight />}
                                    sx={{
                                        py: 1.5,
                                        px: 4,
                                        borderRadius: 3,
                                        fontSize: '1.1rem',
                                        fontWeight: 'bold',
                                        background: theme => `linear-gradient(to right, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                                        boxShadow: theme => `0 8px 25px ${theme.palette.primary.main}40`
                                    }}
                                    href="#auth-section"
                                >
                                    Get Started
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="large"
                                    sx={{
                                        py: 1.5,
                                        px: 4,
                                        borderRadius: 3,
                                        fontSize: '1.1rem',
                                        fontWeight: 'medium',
                                        borderWidth: 2
                                    }}
                                >
                                    See How It Works
                                </Button>
                            </Stack>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <AvatarGroup max={4}>
                                    <Avatar sx={{ bgcolor: 'primary.main' }}>JD</Avatar>
                                    <Avatar sx={{ bgcolor: 'secondary.main' }}>KL</Avatar>
                                    <Avatar sx={{ bgcolor: 'info.main' }}>MN</Avatar>
                                    <Avatar sx={{ bgcolor: 'error.main' }}>OP</Avatar>
                                </AvatarGroup>
                                <Typography variant="body2" color="text.secondary">
                                    Join 10,000+ event planners
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={6} sx={{ position: 'relative' }}>
                            <Box sx={{
                                position: 'absolute',
                                width: '100%',
                                height: '100%',
                                background: theme => `linear-gradient(135deg, ${theme.palette.primary.main}30, ${theme.palette.primary.dark}30)`,
                                borderRadius: 6,
                                transform: 'rotate(2deg)',
                                zIndex: 0
                            }} />
                            <Box
                                component="img"
                                src="https://source.unsplash.com/random/600x400/?event"
                                alt="Event illustration"
                                sx={{
                                    width: '100%',
                                    maxWidth: 500,
                                    height: 'auto',
                                    borderRadius: 4,
                                    boxShadow: 10,
                                    transform: 'perspective(1000px) rotateY(-5deg) rotate(-2deg)',
                                    position: 'relative',
                                    zIndex: 1,
                                    transition: 'all 0.6s ease-in-out',
                                    '&:hover': {
                                        transform: 'perspective(1000px) rotateY(0deg) rotate(0deg)',
                                    }
                                }}
                            />
                            <Paper 
                                elevation={4} 
                                sx={{ 
                                    position: 'absolute', 
                                    bottom: -20, 
                                    right: -10, 
                                    p: 2, 
                                    borderRadius: 3,
                                    zIndex: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1
                                }}
                            >
                                <Box 
                                    sx={{ 
                                        width: 10, 
                                        height: 10, 
                                        borderRadius: '50%', 
                                        bgcolor: 'success.main' 
                                    }} 
                                />
                                <Typography variant="body2" fontWeight="medium">
                                    500+ Active Events
                                </Typography>
                            </Paper>
                        </Grid>
                    </Grid>
                </Box>

                {/* Features Section */}
                <Box sx={{ py: 10 }}>
                    <Typography
                        variant="h3"
                        component="h2"
                        align="center"
                        gutterBottom
                        sx={{
                            fontWeight: 'bold',
                            mb: 2
                        }}
                    >
                        <Box 
                            component="span" 
                            sx={{ 
                                background: theme => `linear-gradient(to right, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                                backgroundClip: 'text',
                                textFillColor: 'transparent',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}
                        >
                            Why Choose
                        </Box>
                        {" Evently"}
                    </Typography>
                    <Typography
                        variant="h6"
                        align="center"
                        color="text.secondary"
                        sx={{ mb: 8, maxWidth: 600, mx: 'auto' }}
                    >
                        Everything you need to create successful events, all in one platform
                    </Typography>
                    <Grid container spacing={4}>
                        {features.map((feature, index) => (
                            <Grid item xs={12} sm={6} md={3} key={index}>
                                <FeatureCard {...feature} />
                            </Grid>
                        ))}
                    </Grid>
                    <Box sx={{ 
                        mt: 12, 
                        borderRadius: 6,
                        background: theme => `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                        color: 'white',
                        overflow: 'hidden',
                        boxShadow: 6
                    }}>
                        <Grid container>
                            <Grid item xs={12} md={6} sx={{ p: { xs: 4, md: 6 } }}>
                                <Typography variant="h4" fontWeight="bold" gutterBottom>
                                    Ready to plan your next event?
                                </Typography>
                                <Typography sx={{ mb: 4, opacity: 0.9 }}>
                                    Join thousands of event planners using Evently to create unforgettable experiences.
                                </Typography>
                                <Button 
                                    variant="contained" 
                                    size="large"
                                    sx={{ 
                                        bgcolor: 'white', 
                                        color: 'primary.dark',
                                        '&:hover': { 
                                            bgcolor: 'white', 
                                            opacity: 0.9 
                                        },
                                        borderRadius: 3,
                                        px: 4,
                                        py: 1.5,
                                        fontWeight: 'bold'
                                    }}
                                >
                                    Get Started Free
                                </Button>
                            </Grid>
                            <Grid item xs={12} md={6} sx={{ p: { xs: 4, md: 6 } }}>
                                <Paper sx={{ 
                                    p: 3, 
                                    borderRadius: 4, 
                                    bgcolor: 'rgba(255,255,255,0.15)', 
                                    backdropFilter: 'blur(10px)'
                                }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                                            <Place />
                                        </Avatar>
                                        <Box>
                                            <Typography fontWeight="bold">Tech Conference 2025</Typography>
                                            <Typography variant="body2" sx={{ opacity: 0.9 }}>April 15-17, San Francisco</Typography>
                                        </Box>
                                    </Box>
                                    <Paper sx={{ p: 2, mb: 2, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.15)' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="body2">Total Registrations</Typography>
                                            <Typography variant="body2" fontWeight="bold">349/500</Typography>
                                        </Box>
                                        <Box sx={{ 
                                            width: '100%', 
                                            height: 8, 
                                            bgcolor: 'rgba(255,255,255,0.2)', 
                                            borderRadius: 4,
                                            overflow: 'hidden'
                                        }}>
                                            <Box sx={{ width: '70%', height: '100%', bgcolor: 'white' }} />
                                        </Box>
                                    </Paper>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2">Last registration: 5 min ago</Typography>
                                        <Typography variant="body2">70% full</Typography>
                                    </Box>
                                </Paper>
                            </Grid>
                        </Grid>
                    </Box>
                </Box>

                {/* Auth Section */}
                <Box id="auth-section" sx={{ py: 10 }}>
                    <Typography
                        variant="h3"
                        component="h2"
                        align="center"
                        gutterBottom
                        sx={{
                            fontWeight: 'bold',
                            mb: 6
                        }}
                    >
                        Get Started Today
                    </Typography>
                    <Grid container spacing={4} justifyContent="center">
                        <Grid item xs={12} md={6}>
                            <Paper
                                elevation={4}
                                sx={{
                                    borderRadius: 4,
                                    overflow: 'hidden',
                                    transition: 'transform 0.3s',
                                    '&:hover': {
                                        transform: 'translateY(-10px)',
                                        boxShadow: 8
                                    }
                                }}
                            >
                                <Box sx={{ 
                                    bgcolor: 'background.paper', 
                                    p: 0
                                }}>
                                    <Tabs
                                        value={authTab}
                                        onChange={handleAuthTabChange}
                                        variant="fullWidth"
                                        TabIndicatorProps={{ style: { display: 'none' } }}
                                        sx={{ 
                                            '& .MuiTab-root': { 
                                                py: 2,
                                                fontSize: '1rem',
                                                fontWeight: 'bold'
                                            },
                                            '& .Mui-selected': {
                                                background: theme => `linear-gradient(to right, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                                                color: 'white',
                                            }
                                        }}
                                    >
                                        <Tab label="Login" />
                                        <Tab label="Create Account" />
                                    </Tabs>
                                </Box>
                                <Box sx={{ p: 4 }}>
                                    {authTab === 0 ? (
                                        <Box component="form">
                                            <TextField
                                                fullWidth
                                                margin="normal"
                                                label="Email"
                                                variant="outlined"
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <Mail color="action" />
                                                        </InputAdornment>
                                                    ),
                                                }}
                                                sx={{ mb: 3 }}
                                            />
                                            <TextField
                                                fullWidth
                                                margin="normal"
                                                label="Password"
                                                type="password"
                                                variant="outlined"
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <Lock color="action" />
                                                        </InputAdornment>
                                                    ),
                                                }}
                                                sx={{ mb: 3 }}
                                            />
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                                <FormControlLabel
                                                    control={<Checkbox />}
                                                    label="Remember me"
                                                />
                                                <Link href="#" color="primary" underline="hover">Forgot password?</Link>
                                            </Box>
                                            <Button
                                                fullWidth
                                                variant="contained"
                                                size="large"
                                                sx={{
                                                    py: 1.5,
                                                    borderRadius: 3,
                                                    fontWeight: 'bold',
                                                    background: theme => `linear-gradient(to right, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                                                }}
                                            >
                                                Sign in
                                            </Button>
                                        </Box>
                                    ) : (
                                        <Box component="form">
                                            <Grid container spacing={2}>
                                                <Grid item xs={12} sm={6}>
                                                    <TextField
                                                        fullWidth
                                                        label="First Name"
                                                        variant="outlined"
                                                        margin="normal"
                                                    />
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <TextField
                                                        fullWidth
                                                        label="Last Name"
                                                        variant="outlined"
                                                        margin="normal"
                                                    />
                                                </Grid>
                                            </Grid>
                                            <TextField
                                                fullWidth
                                                margin="normal"
                                                label="Email"
                                                variant="outlined"
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <Mail color="action" />
                                                        </InputAdornment>
                                                    ),
                                                }}
                                                sx={{ mb: 3 }}
                                            />
                                            <TextField
                                                fullWidth
                                                margin="normal"
                                                label="Password"
                                                type="password"
                                                variant="outlined"
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <Lock color="action" />
                                                        </InputAdornment>
                                                    ),
                                                }}
                                                sx={{ mb: 3 }}
                                            />
                                            <FormControlLabel
                                                control={<Checkbox />}
                                                label={
                                                    <Typography variant="body2">
                                                        I agree to the <Link href="#" color="primary" underline="hover">Terms</Link> and <Link href="#" color="primary" underline="hover">Privacy Policy</Link>
                                                    </Typography>
                                                }
                                                sx={{ mb: 3 }}
                                            />
                                            <Button
                                                fullWidth
                                                variant="contained"
                                                size="large"
                                                sx={{
                                                    py: 1.5,
                                                    borderRadius: 3,
                                                    fontWeight: 'bold',
                                                    background: theme => `linear-gradient(to right, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                                                }}
                                            >
                                                Create Account
                                            </Button>
                                        </Box>
                                    )}
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                </Box>

                {/* Footer */}
                <Divider sx={{ my: 4 }} />
                <Box component="footer" sx={{ py: 4 }}>
                    <Grid container spacing={4}>
                        <Grid item xs={12} md={4}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Box sx={{ 
                                    width: 40, 
                                    height: 40, 
                                    borderRadius: 2, 
                                    background: theme => `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mr: 1
                                }}>
                                    <CalendarMonth sx={{ color: 'white' }} />
                                </Box>
                                <Typography variant="h6" fontWeight="bold">Evently</Typography>
                            </Box>
                            <Typography color="text.secondary" sx={{ mb: 2 }}>
                                The complete platform for event planning and management.
                            </Typography>
                            <Stack direction="row" spacing={2}>
                                <IconButton size="small" sx={{ 
                                    bgcolor: 'action.hover', 
                                    '&:hover': { bgcolor: 'primary.main', color: 'white' } 
                                }}>
                                    <Twitter fontSize="small" />
                                </IconButton>
                                <IconButton size="small" sx={{ 
                                    bgcolor: 'action.hover', 
                                    '&:hover': { bgcolor: 'primary.main', color: 'white' } 
                                }}>
                                    <Facebook fontSize="small" />
                                </IconButton>
                                <IconButton size="small" sx={{ 
                                    bgcolor: 'action.hover', 
                                    '&:hover': { bgcolor: 'primary.main', color: 'white' } 
                                }}>
                                    <LinkedIn fontSize="small" />
                                </IconButton>
                            </Stack>
                        </Grid>
                        <Grid item xs={12} sm={4} md={2}>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                Product
                            </Typography>
                            <Stack spacing={1}>
                                <Link href="#" color="text.secondary" underline="hover">Features</Link>
                                <Link href="#" color="text.secondary" underline="hover">Pricing</Link>
                                <Link href="#" color="text.secondary" underline="hover">Integrations</Link>
                                <Link href="#" color="text.secondary" underline="hover">Enterprise</Link>
                            </Stack>
                        </Grid>
                        <Grid item xs={12} sm={4} md={2}>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                Resources
                            </Typography>
                            <Stack spacing={1}>
                                <Link href="#" color="text.secondary" underline="hover">Blog</Link>
                                <Link href="#" color="text.secondary" underline="hover">Event Ideas</Link>
                                <Link href="#" color="text.secondary" underline="hover">Help Center</Link>
                                <Link href="#" color="text.secondary" underline="hover">Community</Link>
                            </Stack>
                        </Grid>
                        <Grid item xs={12} sm={4} md={2}>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                Company
                            </Typography>
                            <Stack spacing={1}>
                                <Link href="#" color="text.secondary" underline="hover">About Us</Link>
                                <Link href="#" color="text.secondary" underline="hover">Careers</Link>
                                <Link href="#" color="text.secondary" underline="hover">Contact Us</Link>
                                <Link href="#" color="text.secondary" underline="hover">Legal</Link>
                            </Stack>
                        </Grid>
                        <Grid item xs={12}>
                            <Divider sx={{ my: 3 }} />
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'center', sm: 'center' }, gap: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    &copy; {new Date().getFullYear()} Evently. All rights reserved.
                                </Typography>
                                <Stack direction="row" spacing={3}>
                                    <Link href="#" color="text.secondary" underline="hover" variant="body2">Privacy Policy</Link>
                                    <Link href="#" color="text.secondary" underline="hover" variant="body2">Terms of Service</Link>
                                    <Link href="#" color="text.secondary" underline="hover" variant="body2">Cookie Settings</Link>
                                </Stack>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
                
                {/* Floating Action Button */}
                <Box
                    sx={{
                        position: 'fixed',
                        bottom: 24,
                        right: 24,
                        zIndex: 10
                    }}
                >
                    <Button
                        variant="contained"
                        sx={{
                            width: 60,
                            height: 60,
                            borderRadius: '50%',
                            minWidth: 'auto',
                            background: theme => `linear-gradient(to right, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                            boxShadow: 6,
                            '&:hover': {
                                boxShadow: 8
                            }
                        }}
                    >
                        <ArrowForward />
                    </Button>
                </Box>
            </Container>
        </>
    );
};

export default LandingPage;