import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Typography, Box, Grid, Card, CardContent,
    CardMedia, CardActions, Button, Chip, IconButton,
    Alert, Divider, CircularProgress, Avatar,
    Tabs, Tab, Paper, Rating, Badge, Tooltip, Menu, MenuItem
} from '@mui/material';
import {
    LocationOn, CalendarToday, FavoriteBorder, Favorite, 
    History, Star, Event, Comment, Add, Edit, 
    Person, MoreVert, Delete
} from '@mui/icons-material';
import CreateEventForm from './CreateEventForm';
import ReviewDialog from './ReviewDialog';
import { Fab } from '@mui/material';
import api from '../utils/api';

function EventsList() {
    // State management
    const [events, setEvents] = useState({ upcoming: [], past: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [favorites, setFavorites] = useState(() => {
        // Load favorites from localStorage
        const storedFavorites = localStorage.getItem('eventFavorites');
        return storedFavorites ? JSON.parse(storedFavorites) : {};
    });
    const [activeTab, setActiveTab] = useState(0);
    const [createEventOpen, setCreateEventOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
    const [userRole, setUserRole] = useState(() => localStorage.getItem('userRole') || 'user');
    const [currentUserId, setCurrentUserId] = useState(null);
    const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
    const [selectedActionEvent, setSelectedActionEvent] = useState(null);

    // Extract user ID from JWT on component mount
    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setCurrentUserId(payload.userId);
            } catch (error) {
                console.error("Error extracting user ID from token:", error);
            }
        }
    }, []);

    // Fetch events data
    const fetchEvents = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            const eventsData = await api.events.getAllEvents();
            
            // Process events into upcoming and past categories
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const upcomingEvents = [];
            const pastEvents = [];
            
            eventsData.forEach(event => {
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
                    console.error("Date parsing error:", error);
                    upcomingEvents.push(event);
                }
            });
            
            // Sort events for better UX
            upcomingEvents.sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
            pastEvents.sort((a, b) => new Date(b.event_date) - new Date(a.event_date));
            
            setEvents({ upcoming: upcomingEvents, past: pastEvents });
        } catch (error) {
            console.error("Error fetching events:", error);
            setError(error.message || "Failed to load events");
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial data load
    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    // Save favorites to localStorage when they change
    useEffect(() => {
        localStorage.setItem('eventFavorites', JSON.stringify(favorites));
    }, [favorites]);

    // Event handlers
    const toggleFavorite = useCallback((eventId, e) => {
        e.stopPropagation();
        setFavorites(prev => ({
            ...prev,
            [eventId]: !prev[eventId]
        }));
    }, []);

    const handleTabChange = useCallback((event, newValue) => {
        setActiveTab(newValue);
    }, []);

    const handleOpenCreateEvent = useCallback(() => {
        setCreateEventOpen(true);
    }, []);

    const handleCloseCreateEvent = useCallback(() => {
        setCreateEventOpen(false);
    }, []);

    const handleViewEvent = useCallback((event) => {
        setSelectedEvent(event);
        setReviewDialogOpen(true);
    }, []);

    const handleCloseReviewDialog = useCallback(() => {
        setSelectedEvent(null);
        setReviewDialogOpen(false);
        fetchEvents(); // Refresh events after potential review changes
    }, [fetchEvents]);

    const handleOpenActionMenu = useCallback((event, eventData) => {
        event.stopPropagation();
        setSelectedActionEvent(eventData);
        setActionMenuAnchor(event.currentTarget);
    }, []);

    const handleCloseActionMenu = useCallback(() => {
        setActionMenuAnchor(null);
        setSelectedActionEvent(null);
    }, []);

    const handleEditEvent = useCallback(() => {
        handleCloseActionMenu();
        // Implement edit event functionality
        console.log("Edit event:", selectedActionEvent);
        alert("Edit functionality will be implemented soon!");
    }, [handleCloseActionMenu, selectedActionEvent]);

    const handleDeleteEvent = useCallback(async () => {
        handleCloseActionMenu();
        if (!selectedActionEvent) return;

        if (window.confirm(`Are you sure you want to delete "${selectedActionEvent.name}"?`)) {
            try {
                setLoading(true);
                await api.events.deleteEvent(selectedActionEvent.event_id);
                fetchEvents(); // Refresh events after deletion
            } catch (error) {
                console.error("Error deleting event:", error);
                setError(`Error deleting event: ${error.message}`);
            } finally {
                setLoading(false);
            }
        }
    }, [handleCloseActionMenu, selectedActionEvent, fetchEvents]);

    const handleEventCreated = useCallback(() => {
        fetchEvents(); // Refresh all events when a new one is created
        setCreateEventOpen(false);
    }, [fetchEvents]);

    // Helper functions
    const isCreatedByUser = useCallback((event) => {
        return !!currentUserId && event.user_id === currentUserId;
    }, [currentUserId]);
    
    const canManageEvent = useCallback((event) => {
        return userRole === 'admin' || isCreatedByUser(event);
    }, [userRole, isCreatedByUser]);

    const formatDate = useCallback((dateString) => {
        try {
            const date = new Date(dateString);
            return new Intl.DateTimeFormat('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            }).format(date);
        } catch (error) {
            console.error("Error formatting date:", error);
            return "Invalid date";
        }
    }, []);

    const formatRating = useCallback((rating) => {
        return rating ? parseFloat(rating).toFixed(1) : 'No ratings';
    }, []);

    // Memoized render functions for better performance
    const renderEventsList = useCallback((displayEvents, isPast = false) => {
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
                                        textOverflow: 'ellipsis',
                                        height: '4.5rem' // Fixed height to prevent layout shifts
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
    }, [
        loading, userRole, favorites, 
        handleOpenCreateEvent, handleViewEvent, 
        toggleFavorite, handleOpenActionMenu,
        isCreatedByUser, canManageEvent, formatDate, formatRating
    ]);

    // Memoized active events list based on selected tab
    const activeEventsList = useMemo(() => {
        return activeTab === 0 
            ? renderEventsList(events.upcoming || [], false) 
            : renderEventsList(events.past || [], true);
    }, [activeTab, events, renderEventsList]);

    return (
        <Box sx={{ width: '100%' }}>
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
                <Alert severity="error" sx={{ mb: 4 }}>
                    {error}
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
            ) : activeEventsList}

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
                    <Edit fontSize="small" sx={{ mr: 1 }} /> Edit Event
                </MenuItem>
                <MenuItem onClick={handleDeleteEvent}>
                    <Delete fontSize="small" sx={{ mr: 1 }} /> Delete Event
                </MenuItem>
            </Menu>
        </Box>
    );
}

export default EventsList;