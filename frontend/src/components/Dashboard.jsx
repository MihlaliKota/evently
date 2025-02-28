import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Grid, Card, CardContent,
    Divider, CircularProgress, Paper,
    List, ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction,
    Chip, Tabs, Tab, Dialog, DialogTitle, DialogContent, Rating, Avatar,
    Button
} from '@mui/material';
import {
    EventAvailable, People, CalendarToday, Check,
    Event, History, Star, Comment
} from '@mui/icons-material';

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

    // Get JWT token from localStorage - UPDATED to use authToken
    const getToken = () => {
        const token = localStorage.getItem('authToken');
        console.log('Token found in Dashboard:', token ? 'Yes' : 'No');
        return token;
    };

    // Fetch dashboard data
    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
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

                // Fetch all events from a single endpoint
                const eventsResponse = await fetch('http://localhost:5000/api/events', { headers });
                if (!eventsResponse.ok) {
                    console.error('Events fetch error:', eventsResponse.status);
                    throw new Error('Failed to fetch events');
                }
                const eventsData = await eventsResponse.json();

                // Fetch stats
                const statsResponse = await fetch('http://localhost:5000/api/dashboard/stats', { headers });
                if (!statsResponse.ok) {
                    console.error('Stats fetch error:', statsResponse.status);
                    throw new Error('Failed to fetch stats');
                }
                const statsData = await statsResponse.json();
                setStats(statsData);

                // Categorize events by date
                const upcomingEvents = eventsData.filter(event => {
                    const eventDate = new Date(event.event_date);
                    const today = new Date();
                    return eventDate >= today;
                });

                const pastEvents = eventsData.filter(event => {
                    const eventDate = new Date(event.event_date);
                    const today = new Date();
                    return eventDate < today;
                });

                // Set events
                setUpcomingEvents(upcomingEvents);
                setPastEvents(pastEvents);

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
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

            // Use full URL for API call
            const response = await fetch(`http://localhost:5000/api/events/${eventId}/reviews`, { headers });
            if (!response.ok) {
                console.error('Reviews fetch error:', response.status);
                throw new Error('Failed to fetch reviews');
            }
            const data = await response.json();
            setEventReviews(data);
        } catch (error) {
            console.error('Error fetching event reviews:', error);
        } finally {
            setLoadingReviews(false);
        }
    };

    const handleOpenReviews = (event) => {
        setSelectedEvent(event);
        setOpenReviewsDialog(true);
        fetchEventReviews(event.event_id);
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
                                        {stats.totalEvents}
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
                                        {upcomingEvents.length}
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
                                        {stats.totalAttendees}
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
                                        {pastEvents.length}
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
                                                                {formatDate(event.event_date)} • {event.location}
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
                                                                <Star sx={{ color: 'gold', fontSize: 16, mr: 0.5 }} />
                                                                <Typography variant="body2" color="text.secondary">
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

            {/* Reviews Dialog */}
            <Dialog
                open={openReviewsDialog}
                onClose={handleCloseReviews}
                fullWidth
                maxWidth="md"
            >
                {selectedEvent && (
                    <>
                        <DialogTitle>
                            <Typography variant="h6">{selectedEvent.name} - Reviews</Typography>
                            <Typography variant="subtitle2" color="text.secondary">
                                {formatDate(selectedEvent.event_date)} • {selectedEvent.location || 'No location'}
                            </Typography>
                            {selectedEvent.review_count > 0 && (
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                    <Rating
                                        value={parseFloat(selectedEvent.avg_rating) || 0}
                                        precision={0.1}
                                        readOnly
                                        size="small"
                                    />
                                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                        {formatRating(selectedEvent.avg_rating)} ({selectedEvent.review_count} reviews)
                                    </Typography>
                                </Box>
                            )}
                        </DialogTitle>
                        <DialogContent dividers>
                            {loadingReviews ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                    <CircularProgress size={30} />
                                </Box>
                            ) : eventReviews.length > 0 ? (
                                <List>
                                    {eventReviews.map((review) => (
                                        <ListItem key={review.review_id} alignItems="flex-start" sx={{ px: 1, py: 2 }}>
                                            <Box sx={{ width: '100%' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                    <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                                                        {review.username.charAt(0).toUpperCase()}
                                                    </Avatar>
                                                    <Typography variant="subtitle2">
                                                        {review.username}
                                                    </Typography>
                                                    <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
                                                        <Rating value={review.rating} readOnly size="small" />
                                                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                                            {formatDate(review.created_at)}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                                    {review.review_text || "No comment provided"}
                                                </Typography>
                                            </Box>
                                        </ListItem>
                                    ))}
                                </List>
                            ) : (
                                <Box sx={{ p: 3, textAlign: 'center' }}>
                                    <Typography variant="body1" color="text.secondary">
                                        No reviews available for this event
                                    </Typography>
                                </Box>
                            )}
                        </DialogContent>
                    </>
                )}
            </Dialog>
        </Box>
    );
}

export default Dashboard;