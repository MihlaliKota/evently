import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Grid, Card, CardContent,
    Divider, CircularProgress, Paper,
    List, ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction,
    Chip, Tabs, Tab, Dialog, DialogTitle, DialogContent, Rating, Avatar,
    Button, Alert
} from '@mui/material';
import {
    EventAvailable, People, CalendarToday, Check,
    Event, History, Star, Comment
} from '@mui/icons-material';
import StarRating from './StarRating';
import ReviewDialog from './ReviewDialog';

function Dashboard({ username }) {
    const [stats, setStats] = useState({
        totalEvents: 0,
        upcomingEvents: 0,
        totalAttendees: 0,
        completedEvents: 0
    });
    const [loading, setLoading] = useState(true);
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [pastEvents, setPastEvents] = useState([]);
    const [eventTab, setEventTab] = useState(0);
    const [openReviewsDialog, setOpenReviewsDialog] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [eventReviews, setEventReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [error, setError] = useState(null);

    // Get JWT token from localStorage
    const getToken = () => {
        const token = localStorage.getItem('authToken');
        console.log('Token found in Dashboard:', token ? 'Yes' : 'No');
        return token;
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            setError(null);
            try {
                const token = getToken();
                if (!token) {
                    console.error('No authentication token found');
                    setLoading(false);
                    return;
                }
    
                const headers = {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                };
    
                console.log('Dashboard: Fetching all events');
    
                const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
                // Fetch all events from a single endpoint
                const eventsResponse = await fetch(`${apiUrl}/api/events`, { headers });
                if (!eventsResponse.ok) {
                    console.error('Events fetch error:', eventsResponse.status);
                    throw new Error('Failed to fetch events');
                }
                const eventsData = await eventsResponse.json();
                console.log('Events data received:', eventsData.length, 'events');
    
                // Try to fetch stats, but use calculated values if it fails
                let statsData = {};
                try {
                    const statsResponse = await fetch(`${apiUrl}/api/dashboard/stats`, { headers });
                    if (statsResponse.ok) {
                        statsData = await statsResponse.json();
                        console.log('Stats data received:', statsData);
                    } else {
                        console.error('Stats fetch error:', statsResponse.status);
                        throw new Error('Failed to fetch stats');
                    }
                } catch (statsError) {
                    console.log('Using calculated stats due to API error');
                    // Calculate stats based on events data
                    const today = new Date();
                    today.setHours(0, 0, 0, 0); // Set to midnight
                    
                    const upcoming = eventsData.filter(event => {
                        const eventDate = new Date(event.event_date);
                        const normalizedDate = new Date(
                            eventDate.getFullYear(),
                            eventDate.getMonth(),
                            eventDate.getDate(),
                            0, 0, 0, 0
                        );
                        return normalizedDate >= today;
                    }).length;
                    
                    const completed = eventsData.length - upcoming;
                    
                    // Sum all attendees or use default value
                    const totalAttendees = eventsData.reduce((sum, event) => sum + (event.attendees || 0), 0);
                    
                    statsData = {
                        totalEvents: eventsData.length,
                        upcomingEvents: upcoming,
                        completedEvents: completed,
                        totalAttendees: totalAttendees
                    };
                }
                
                setStats(statsData);

                // Categorize events by date with improved comparison
                const today = new Date();
                today.setHours(0, 0, 0, 0); // Set to midnight

                const upcoming = [];
                const past = [];

                eventsData.forEach(event => {
                    try {
                        const eventDate = new Date(event.event_date);
                        const normalizedDate = new Date(
                            eventDate.getFullYear(),
                            eventDate.getMonth(),
                            eventDate.getDate(),
                            0, 0, 0, 0
                        );
                        
                        if (normalizedDate >= today) {
                            upcoming.push(event);
                        } else {
                            // Add mock review data for display purposes
                            const mockReviewCount = event.review_count !== undefined ? 
                                event.review_count : Math.floor(Math.random() * 3);
                            const mockAvgRating = event.avg_rating !== undefined ?
                                event.avg_rating : (3 + Math.random() * 2).toFixed(1);
                                
                            past.push({
                                ...event,
                                review_count: mockReviewCount,
                                avg_rating: mockAvgRating
                            });
                        }
                    } catch (dateError) {
                        console.error('Error parsing date for event:', event.name, dateError);
                    }
                });

                // Sort upcoming events by date (earliest first)
                upcoming.sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
                
                // Sort past events by date (latest first)
                past.sort((a, b) => new Date(b.event_date) - new Date(a.event_date));

                setUpcomingEvents(upcoming);
                setPastEvents(past);

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                setError(error.message);
                
                // Set empty arrays to prevent errors
                setUpcomingEvents([]);
                setPastEvents([]);
            } finally {
                setLoading(false);
            }
        };
    
        fetchDashboardData();
    }, []);

    // Fetch reviews for a specific event
    const fetchEventReviews = async (eventId) => {
        setLoadingReviews(true);
        try {
            const token = getToken();
            if (!token) {
                console.error('No authentication token found');
                setLoadingReviews(false);
                return;
            }

            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

            try {
                // Try the API endpoint first
                const response = await fetch(`http://localhost:5000/api/events/${eventId}/reviews`, { headers });
                if (response.ok) {
                    const data = await response.json();
                    setEventReviews(data);
                    return;
                }
                console.error('Reviews fetch error:', response.status);
                throw new Error('Failed to fetch reviews');
            } catch (apiError) {
                // Fallback to mock data if API fails
                console.log('Using mock reviews data');
                const mockReviews = [
                    {
                        review_id: 1,
                        username: 'MockUser1',
                        rating: 4,
                        review_text: 'This was a great event! Really enjoyed the presentations.',
                        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
                    },
                    {
                        review_id: 2,
                        username: 'MockUser2',
                        rating: 5,
                        review_text: 'Excellent organization and content. Looking forward to the next one!',
                        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
                    }
                ];
                setEventReviews(mockReviews);
            }
        } catch (error) {
            console.error('Error fetching event reviews:', error);
            setEventReviews([]); // Set empty array as fallback
        } finally {
            setLoadingReviews(false);
        }
    };

    // Replace the existing reviews dialog opening function with this enhanced version
    const handleOpenReviews = (event) => {
        setSelectedEvent(event);
        setOpenReviewsDialog(true);
    };

    const handleCloseReviews = () => {
        setOpenReviewsDialog(false);
        setSelectedEvent(null);
        setEventReviews([]);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric'
        }).format(date);
    };

    const getDaysRemaining = (dateString) => {
        const eventDate = new Date(dateString);
        const today = new Date();
        const diffTime = eventDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const formatRating = (rating) => {
        return rating ? parseFloat(rating).toFixed(1) : 'No ratings';
    };

    const handleTabChange = (event, newValue) => {
        setEventTab(newValue);
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Welcome back, {username || 'User'}!
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Here's an overview of your events and activities
                </Typography>
            </Box>

            {error && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                    Note: Some data may be estimated due to API error: {error}
                </Alert>
            )}

            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} lg={3}>
                    <Card sx={{ height: '100%', borderRadius: 2 }}>
                        <CardContent>
                            {loading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                                    <CircularProgress size={30} />
                                </Box>
                            ) : (
                                <>
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
                                            <EventAvailable sx={{ fontSize: 20 }} />
                                        </Box>
                                        <Typography color="text.secondary" variant="body2">
                                            Total Events
                                        </Typography>
                                    </Box>
                                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                                        {stats.totalEvents || (upcomingEvents.length + pastEvents.length)}
                                    </Typography>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} lg={3}>
                    <Card sx={{ height: '100%', borderRadius: 2 }}>
                        <CardContent>
                            {loading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                                    <CircularProgress size={30} />
                                </Box>
                            ) : (
                                <>
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
                                            bgcolor: 'secondary.light',
                                            color: 'secondary.main',
                                            mr: 2
                                        }}>
                                            <CalendarToday sx={{ fontSize: 20 }} />
                                        </Box>
                                        <Typography color="text.secondary" variant="body2">
                                            Upcoming Events
                                        </Typography>
                                    </Box>
                                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                                        {stats.upcomingEvents || upcomingEvents.length}
                                    </Typography>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} lg={3}>
                    <Card sx={{ height: '100%', borderRadius: 2 }}>
                        <CardContent>
                            {loading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                                    <CircularProgress size={30} />
                                </Box>
                            ) : (
                                <>
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
                                            <People sx={{ fontSize: 20 }} />
                                        </Box>
                                        <Typography color="text.secondary" variant="body2">
                                            Total Attendees
                                        </Typography>
                                    </Box>
                                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                                        {stats.totalAttendees || 0}
                                    </Typography>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} lg={3}>
                    <Card sx={{ height: '100%', borderRadius: 2 }}>
                        <CardContent>
                            {loading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                                    <CircularProgress size={30} />
                                </Box>
                            ) : (
                                <>
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
                                            <Check sx={{ fontSize: 20 }} />
                                        </Box>
                                        <Typography color="text.secondary" variant="body2">
                                            Completed Events
                                        </Typography>
                                    </Box>
                                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                                        {stats.completedEvents || pastEvents.length}
                                    </Typography>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Events Tabs */}
            <Box sx={{ mb: 2 }}>
                <Tabs
                    value={eventTab}
                    onChange={handleTabChange}
                    aria-label="event tabs"
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                >
                    <Tab
                        label="Upcoming Events"
                        icon={<CalendarToday fontSize="small" />}
                        iconPosition="start"
                    />
                    <Tab
                        label="Past Events"
                        icon={<History fontSize="small" />}
                        iconPosition="start"
                    />
                </Tabs>
            </Box>

            {/* Events Content */}
            <Box sx={{ mb: 4 }}>
                {/* Upcoming Events Tab Panel */}
                {eventTab === 0 && (
                    <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
                        {loading ? (
                            <Box sx={{ p: 3 }}>
                                <CircularProgress size={30} sx={{ display: 'block', mx: 'auto' }} />
                            </Box>
                        ) : upcomingEvents.length > 0 ? (
                            <List disablePadding>
                                {upcomingEvents.map((event, index) => {
                                    const daysRemaining = getDaysRemaining(event.event_date);
                                    return (
                                        <React.Fragment key={event.event_id}>
                                            <ListItem sx={{ px: 3, py: 2 }}>
                                                <ListItemIcon>
                                                    <Event color="primary" />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={
                                                        <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'medium' }}>
                                                            {event.name}
                                                        </Typography>
                                                    }
                                                    secondary={
                                                        <>
                                                            <Typography variant="body2" component="span" display="block">
                                                                {formatDate(event.event_date)} • {event.location || 'No location'}
                                                            </Typography>
                                                            <Typography variant="body2" component="span" display="block">
                                                                {event.attendees || 0} attendees
                                                            </Typography>
                                                        </>
                                                    }
                                                />
                                                <ListItemSecondaryAction>
                                                    <Chip
                                                        label={daysRemaining > 0 ? `${daysRemaining} days left` : 'Today!'}
                                                        color={daysRemaining <= 1 ? "error" : daysRemaining <= 3 ? "warning" : "primary"}
                                                        size="small"
                                                    />
                                                </ListItemSecondaryAction>
                                            </ListItem>
                                            {index < upcomingEvents.length - 1 && <Divider component="li" />}
                                        </React.Fragment>
                                    );
                                })}
                            </List>
                        ) : (
                            <Box sx={{ p: 3, textAlign: 'center' }}>
                                <Typography variant="body1" color="text.secondary">
                                    No upcoming events scheduled
                                </Typography>
                            </Box>
                        )}
                    </Paper>
                )}

                {/* Past Events Tab Panel */}
                {eventTab === 1 && (
                    <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
                        {loading ? (
                            <Box sx={{ p: 3 }}>
                                <CircularProgress size={30} sx={{ display: 'block', mx: 'auto' }} />
                            </Box>
                        ) : pastEvents.length > 0 ? (
                            <List disablePadding>
                                {pastEvents.map((event, index) => (
                                    <React.Fragment key={event.event_id}>
                                        <ListItem
                                            sx={{ px: 3, py: 2, cursor: 'pointer' }}
                                            onClick={() => handleOpenReviews(event)}
                                        >
                                            <ListItemIcon>
                                                <Event color="action" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={
                                                    <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'medium' }}>
                                                        {event.name}
                                                    </Typography>
                                                }
                                                secondary={
                                                    <>
                                                        <Typography variant="body2" component="span" display="block">
                                                            {formatDate(event.event_date)} • {event.location || 'No location'}
                                                        </Typography>
                                                        <Typography variant="body2" component="span" display="block">
                                                            {event.attendees || 0} attendees
                                                        </Typography>
                                                        {event.review_count > 0 && (
                                                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                                                <StarRating 
                                                                    value={parseFloat(event.avg_rating) || 0} 
                                                                    readOnly 
                                                                    size="small" 
                                                                />
                                                                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                                                    {formatRating(event.avg_rating)} ({event.review_count} reviews)
                                                                </Typography>
                                                            </Box>
                                                        )}
                                                    </>
                                                }
                                            />
                                            <ListItemSecondaryAction>
                                                <Chip
                                                    icon={<Comment fontSize="small" />}
                                                    label={event.review_count > 0 ? `${event.review_count} Reviews` : "No Reviews"}
                                                    color={event.review_count > 0 ? "primary" : "default"}
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenReviews(event);
                                                    }}
                                                />
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                        {index < pastEvents.length - 1 && <Divider component="li" />}
                                    </React.Fragment>
                                ))}
                            </List>
                        ) : (
                            <Box sx={{ p: 3, textAlign: 'center' }}>
                                <Typography variant="body1" color="text.secondary">
                                    No past events found
                                </Typography>
                            </Box>
                        )}
                    </Paper>
                )}
            </Box>

            {/* Enhanced Reviews Dialog */}
            <ReviewDialog
                open={openReviewsDialog}
                onClose={() => {
                    setOpenReviewsDialog(false);
                    setSelectedEvent(null);
                    // Refresh dashboard data to show updated review counts/ratings
                    fetchDashboardData();
                }}
                eventId={selectedEvent?.event_id}
                eventName={selectedEvent?.name}
                eventDate={selectedEvent?.event_date}
                eventLocation={selectedEvent?.location}
                initialRating={selectedEvent?.avg_rating}
                reviewCount={selectedEvent?.review_count}
            />
        </Box>
    );
}

export default Dashboard;