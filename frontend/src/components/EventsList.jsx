import React, { useState, useEffect } from 'react';
import {
    Container, Typography, Box, Grid, Card, CardContent,
    CardMedia, CardActions, Button, Chip, IconButton,
    Skeleton, Alert, Divider, CircularProgress, Avatar,
    Tabs, Tab, Paper, Rating, Badge, Tooltip, Menu, MenuItem
} from '@mui/material';
import {
    LocationOn, AccessTime, CalendarToday,
    Share, FavoriteBorder, Favorite, History, Star, Event,
    Comment, Add, FilterList, ModeEdit, Person, MoreVert, Delete
} from '@mui/icons-material';
import CreateEventForm from './CreateEventForm';
import ReviewDialog from './ReviewDialog';
import { Fab } from '@mui/material';

function EventsList() {
    const [events, setEvents] = useState({ upcoming: [], past: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [favorites, setFavorites] = useState({});
    const [activeTab, setActiveTab] = useState(0);
    const [createEventOpen, setCreateEventOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
    const [userRole, setUserRole] = useState('user');
    const [currentUserId, setCurrentUserId] = useState(null);
    const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
    const [selectedActionEvent, setSelectedActionEvent] = useState(null);

    useEffect(() => {
        // Get user role from localStorage
        const storedRole = localStorage.getItem('userRole');
        if (storedRole) {
            setUserRole(storedRole);
        }
        
        // Get user ID from JWT token
        const token = localStorage.getItem('authToken');
        if (token) {
            try {
                const parts = token.split('.');
                if (parts.length === 3) {
                    const payload = parts[1];
                    // Use a safer approach for base64 decoding
                    const decodedPayload = JSON.parse(
                        decodeURIComponent(
                            window.atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
                                .split('')
                                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                                .join('')
                        )
                    );
                    console.log('Decoded token payload:', decodedPayload);
                    setCurrentUserId(decodedPayload.userId);
                }
            } catch (error) {
                console.error("Error getting user ID from token:", error);
            }
        }
        
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log("Fetching events...");
            const token = localStorage.getItem('authToken');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            console.log('Using API URL:', apiUrl);
            
            const response = await fetch(`${apiUrl}/api/events`, {
                headers
            });

            if (!response.ok) {
                throw new Error(`HTTP error fetching events: ${response.status}`);
            }

            const data = await response.json();
            console.log('All events:', data);

            // Simple approach - separate into upcoming and past events
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const upcomingEvents = [];
            const pastEvents = [];

            for (const event of data) {
                try {
                    const eventDate = new Date(event.event_date);
                    if (eventDate >= today) {
                        upcomingEvents.push(event);
                    } else {
                        pastEvents.push({
                            ...event,
                            review_count: event.review_count || 0,
                            avg_rating: event.avg_rating || 0
                        });
                    }
                } catch (error) {
                    console.error("Error processing event date:", error, event);
                    // Add to upcoming by default if there's a date parsing issue
                    upcomingEvents.push(event);
                }
            }

            // Sort events
            upcomingEvents.sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
            pastEvents.sort((a, b) => new Date(b.event_date) - new Date(a.event_date));

            setEvents({ upcoming: upcomingEvents, past: pastEvents });
            console.log('Processed events:', { upcoming: upcomingEvents, past: pastEvents });

        } catch (e) {
            console.error("Error fetching events:", e);
            setError(e.toString());
        } finally {
            setLoading(false);
        }
    };

    const toggleFavorite = (eventId, e) => {
        e.stopPropagation();
        setFavorites(prev => ({
            ...prev,
            [eventId]: !prev[eventId]
        }));
    };

    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            return new Intl.DateTimeFormat('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            }).format(date);
        } catch (error) {
            console.error("Error formatting date:", error, dateString);
            return "Invalid date";
        }
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const formatRating = (rating) => {
        return rating ? parseFloat(rating).toFixed(1) : 'No ratings';
    };

    const handleOpenCreateEvent = () => {
        setCreateEventOpen(true);
    };

    const handleCloseCreateEvent = () => {
        setCreateEventOpen(false);
    };

    const handleViewEvent = (event) => {
        setSelectedEvent(event);
        setReviewDialogOpen(true);
    };

    const handleCloseReviewDialog = () => {
        setSelectedEvent(null);
        setReviewDialogOpen(false);
        fetchEvents();
    };

    const handleOpenActionMenu = (event, eventData) => {
        event.stopPropagation();
        setSelectedActionEvent(eventData);
        setActionMenuAnchor(event.currentTarget);
    };

    const handleCloseActionMenu = () => {
        setActionMenuAnchor(null);
        setSelectedActionEvent(null);
    };

    const handleEditEvent = () => {
        handleCloseActionMenu();
        // Implement edit event functionality
        console.log("Edit event:", selectedActionEvent);
        alert("Edit functionality will be implemented soon!");
    };

    const handleDeleteEvent = async () => {
        handleCloseActionMenu();
        if (!selectedActionEvent) return;

        if (window.confirm(`Are you sure you want to delete "${selectedActionEvent.name}"?`)) {
            try {
                setLoading(true);
                const token = localStorage.getItem('authToken');
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                
                const response = await fetch(`${apiUrl}/api/events/${selectedActionEvent.event_id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    // Refresh events list
                    fetchEvents();
                } else {
                    throw new Error(`Failed to delete event: ${response.status}`);
                }
            } catch (error) {
                console.error("Error deleting event:", error);
                setError(`Error deleting event: ${error.message}`);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleEventCreated = (newEvent) => {
        fetchEvents(); // Refresh all events when a new one is created
        setCreateEventOpen(false);
    };

    // Check if the user is the creator of the event
    const isCreatedByUser = (event) => {
        return !!currentUserId && event.user_id === currentUserId;
    };
    
    // Check if user can manage this event (admin or creator)
    const canManageEvent = (event) => {
        return userRole === 'admin' || isCreatedByUser(event);
    };

    const renderEventsList = (displayEvents, isPast = false) => {
        if (displayEvents.length === 0 && !loading) {
            return (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Typography variant="h5" color="text.secondary" gutterBottom>
                        No {isPast ? 'past' : 'upcoming'} events found
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        {isPast ? 
                            'Events that have passed will appear here' : 
                            'Check back later for upcoming events'}
                    </Typography>
                    {userRole === 'admin' && !isPast && (
                        <Button 
                            variant="contained" 
                            color="primary" 
                            startIcon={<Add />}
                            sx={{ mt: 2 }}
                            onClick={handleOpenCreateEvent}
                        >
                            Create Event
                        </Button>
                    )}
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
                                position: 'relative',
                                cursor: 'pointer',
                                ...(isCreatedByUser(event) && {
                                    border: '1px solid',
                                    borderColor: 'primary.main'
                                })
                            }}
                            onClick={() => handleViewEvent(event)}
                        >
                            <CardMedia
                                component="img"
                                height="140"
                                image={`https://source.unsplash.com/random/400x140/?event&sig=${event.event_id}`}
                                alt={event.name}
                            />
                            <CardContent sx={{ flexGrow: 1 }}>
                                <Box sx={{ 
                                    position: 'absolute', 
                                    top: 12, 
                                    right: 12, 
                                    zIndex: 1,
                                    display: 'flex',
                                    gap: 1
                                }}>
                                    {/* Favorite button */}
                                    <IconButton
                                        onClick={(e) => toggleFavorite(event.event_id, e)}
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

                                    {/* More options button - only for admins or event creators */}
                                    {canManageEvent(event) && (
                                        <IconButton
                                            onClick={(e) => handleOpenActionMenu(e, event)}
                                            sx={{
                                                bgcolor: 'rgba(255,255,255,0.8)',
                                                '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
                                            }}
                                            size="small"
                                        >
                                            <MoreVert />
                                        </IconButton>
                                    )}
                                </Box>
                                
                                {isCreatedByUser(event) && (
                                    <Chip 
                                        label="Your Event" 
                                        size="small" 
                                        color="primary"
                                        sx={{ 
                                            position: 'absolute', 
                                            top: 148, 
                                            left: 8,
                                            fontSize: '0.7rem'
                                        }}
                                    />
                                )}
                                
                                <Typography
                                    variant="h6"
                                    component="h2"
                                    gutterBottom
                                    sx={{ fontWeight: 'bold', mt: isCreatedByUser(event) ? 3 : 0 }}
                                >
                                    {event.name}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <CalendarToday 
                                        fontSize="small" 
                                        color={isPast ? "action" : "primary"} 
                                        sx={{ mr: 1 }} 
                                    />
                                    <Typography variant="body2" color="text.secondary">
                                        {formatDate(event.event_date)}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <LocationOn 
                                        fontSize="small" 
                                        color={isPast ? "action" : "primary"} 
                                        sx={{ mr: 1 }} 
                                    />
                                    <Typography variant="body2" color="text.secondary">
                                        {event.location || 'No location specified'}
                                    </Typography>
                                </Box>

                                {isPast && event.review_count > 0 && (
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
                                <Typography 
                                    variant="body2" 
                                    color="text.secondary"
                                    sx={{
                                        display: '-webkit-box',
                                        WebkitLineClamp: 3,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}
                                >
                                    {event.description || 'No description provided'}
                                </Typography>
                            </CardContent>
                            <CardActions sx={{ p: 2, pt: 0 }}>
                                <Button
                                    variant="contained"
                                    size="small"
                                    color={isPast && event.review_count > 0 ? "secondary" : "primary"}
                                    startIcon={isPast && event.review_count > 0 ? <Star /> : null}
                                    sx={{ borderRadius: 4, px: 2 }}
                                >
                                    {isPast ? (event.review_count > 0 ? 'See Reviews' : 'Add Review') : 'View Details'}
                                </Button>
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
                <Box sx={{ display: 'flex', gap: 2 }}>
                    {/* Only show Create Event button for admin users */}
                    {userRole === 'admin' && (
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<Add />}
                            onClick={handleOpenCreateEvent}
                        >
                            Create Event
                        </Button>
                    )}
                    <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<CalendarToday />}
                        onClick={() => {
                            window.dispatchEvent(new CustomEvent('navigate', {
                                detail: 'calendar'
                            }));
                        }}
                    >
                        View Calendar
                    </Button>
                </Box>
            </Box>

            {error && (
                <Alert
                    severity="error"
                    sx={{ mb: 4 }}
                >
                    Error loading events: {error}
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

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress size={40} />
                </Box>
            ) : (
                activeTab === 0 
                    ? renderEventsList(events.upcoming || [], false) 
                    : renderEventsList(events.past || [], true)
            )}

            {/* Only show FAB Create Event button for admin users */}
            {userRole === 'admin' && (
                <Tooltip title="Create Event">
                    <Fab
                        color="primary"
                        aria-label="add event"
                        sx={{
                            position: 'fixed',
                            bottom: 20,
                            right: 20,
                            display: { xs: 'flex', md: 'none' }
                        }}
                        onClick={handleOpenCreateEvent}
                    >
                        <Add />
                    </Fab>
                </Tooltip>
            )}

            <CreateEventForm
                open={createEventOpen}
                onClose={handleCloseCreateEvent}
                onEventCreated={handleEventCreated}
            />
            
            {selectedEvent && (
                <ReviewDialog
                    open={reviewDialogOpen}
                    onClose={handleCloseReviewDialog}
                    eventId={selectedEvent.event_id}
                    eventName={selectedEvent.name}
                    eventDate={selectedEvent.event_date}
                    eventLocation={selectedEvent.location}
                    initialRating={selectedEvent.avg_rating}
                    reviewCount={selectedEvent.review_count}
                />
            )}

            {/* Action Menu for Events */}
            <Menu
                anchorEl={actionMenuAnchor}
                open={Boolean(actionMenuAnchor)}
                onClose={handleCloseActionMenu}
            >
                <MenuItem onClick={handleEditEvent}>
                    <ModeEdit fontSize="small" sx={{ mr: 1 }} /> Edit Event
                </MenuItem>
                <MenuItem onClick={handleDeleteEvent}>
                    <Delete fontSize="small" sx={{ mr: 1 }} /> Delete Event
                </MenuItem>
            </Menu>
        </Container>
    );
}

export default EventsList;