import React, { useState, useCallback } from 'react';
import RegisterForm from './RegisterForm';
import LoginForm from './LoginForm';
import {
    Box, Typography, Paper, Grid, Container,
    Card, CardContent, Button, Stack, Divider,
    Tabs, Tab, useTheme
} from '@mui/material';
import {
    EventAvailable, Security, People, BarChart,
    CalendarMonth
} from '@mui/icons-material';

const FeatureCard = ({ icon, title, description }) => {
    const theme = useTheme();

    return (
        <Card sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            transition: 'transform 0.3s, box-shadow 0.3s',
            '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: theme.shadows[8],
            },
        }}>
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
                <Box sx={{
                    p: 2,
                    borderRadius: '50%',
                    backgroundColor: 'primary.main',
                    color: 'white',
                    mb: 2
                }}>
                    {icon}
                </Box>
                <Typography variant="h5" component="h3" gutterBottom align="center" sx={{ fontWeight: 'medium' }}>
                    {title}
                </Typography>
                <Typography variant="body1" color="text.secondary" align="center">
                    {description}
                </Typography>
            </CardContent>
        </Card>
    );
};

const LandingPage = ({ onLoginSuccess }) => {
    const theme = useTheme();
    const [authTab, setAuthTab] = useState(0);

    const handleAuthTabChange = useCallback((event, newValue) => {
        setAuthTab(newValue);
    }, []);

    // Memoize features to prevent re-creation on each render
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
        <Container maxWidth="lg">
            {/* Hero Section */}
            // LandingPage.jsx - Hero section enhancement
            <Box sx={{
                py: { xs: 6, md: 10 },
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 6,
                position: 'relative',
                overflow: 'hidden',
                borderRadius: { xs: 0, md: 4 },
                background: theme => theme.palette.mode === 'dark'
                    ? 'linear-gradient(135deg, #1e1e1e 0%, #2c2c2c 100%)'
                    : 'linear-gradient(135deg, #f9f9fc 0%, #f5f7fa 100%)',
                boxShadow: theme => theme.palette.mode === 'dark'
                    ? 'inset 0 0 40px rgba(0,0,0,0.3)'
                    : 'inset 0 0 40px rgba(0,0,0,0.03)'
            }}>
                {/* Decorative elements */}
                <Box sx={{
                    position: 'absolute',
                    width: '400px',
                    height: '400px',
                    borderRadius: '50%',
                    background: theme => `linear-gradient(135deg, ${theme.palette.primary.main}22, ${theme.palette.secondary.main}22)`,
                    top: '-200px',
                    right: '-100px',
                    zIndex: 0
                }} />
                <Box sx={{
                    position: 'absolute',
                    width: '300px',
                    height: '300px',
                    borderRadius: '50%',
                    background: theme => `linear-gradient(135deg, ${theme.palette.secondary.main}22, ${theme.palette.primary.main}22)`,
                    bottom: '-150px',
                    left: '-50px',
                    zIndex: 0
                }} />

                <Box sx={{
                    maxWidth: 600,
                    position: 'relative',
                    zIndex: 1,
                    px: { xs: 3, md: 0 }
                }}>
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
                            fontSize: { xs: '1rem', md: '1.25rem' },
                            lineHeight: 1.6
                        }}
                    >
                        Evently simplifies event planning with powerful tools for organizers and a seamless experience for attendees.
                    </Typography>
                    <Button
                        variant="contained"
                        size="large"
                        color="primary"
                        sx={{
                            py: 1.5,
                            px: 4,
                            borderRadius: 3,
                            fontSize: '1.1rem',
                            boxShadow: theme => `0 8px 25px ${theme.palette.mode === 'dark'
                                    ? theme.palette.primary.main + '40'
                                    : theme.palette.primary.main + '30'
                                }`
                        }}
                        href="#auth-section"
                    >
                        Get Started
                    </Button>
                </Box>

                <Box
                    component="img"
                    src="https://source.unsplash.com/random/600x400/?event"
                    alt="Event illustration"
                    sx={{
                        width: { xs: '100%', md: '45%' },
                        maxWidth: 500,
                        borderRadius: 4,
                        boxShadow: theme => `0 16px 40px ${theme.palette.mode === 'dark'
                                ? 'rgba(0,0,0,0.6)'
                                : 'rgba(0,0,0,0.15)'
                            }`,
                        transform: 'perspective(1000px) rotateY(-5deg)',
                        position: 'relative',
                        zIndex: 1,
                        transition: 'transform 0.5s ease-in-out',
                        '&:hover': {
                            transform: 'perspective(1000px) rotateY(0deg)',
                        }
                    }}
                />
            </Box>

            {/* Features Section */}
            <Box sx={{ py: 8 }}>
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
                    Why Choose Evently
                </Typography>
                <Grid container spacing={4}>
                    {features.map((feature, index) => (
                        <Grid item xs={12} sm={6} md={3} key={index}>
                            <FeatureCard {...feature} />
                        </Grid>
                    ))}
                </Grid>
            </Box>

            {/* Auth Section */}
            <Box id="auth-section" sx={{ py: 8 }}>
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
                            elevation={3}
                            sx={{
                                p: 4,
                                height: '100%',
                                borderRadius: 2,
                                transition: 'transform 0.3s',
                                '&:hover': {
                                    transform: 'scale(1.02)',
                                }
                            }}
                        >
                            <Tabs
                                value={authTab}
                                onChange={handleAuthTabChange}
                                centered
                                sx={{ mb: 3 }}
                            >
                                <Tab label="Login" />
                                <Tab label="Create Account" />
                            </Tabs>
                            {authTab === 0 ? (
                                <LoginForm onLoginSuccess={onLoginSuccess} />
                            ) : (
                                <RegisterForm onLoginSuccess={onLoginSuccess} />
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            </Box>

            {/* Footer */}
            <Divider sx={{ my: 4 }} />
            <Box component="footer" sx={{ py: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                    &copy; {new Date().getFullYear()} Evently. All rights reserved.
                </Typography>
            </Box>
        </Container>
    );
};

export default LandingPage;