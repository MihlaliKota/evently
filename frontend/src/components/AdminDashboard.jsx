// AdminDashboard.jsx - Dashboard for event administrators
import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Grid, Card, CardContent,
    CircularProgress, Button, Alert, Divider, Tabs, Tab,
    ListItem, ListItemText, ListItemIcon, List, Chip,
    IconButton, Avatar
} from '@mui/material';
import {
    Dashboard as DashboardIcon, Event, Person, Star, Add,
    TrendingUp, EventAvailable, CalendarToday, Comment,
    Flag, Warning, Check, ThumbUp, ThumbDown
} from '@mui/icons-material';
import EventsManagement from './EventsManagement';
import ReviewManagement from './ReviewManagement';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tabValue, setTabValue] = useState(0);
    const [recentEvents, setRecentEvents] = useState([]);
    const [pendingReviews, setPendingReviews] = useState([]);

    const navigate = (page) => {
        window.dispatchEvent(new CustomEvent('navigate', { detail: page }));
    };

    // Get JWT token from localStorage
    const getToken = () => {
        return localStorage.getItem('authToken');
    };

    // Format date for display
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }).format(date);
    };

    // Fetch dashboard stats
    useEffect(() => {
        const fetchAdminData = async () => {
            setLoading(true);
            setError(null);

            try {
                const token = getToken();
                if (!token) {
                    throw new Error('No authentication token found');
                }

                const headers = {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                };

                // Fetch admin stats
                const statsResponse = await fetch('http://localhost:5000/api/admin/stats', { headers });
                if (!statsResponse.ok) {
                    throw new Error(`Failed to fetch admin stats: ${statsResponse.status}`);
                }

                const statsData = await statsResponse.json();
                setStats(statsData);

                // Fetch recent events
                const eventsResponse = await fetch('http://localhost:5000/api/events?limit=5', { headers });
                if (!eventsResponse.ok) {
                    throw new Error(`Failed to fetch recent events: ${eventsResponse.status}`);
                }

                const eventsData = await eventsResponse.json();
                setRecentEvents(eventsData);

                // Fetch pending reviews
                const reviewsResponse = await fetch('http://localhost:5000/api/reviews?status=pending&limit=5', { headers });
                if (reviewsResponse.ok) {
                    const reviewsData = await reviewsResponse.json();
                    setPendingReviews(reviewsData);
                }
            } catch (error) {
                console.error('Error fetching admin data:', error);
                setError(error.message);

                // Set mock data for development
                setStats({
                    totalEvents: 24,
                    totalUsers: 158,
                    totalReviews: 96,
                    avgRating: 4.2
                });

                setRecentEvents([
                    {
                        event_id: 1,
                        name: 'Tech Conference 2024',
                        event_date: new Date().toISOString(),
                        location: 'New York',
                        attendees: 120
                    },
                    {
                        event_id: 2,
                        name: 'Music Festival',
                        event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                        location: 'Los Angeles',
                        attendees: 450
                    }
                ]);

                setPendingReviews([
                    {
                        review_id: 1,
                        event_id: 1,
                        user_id: 101,
                        username: 'JohnDoe',
                        event_name: 'Tech Conference 2024',
                        rating: 4.5,
                        review_text: 'This was a great event with excellent speakers and networking opportunities.',
                        created_at: new Date().toISOString()
                    },
                    {
                        review_id: 2,
                        event_id: 2,
                        user_id: 102,
                        username: 'JaneSmith',
                        event_name: 'Music Festival',
                        rating: 2,
                        review_text: 'The sound quality was poor and it was overcrowded.',
                        created_at: new Date(Date.now() - 86400000).toISOString()
                    }
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchAdminData();
    }, []);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const renderTabContent = () => {
        switch (tabValue) {
            case 0: // Dashboard
                return renderDashboardContent();
            case 1: // Events Management
                return <EventsManagement />;
            case 2: // Reviews Management
                return <ReviewManagement />;
            default:
                return renderDashboardContent();
        }
    };

    const renderDashboardContent = () => {
        if (loading) {
            return (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                </Box>
            );
        }

        if (error && !stats) {
            return (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            );
        }

        return (
            <Box>
                {/* Stats Cards */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ height: '100%', borderRadius: 2 }}>
                            <CardContent>
                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    mb: 2
                                }}>
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: 40,
                                        height: 40,
                                        borderRadius: '50%',
                                        bgcolor: 'primary.light',
                                        color: 'primary.main',
                                        mr: 2
                                    }}>
                                        <Event sx={{ fontSize: 20 }} />
                                    </Box>
                                    <Typography color="text.secondary" variant="body2">
                                        Total Events
                                    </Typography>
                                </Box>
                                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                                    {stats?.totalEvents || 0}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ height: '100%', borderRadius: 2 }}>
                            <CardContent>
                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    mb: 2
                                }}>
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: 40,
                                        height: 40,
                                        borderRadius: '50%',
                                        bgcolor: 'info.light',
                                        color: 'info.main',
                                        mr: 2
                                    }}>
                                        <Person sx={{ fontSize: 20 }} />
                                    </Box>
                                    <Typography color="text.secondary" variant="body2">
                                        Total Users
                                    </Typography>
                                </Box>
                                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                                    {stats?.totalUsers || 0}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ height: '100%', borderRadius: 2 }}>
                            <CardContent>
                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    mb: 2
                                }}>
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: 40,
                                        height: 40,
                                        borderRadius: '50%',
                                        bgcolor: 'warning.light',
                                        color: 'warning.main',
                                        mr: 2
                                    }}>
                                        <Comment sx={{ fontSize: 20 }} />
                                    </Box>
                                    <Typography color="text.secondary" variant="body2">
                                        Total Reviews
                                    </Typography>
                                </Box>
                                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                                    {stats?.totalReviews || 0}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ height: '100%', borderRadius: 2 }}>
                            <CardContent>
                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    mb: 2
                                }}>
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: 40,
                                        height: 40,
                                        borderRadius: '50%',
                                        bgcolor: 'success.light',
                                        color: 'success.main',
                                        mr: 2
                                    }}>
                                        <Star sx={{ fontSize: 20 }} />
                                    </Box>
                                    <Typography color="text.secondary" variant="body2">
                                        Average Rating
                                    </Typography>
                                </Box>
                                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                                    {stats?.avgRating ? stats.avgRating.toFixed(1) : '0.0'}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Quick Actions */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" gutterBottom>
                        Quick Actions
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                            <Button
                                variant="outlined"
                                fullWidth
                                startIcon={<Add />}
                                onClick={() => setTabValue(1)} // Switch to Events Management tab
                                sx={{ py: 1 }}
                            >
                                Create Event
                            </Button>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Button
                                variant="outlined"
                                fullWidth
                                startIcon={<Flag />}
                                onClick={() => setTabValue(2)} // Switch to Reviews Management tab
                                sx={{ py: 1 }}
                            >
                                Moderate Reviews
                            </Button>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Button
                                variant="outlined"
                                fullWidth
                                startIcon={<TrendingUp />}
                                onClick={() => window.open('/analytics', '_blank')}
                                sx={{ py: 1 }}
                            >
                                View Analytics
                            </Button>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Button
                                variant="outlined"
                                fullWidth
                                startIcon={<CalendarToday />}
                                onClick={() => navigate('calendar')}
                                sx={{ py: 1 }}
                            >
                                View Calendar
                            </Button>
                        </Grid>
                    </Grid>
                </Box>

                {/* Recent Content */}
                <Grid container spacing={3}>
                    {/* Recent Events */}
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 2, borderRadius: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6">
                                    Recent Events
                                </Typography>
                                <Button
                                    size="small"
                                    endIcon={<EventAvailable />}
                                    onClick={() => setTabValue(1)}
                                >
                                    View All
                                </Button>
                            </Box>
                            <Divider sx={{ mb: 2 }} />
                            {recentEvents.length > 0 ? (
                                <List disablePadding>
                                    {recentEvents.map((event, index) => (
                                        <React.Fragment key={event.event_id}>
                                            <ListItem sx={{ px: 1, py: 1.5 }}>
                                                <ListItemIcon>
                                                    <Event color="primary" />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={event.name}
                                                    secondary={
                                                        <>
                                                            {formatDate(event.event_date)} • {event.location || 'No location'}
                                                            <br />
                                                            {event.attendees || 0} attendees
                                                        </>
                                                    }
                                                />
                                                <Chip
                                                    label="Edit"
                                                    color="primary"
                                                    size="small"
                                                    variant="outlined"
                                                    onClick={() => navigate(`events/edit/${event.event_id}`)}
                                                />
                                            </ListItem>
                                            {index < recentEvents.length - 1 && <Divider component="li" />}
                                        </React.Fragment>
                                    ))}
                                </List>
                            ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                                    No recent events found
                                </Typography>
                            )}
                        </Paper>
                    </Grid>

                    {/* Pending Reviews */}
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 2, borderRadius: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6">
                                    Reviews Pending Moderation
                                </Typography>
                                <Button
                                    size="small"
                                    endIcon={<Flag />}
                                    onClick={() => setTabValue(2)}
                                >
                                    Manage All
                                </Button>
                            </Box>
                            <Divider sx={{ mb: 2 }} />
                            {pendingReviews.length > 0 ? (
                                <List disablePadding>
                                    {pendingReviews.map((review, index) => (
                                        <React.Fragment key={review.review_id}>
                                            <ListItem sx={{ px: 1, py: 1.5 }}>
                                                <ListItemIcon>
                                                    <Avatar sx={{ width: 32, height: 32 }}>
                                                        {review.username?.charAt(0).toUpperCase() || 'U'}
                                                    </Avatar>
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={`${review.username} on ${review.event_name}`}
                                                    secondary={
                                                        <>
                                                            Rating: {review.rating}/5
                                                            <br />
                                                            {review.review_text?.length > 60
                                                                ? `${review.review_text.substring(0, 60)}...`
                                                                : review.review_text || 'No comment'}
                                                        </>
                                                    }
                                                />
                                                <Box>
                                                    <IconButton
                                                        color="success"
                                                        size="small"
                                                        sx={{ mr: 1 }}
                                                        onClick={() => {
                                                            // Approve review logic
                                                            console.log('Approve review', review.review_id);
                                                        }}
                                                    >
                                                        <Check />
                                                    </IconButton>
                                                    <IconButton
                                                        color="error"
                                                        size="small"
                                                        onClick={() => {
                                                            // Reject review logic
                                                            console.log('Reject review', review.review_id);
                                                        }}
                                                    >
                                                        <Warning />
                                                    </IconButton>
                                                </Box>
                                            </ListItem>
                                            {index < pendingReviews.length - 1 && <Divider component="li" />}
                                        </React.Fragment>
                                    ))}
                                </List>
                            ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                                    No reviews pending moderation
                                </Typography>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        );
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Administrator Dashboard
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Manage events, reviews, and user content
                </Typography>
            </Box>

            {/* Tabs for different sections */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    aria-label="admin dashboard tabs"
                >
                    <Tab
                        label="Dashboard"
                        icon={<DashboardIcon />}
                        iconPosition="start"
                    />
                    <Tab
                        label="Events Management"
                        icon={<Event />}
                        iconPosition="start"
                    />
                    <Tab
                        label="Reviews Management"
                        icon={<Comment />}
                        iconPosition="start"
                    />
                </Tabs>
            </Box>

            {/* Tab content */}
            {renderTabContent()}
        </Box>
    );
};

export default AdminDashboard;