import React, { useState, useEffect } from 'react';
import { 
    Container, Typography, Box, Grid, Card, CardContent, 
    CardMedia, CardActions, Button, Chip, IconButton,
    Skeleton, Alert, Divider, CircularProgress, Avatar
} from '@mui/material';
import { 
    LocationOn, AccessTime, CalendarToday, 
    Share, BookmarkBorder, Bookmark, FavoriteBorder, Favorite
} from '@mui/icons-material';

function EventsList() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [favorites, setFavorites] = useState({});

    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch('http://localhost:5000/api/events');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setEvents(data);
                setLoading(false);
            } catch (e) {
                setError(e);
                setLoading(false);
                console.error("Error fetching events:", e);
            }
        };
        fetchEvents();
    }, []);

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

    // Empty state with sample data
    const sampleEvents = loading && events.length === 0 ? [
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

    const renderEvents = () => {
        const displayEvents = loading && events.length === 0 ? sampleEvents : events;
        
        if (displayEvents.length === 0 && !loading) {
            return (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Typography variant="h5" color="text.secondary" gutterBottom>
                        No events found
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
                                                {event.location}
                                            </Typography>
                                        </Box>
                                        <Divider sx={{ my: 1.5 }} />
                                        <Typography variant="body2" color="text.secondary">
                                            {event.description}
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

    return (
        <Container maxWidth="lg">
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography 
                    variant="h4" 
                    component="h1" 
                    sx={{ fontWeight: 'bold' }}
                >
                    Upcoming Events
                </Typography>
                <Button 
                    variant="outlined" 
                    color="primary" 
                    startIcon={<CalendarToday />}
                >
                    View Calendar
                </Button>
            </Box>
            
            {error && (
                <Alert 
                    severity="error" 
                    sx={{ mb: 4 }}
                >
                    Error loading events: {error.message}
                </Alert>
            )}
            
            {loading && events.length === 0 && (
                <Box sx={{ position: 'relative' }}>
                    <Box 
                        sx={{ 
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            bgcolor: 'rgba(255,255,255,0.7)',
                            zIndex: 1
                        }}
                    >
                        <CircularProgress size={40} />
                        <Typography variant="body2" sx={{ mt: 2 }}>
                            Loading events...
                        </Typography>
                    </Box>
                </Box>
            )}
            
            {renderEvents()}
        </Container>
    );
}

export default EventsList;