import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Typography, Box, Grid, Card, CardContent,
    CardMedia, CardActions, Button, Chip, IconButton,
    Alert, Divider, CircularProgress, Avatar,
    Tabs, Tab, Paper, Rating, Badge, Tooltip, Menu, MenuItem,
    TextField, InputAdornment
} from '@mui/material';
import {
    LocationOn, CalendarToday, FavoriteBorder, Favorite,
    History, Star, Event, Comment, Add, Edit,
    Person, MoreVert, Delete, Search, NavigateBefore, NavigateNext
} from '@mui/icons-material';
import CreateEventForm from './CreateEventForm';
import ReviewDialog from './ReviewDialog';
import EditEventForm from './EditEventForm';
import { Fab } from '@mui/material';
import api from '../utils/api';

function EventsList() {
    // State management
    const [events, setEvents] = useState({ upcoming: [], past: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
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
    const [editEventDialogOpen, setEditEventDialogOpen] = useState(false);

    // Pagination states
    const [upcomingPagination, setUpcomingPagination] = useState({
        page: 1,
        limit: 3,
        total: 0,
        pages: 0
    });

    const [pastPagination, setPastPagination] = useState({
        page: 1,
        limit: 3,
        total: 0,
        pages: 0
    });

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

    // Fetch upcoming events with pagination
    const fetchUpcomingEvents = useCallback(async () => {
        if (activeTab !== 0) return; // Only fetch when on upcoming tab

        setLoading(true);
        setError(null);

        try {
            console.log('Fetching upcoming events with params:', {
                page: upcomingPagination.page,
                limit: upcomingPagination.limit
            });

            const result = await api.events.getUpcomingEvents({
                page: upcomingPagination.page,
                limit: upcomingPagination.limit,
                sort_by: 'event_date',
                sort_order: 'asc'
            });

            console.log('Upcoming events API response:', result);

            if (!result) {
                throw new Error("Failed to fetch upcoming events");
            }

            // Handle different response structures
            let eventsData = [];
            let paginationData = upcomingPagination;

            if (Array.isArray(result)) {
                // Handle array response
                eventsData = result;
                console.log(`Received ${eventsData.length} upcoming events as array`);
            } else if (result.events) {
                // Handle object with events property
                eventsData = result.events;
                if (result.pagination) {
                    paginationData = result.pagination;
                }
                console.log(`Received ${eventsData.length} upcoming events with pagination`);
            } else {
                console.error('Unexpected response format:', result);
                throw new Error("Invalid response format");
            }

            setEvents(prev => ({
                ...prev,
                upcoming: eventsData
            }));

            // Update pagination state
            setUpcomingPagination(paginationData);
        } catch (error) {
            console.error("Error fetching upcoming events:", error);
            setError(typeof error === 'string' ? error : error.message || "Failed to load upcoming events");
            // Set empty array to avoid undefined errors
            setEvents(prev => ({
                ...prev,
                upcoming: []
            }));
        } finally {
            setLoading(false);
        }
    }, [activeTab, upcomingPagination.page, upcomingPagination.limit]);

    // Fetch past events with pagination
    const fetchPastEvents = useCallback(async () => {
        if (activeTab !== 1) return; // Only fetch when on past events tab

        setLoading(true);
        setError(null);

        try {
            console.log('Fetching past events with params:', {
                page: pastPagination.page,
                limit: pastPagination.limit
            });

            const result = await api.events.getPastEvents({
                page: pastPagination.page,
                limit: pastPagination.limit,
                sort_by: 'event_date',
                sort_order: 'desc'
            });

            console.log('Past events API response:', result);

            if (!result) {
                throw new Error("Failed to fetch past events");
            }

            // Handle different response structures
            let eventsData = [];
            let paginationData = pastPagination;

            if (Array.isArray(result)) {
                // Handle array response
                eventsData = result;
                console.log(`Received ${eventsData.length} past events as array`);
            } else if (result.events) {
                // Handle object with events property
                eventsData = result.events;
                if (result.pagination) {
                    paginationData = result.pagination;
                }
                console.log(`Received ${eventsData.length} past events with pagination`);
            } else {
                console.error('Unexpected response format:', result);
                throw new Error("Invalid response format");
            }

            setEvents(prev => ({
                ...prev,
                past: eventsData
            }));

            // Update pagination state
            setPastPagination(paginationData);
        } catch (error) {
            console.error("Error fetching past events:", error);
            setError(error.message || "Failed to load past events");
            // Set empty array to avoid undefined errors
            setEvents(prev => ({
                ...prev,
                past: []
            }));
        } finally {
            setLoading(false);
        }
    }, [activeTab, pastPagination.page, pastPagination.limit]);

    // Effect to load events based on active tab
    useEffect(() => {
        console.log('Active tab changed to:', activeTab);
        if (activeTab === 0) {
            fetchUpcomingEvents();
        } else {
            fetchPastEvents();
        }
    }, [activeTab, fetchUpcomingEvents, fetchPastEvents]);

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

        // Refresh events after potential review changes
        if (activeTab === 0) {
            fetchUpcomingEvents();
        } else {
            fetchPastEvents();
        }
    }, [activeTab, fetchUpcomingEvents, fetchPastEvents]);

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
        if (!selectedActionEvent) return;

        setEditEventDialogOpen(true);
    }, [handleCloseActionMenu, selectedActionEvent]);

    const handleEventUpdated = useCallback((updatedEvent) => {
        // Refresh events based on current tab
        if (activeTab === 0) {
            fetchUpcomingEvents();
        } else {
            fetchPastEvents();
        }
        setEditEventDialogOpen(false);
    }, [activeTab, fetchUpcomingEvents, fetchPastEvents]);

    const handleDeleteEvent = useCallback(async () => {
        handleCloseActionMenu();
        if (!selectedActionEvent) return;

        if (window.confirm(`Are you sure you want to delete "${selectedActionEvent.name}"?`)) {
            try {
                setLoading(true);
                await api.events.deleteEvent(selectedActionEvent.event_id);

                // Refresh events based on current tab
                if (activeTab === 0) {
                    fetchUpcomingEvents();
                } else {
                    fetchPastEvents();
                }
            } catch (error) {
                console.error("Error deleting event:", error);
                setError(`Error deleting event: ${error.message}`);
            } finally {
                setLoading(false);
            }
        }
    }, [handleCloseActionMenu, selectedActionEvent, activeTab, fetchUpcomingEvents, fetchPastEvents]);

    const handleEventCreated = useCallback(() => {
        // Refresh all events when a new one is created
        if (activeTab === 0) {
            fetchUpcomingEvents();
        } else {
            fetchPastEvents();
        }
        setCreateEventOpen(false);
    }, [activeTab, fetchUpcomingEvents, fetchPastEvents]);

    // Handle pagination
    const handleChangePage = useCallback((newPage) => {
        if (activeTab === 0) {
            setUpcomingPagination(prev => ({
                ...prev,
                page: newPage
            }));
        } else {
            setPastPagination(prev => ({
                ...prev,
                page: newPage
            }));
        }
    }, [activeTab]);

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

    // Filter events based on search term
    const filterEvents = useCallback((events) => {
        if (!searchTerm.trim()) return events;

        const search = searchTerm.toLowerCase();
        return events.filter(event =>
            (event.name && event.name.toLowerCase().includes(search)) ||
            (event.location && event.location.toLowerCase().includes(search)) ||
            (event.description && event.description.toLowerCase().includes(search))
        );
    }, [searchTerm]);

    // Render pagination controls
    const renderPagination = useCallback(() => {
        const pagination = activeTab === 0 ? upcomingPagination : pastPagination;

        console.log('Rendering pagination with:', pagination);

        // Safety check for invalid pagination data
        if (!pagination || typeof pagination.pages !== 'number') {
            console.error('Invalid pagination data:', pagination);
            return null;
        }

        return (
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Button
                    variant="outlined"
                    disabled={pagination.page <= 1}
                    onClick={() => handleChangePage(pagination.page - 1)}
                    startIcon={<NavigateBefore />}
                >
                    Previous
                </Button>

                <Typography sx={{ mx: 2, display: 'flex', alignItems: 'center' }}>
                    Page {pagination.page} of {pagination.pages || 1}
                </Typography>

                <Button
                    variant="outlined"
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => handleChangePage(pagination.page + 1)}
                    endIcon={<NavigateNext />}
                >
                    Next
                </Button>
            </Box>
        );
    }, [activeTab, upcomingPagination, pastPagination, handleChangePage]);

    // Memoized render functions for better performance
    const renderEventsList = useCallback((displayEvents, isPast = false) => {
        // Apply search filter
        const filteredEvents = filterEvents(displayEvents);

        if (filteredEvents.length === 0 && !loading) {
            return (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Typography variant="h5" color="text.secondary" gutterBottom>
                        {searchTerm ?
                            'No events match your search' :
                            `No ${isPast ? 'past' : 'upcoming'} events found`}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        {searchTerm ?
                            'Try different search terms' :
                            (isPast ?
                                'Events that have passed will appear here' :
                                'Check back later for upcoming events')}
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
                {filteredEvents.map(event => (
                    <Grid item xs={12} sm={6} md={4} key={event.event_id}>
                        <Card
                            sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                '&:hover': {
                                    transform: 'translateY(-4px) scale(1.05)',
                                    boxShadow: 6,
                                    zIndex: 1,
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
                                // Use Cloudinary URL directly without prepending API_BASE_URL
                                image={event.image_path || `https://source.unsplash.com/random/400x140/?event&sig=${event.event_id}`}
                                alt={event.name}
                                onError={(e) => {
                                    console.error('Image failed to load:', event.image_path);
                                    // Fall back to placeholder on error
                                    if (!e.target.dataset.tried) {
                                        e.target.dataset.tried = 'true';
                                        e.target.src = `https://source.unsplash.com/random/400x140/?event&sig=${event.event_id}`;
                                    }
                                }}
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
        loading, userRole, favorites, searchTerm, filterEvents,
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

            {/* Search field */}
            <TextField
                fullWidth
                variant="outlined"
                size="small"
                placeholder="Search events by name, location, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mb: 3 }}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <Search />
                        </InputAdornment>
                    ),
                }}
            />

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

            {/* Pagination controls */}
            {!loading && renderPagination()}

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

            {selectedActionEvent && (
                <EditEventForm
                    open={editEventDialogOpen}
                    onClose={() => setEditEventDialogOpen(false)}
                    onEventUpdated={handleEventUpdated}
                    eventData={selectedActionEvent}
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