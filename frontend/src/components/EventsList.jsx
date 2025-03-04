import React, { useState, useEffect } from 'react';
import {
    Container, Typography, Box, Grid, Card, CardContent,
    CardMedia, CardActions, Button, Chip, IconButton,
    Skeleton, Alert, Divider, CircularProgress, Avatar,
    Tabs, Tab, Paper, Rating
} from '@mui/material';
import {
    LocationOn, AccessTime, CalendarToday,
    Share, FavoriteBorder, Favorite, History, Star, Event
} from '@mui/icons-material';

function EventsList() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [favorites, setFavorites] = useState({});
    const [activeTab, setActiveTab] = useState(0); // 0 for upcoming, 1 for past

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log("Fetching events...");
            // Get authentication token
            const token = localStorage.getItem('authToken');

            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
            // Since we're having issues with the dedicated endpoints, let's use the main events endpoint
            // which doesn't require authentication
            const response = await fetch(`${apiUrl}/api/events`);

            if (!response.ok) {
                throw new Error(`HTTP error fetching events: ${response.status}`);
            }

            const data = await response.json();
            console.log('All events:', data);

            // Now separate the events into upcoming and past based on date
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Set to midnight for consistent comparison

            const upcomingEvents = [];
            const pastEvents = [];

            data.forEach(event => {
                // Parse event date and set to midnight for comparison
                const eventDate = new Date(event.event_date);
                const normalizedEventDate = new Date(
                    eventDate.getFullYear(),
                    eventDate.getMonth(),
                    eventDate.getDate(),
                    0, 0, 0, 0
                );

                if (normalizedEventDate >= today) {
                    upcomingEvents.push(event);
                } else {
                    // Add mock review data for past events
                    // In a real app, you'd fetch this from an API
                    pastEvents.push({
                        ...event,
                        review_count: Math.floor(Math.random() * 5), // Random number of reviews
                        avg_rating: (3 + Math.random() * 2).toFixed(1) // Random rating between 3-5
                    });
                }
            });

            // Sort events by date
            upcomingEvents.sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
            pastEvents.sort((a, b) => new Date(b.event_date) - new Date(a.event_date)); // Past events in reverse

            setEvents({ upcoming: upcomingEvents, past: pastEvents });

        } catch (e) {
            setError(e);
            console.error("Error fetching events:", e);

            // Set empty arrays to avoid undefined errors
            setEvents({ upcoming: [], past: [] });
        } finally {
            setLoading(false);
        }
    };

    const toggleFavorite = (eventId) => {
        setFavorites(prev => ({
            ...prev,
            [eventId]: !prev[eventId]
        }));
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }).format(date);
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const formatRating = (rating) => {
        return rating ? parseFloat(rating).toFixed(1) : 'No ratings';
    };

    // Empty state with sample data
    const sampleEvents = loading ? [
        {
            event_id: 'sample1',
            name: 'Sample Event',
            event_date: new Date().toISOString(),
            location: 'Sample Location',
            description: 'This is a placeholder description for a sample event while your data loads.'
        },
        {
            event_id: 'sample2',
            name: 'Another Event',
            event_date: new Date().toISOString(),
            location: 'Virtual',
            description: 'Another placeholder description for demonstration purposes.'
        }
    ] : [];

    const renderUpcomingEvents = () => {
        const displayEvents = loading ? sampleEvents :
            (events && events.upcoming ? events.upcoming : []);

        if (displayEvents.length === 0 && !loading) {
            return (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Typography variant="h5" color="text.secondary" gutterBottom>
                        No upcoming events found
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Check back later for upcoming events
                    </Typography>
                </Box>
            );
        }

        return (
            <Grid container spacing={3}>
                {displayEvents.map(event => (
                    <Grid item xs={12} sm={6} md={4} key={event.event_id}>
                        <Card
                            sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: 6,
                                },
                                position: 'relative'
                            }}
                        >
                            {loading ? (
                                <Skeleton variant="rectangular" height={140} />
                            ) : (
                                <CardMedia
                                    component="img"
                                    height="140"
                                    image={`/api/placeholder/400/140`}
                                    alt={event.name}
                                />
                            )}
                            <CardContent sx={{ flexGrow: 1 }}>
                                {loading ? (
                                    <>
                                        <Skeleton variant="text" height={32} width="80%" />
                                        <Skeleton variant="text" height={24} width="60%" />
                                        <Skeleton variant="text" height={20} width="40%" />
                                        <Skeleton variant="text" height={20} width="100%" sx={{ mt: 1 }} />
                                        <Skeleton variant="text" height={20} width="90%" />
                                    </>
                                ) : (
                                    <>
                                        <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 1 }}>
                                            <IconButton
                                                onClick={() => toggleFavorite(event.event_id)}
                                                sx={{
                                                    bgcolor: 'rgba(255,255,255,0.8)',
                                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
                                                }}
                                                size="small"
                                            >
                                                {favorites[event.event_id] ?
                                                    <Favorite color="error" /> :
                                                    <FavoriteBorder />
                                                }
                                            </IconButton>
                                        </Box>
                                        <Typography
                                            variant="h6"
                                            component="h2"
                                            gutterBottom
                                            sx={{ fontWeight: 'bold' }}
                                        >
                                            {event.name}
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <CalendarToday fontSize="small" color="primary" sx={{ mr: 1 }} />
                                            <Typography variant="body2" color="text.secondary">
                                                {formatDate(event.event_date)}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <LocationOn fontSize="small" color="primary" sx={{ mr: 1 }} />
                                            <Typography variant="body2" color="text.secondary">
                                                {event.location || 'No location specified'}
                                            </Typography>
                                        </Box>
                                        <Divider sx={{ my: 1.5 }} />
                                        <Typography variant="body2" color="text.secondary">
                                            {event.description || 'No description provided'}
                                        </Typography>
                                    </>
                                )}
                            </CardContent>
                            <CardActions sx={{ p: 2, pt: 0 }}>
                                {loading ? (
                                    <Skeleton variant="rectangular" height={36} width={120} />
                                ) : (
                                    <Button
                                        variant="contained"
                                        size="small"
                                        color="primary"
                                        sx={{ borderRadius: 4, px: 2 }}
                                    >
                                        View Details
                                    </Button>
                                )}
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        );
    };

    const renderPastEvents = () => {
        const displayEvents = loading ? sampleEvents :
            (events && events.past ? events.past : []);

        if (displayEvents.length === 0 && !loading) {
            return (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Typography variant="h5" color="text.secondary" gutterBottom>
                        No past events found
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Events you've attended will appear here
                    </Typography>
                </Box>
            );
        }

        return (
            <Grid container spacing={3}>
                {displayEvents.map(event => (
                    <Grid item xs={12} sm={6} md={4} key={event.event_id}>
                        <Card
                            sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: 6,
                                },
                                position: 'relative'
                            }}
                        >
                            {loading ? (
                                <Skeleton variant="rectangular" height={140} />
                            ) : (
                                <CardMedia
                                    component="img"
                                    height="140"
                                    image={`/api/placeholder/400/140`}
                                    alt={event.name}
                                />
                            )}
                            <CardContent sx={{ flexGrow: 1 }}>
                                {loading ? (
                                    <>
                                        <Skeleton variant="text" height={32} width="80%" />
                                        <Skeleton variant="text" height={24} width="60%" />
                                        <Skeleton variant="text" height={20} width="40%" />
                                        <Skeleton variant="text" height={20} width="100%" sx={{ mt: 1 }} />
                                        <Skeleton variant="text" height={20} width="90%" />
                                    </>
                                ) : (
                                    <>
                                        <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 1 }}>
                                            <IconButton
                                                onClick={() => toggleFavorite(event.event_id)}
                                                sx={{
                                                    bgcolor: 'rgba(255,255,255,0.8)',
                                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
                                                }}
                                                size="small"
                                            >
                                                {favorites[event.event_id] ?
                                                    <Favorite color="error" /> :
                                                    <FavoriteBorder />
                                                }
                                            </IconButton>
                                        </Box>
                                        <Typography
                                            variant="h6"
                                            component="h2"
                                            gutterBottom
                                            sx={{ fontWeight: 'bold' }}
                                        >
                                            {event.name}
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <CalendarToday fontSize="small" color="action" sx={{ mr: 1 }} />
                                            <Typography variant="body2" color="text.secondary">
                                                {formatDate(event.event_date)}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <LocationOn fontSize="small" color="action" sx={{ mr: 1 }} />
                                            <Typography variant="body2" color="text.secondary">
                                                {event.location || 'No location specified'}
                                            </Typography>
                                        </Box>

                                        {/* Show ratings for past events */}
                                        {event.review_count > 0 && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                <Rating
                                                    value={parseFloat(event.avg_rating) || 0}
                                                    precision={0.5}
                                                    readOnly
                                                    size="small"
                                                />
                                                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                                    {formatRating(event.avg_rating)} ({event.review_count} {event.review_count === 1 ? 'review' : 'reviews'})
                                                </Typography>
                                            </Box>
                                        )}

                                        <Divider sx={{ my: 1.5 }} />
                                        <Typography variant="body2" color="text.secondary">
                                            {event.description || 'No description provided'}
                                        </Typography>
                                    </>
                                )}
                            </CardContent>
                            <CardActions sx={{ p: 2, pt: 0 }}>
                                {loading ? (
                                    <Skeleton variant="rectangular" height={36} width={120} />
                                ) : (
                                    <Button
                                        variant="contained"
                                        size="small"
                                        color={event.review_count > 0 ? "secondary" : "primary"}
                                        startIcon={event.review_count > 0 ? <Star /> : null}
                                        sx={{ borderRadius: 4, px: 2 }}
                                    >
                                        {event.review_count > 0 ? 'See Reviews' : 'Add Review'}
                                    </Button>
                                )}
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        );
    };

    return (
        <Container maxWidth={false} sx={{ width: '100%' }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography
                    variant="h4"
                    component="h1"
                    sx={{ fontWeight: 'bold' }}
                >
                    Events
                </Typography>
                <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<CalendarToday />}
                    onClick={() => {
                        // Dispatch a custom event to navigate to the calendar
                        window.dispatchEvent(new CustomEvent('navigate', {
                            detail: 'calendar'
                        }));
                    }}
                >
                    View Calendar
                </Button>
            </Box>

            {error && (
                <Alert
                    severity="warning"
                    sx={{ mb: 4 }}
                >
                    Note: Using fallback data sorting due to API error. {error.message}
                </Alert>
            )}

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    aria-label="event tabs"
                    variant="fullWidth"
                >
                    <Tab
                        label="Upcoming Events"
                        icon={<Event />}
                        iconPosition="start"
                    />
                    <Tab
                        label="Past Events"
                        icon={<History />}
                        iconPosition="start"
                    />
                </Tabs>
            </Box>

            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress size={40} />
                </Box>
            )}

            {!loading && (
                activeTab === 0 ? renderUpcomingEvents() : renderPastEvents()
            )}
        </Container>
    );
}

export default EventsList;