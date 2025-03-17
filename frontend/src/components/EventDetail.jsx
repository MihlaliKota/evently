// EventDetail.jsx - Enhanced event detail page with review functionality and image support
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Paper, Button, Divider, Card, CardContent,
    Grid, Chip, Avatar, Alert, CircularProgress, Stack,
    ListItem, ListItemText, ListItemAvatar, List
} from '@mui/material';
import {
    LocationOn, CalendarToday, Person, ArrowBack,
    Category, EventAvailable, Comment, Share, Add
} from '@mui/icons-material';
import StarRating from './StarRating';
import ReviewDialog from './ReviewDialog';

const EventDetail = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [openReviewDialog, setOpenReviewDialog] = useState(false);
    const [similarEvents, setSimilarEvents] = useState([]);
    
    // Get JWT token from localStorage
    const getToken = () => {
        return localStorage.getItem('authToken');
    };
    
    // Format date for display
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric'
        }).format(date);
    };
    
    // Check if event date is in the past
    const isEventPast = (dateString) => {
        const eventDate = new Date(dateString);
        return eventDate < new Date();
    };
    
    // Fetch event data
    useEffect(() => {
        const fetchEventData = async () => {
            setLoading(true);
            setError(null);
            
            try {
                const token = getToken();
                const headers = token ? {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                } : {
                    'Content-Type': 'application/json'
                };
                
                // Fetch event details
                const eventResponse = await fetch(`http://localhost:5000/api/events/${eventId}`, { headers });
                if (!eventResponse.ok) {
                    throw new Error(`Failed to fetch event: ${eventResponse.status}`);
                }
                
                const eventData = await eventResponse.json();
                setEvent(eventData);
                
                // Fetch event reviews
                setLoadingReviews(true);
                try {
                    const reviewsResponse = await fetch(`http://localhost:5000/api/events/${eventId}/reviews`, { headers });
                    if (reviewsResponse.ok) {
                        const reviewsData = await reviewsResponse.json();
                        setReviews(reviewsData);
                    }
                } catch (error) {
                    console.error('Error fetching reviews:', error);
                } finally {
                    setLoadingReviews(false);
                }
                
                // Fetch similar events (same category)
                try {
                    if (eventData.category_id) {
                        const similarEventsResponse = await fetch(
                            `http://localhost:5000/api/events?category_id=${eventData.category_id}&limit=3`, 
                            { headers }
                        );
                        
                        if (similarEventsResponse.ok) {
                            const similarEventsData = await similarEventsResponse.json();
                            // Filter out the current event
                            setSimilarEvents(
                                similarEventsData.filter(e => e.event_id !== parseInt(eventId))
                            );
                        }
                    }
                } catch (error) {
                    console.error('Error fetching similar events:', error);
                }
            } catch (error) {
                console.error('Error fetching event data:', error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };
        
        if (eventId) {
            fetchEventData();
        }
    }, [eventId]);
    
    // Calculate average rating
    const getAverageRating = () => {
        if (!reviews || reviews.length === 0) return 0;
        
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        return totalRating / reviews.length;
    };
    
    // Add to calendar
    const addToCalendar = () => {
        if (!event) return;
        
        const { name, description, location, event_date } = event;
        const eventStart = new Date(event_date);
        // Default duration 2 hours
        const eventEnd = new Date(eventStart.getTime() + 2 * 60 * 60 * 1000);
        
        // Format dates for Google Calendar
        const formatGoogleDate = (date) => {
            return date.toISOString().replace(/-|:|\.\d\d\d/g, '');
        };
        
        // Create Google Calendar URL
        const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(name)}&dates=${formatGoogleDate(eventStart)}/${formatGoogleDate(eventEnd)}&details=${encodeURIComponent(description || '')}&location=${encodeURIComponent(location || '')}&sf=true&output=xml`;
        
        // Open in new window
        window.open(googleCalendarUrl, '_blank');
    };
    
    // Share event
    const shareEvent = () => {
        if (navigator.share) {
            navigator.share({
                title: event?.name || 'Event',
                text: `Check out this event: ${event?.name}`,
                url: window.location.href
            });
        } else {
            // Fallback for browsers that don't support the Web Share API
            navigator.clipboard.writeText(window.location.href);
            alert('Link copied to clipboard!');
        }
    };
    
    // Loading state
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
            </Box>
        );
    }
    
    // Error state
    if (error) {
        return (
            <Box sx={{ maxWidth: 'md', mx: 'auto', mt: 4 }}>
                <Alert severity="error">{error}</Alert>
                <Button 
                    variant="contained" 
                    sx={{ mt: 2 }} 
                    onClick={() => navigate(-1)}
                    startIcon={<ArrowBack />}
                >
                    Go Back
                </Button>
            </Box>
        );
    }
    
    // If event not found
    if (!event) {
        return (
            <Box sx={{ maxWidth: 'md', mx: 'auto', mt: 4 }}>
                <Alert severity="warning">Event not found</Alert>
                <Button 
                    variant="contained" 
                    sx={{ mt: 2 }} 
                    onClick={() => navigate('/events')}
                    startIcon={<ArrowBack />}
                >
                    Back to Events
                </Button>
            </Box>
        );
    }
    
    const avgRating = getAverageRating();
    const isPast = isEventPast(event.event_date);
    
    return (
        <Box sx={{ maxWidth: 'lg', mx: 'auto' }}>
            {/* Back button */}
            <Button 
                variant="text" 
                startIcon={<ArrowBack />} 
                onClick={() => navigate(-1)}
                sx={{ mb: 2 }}
            >
                Back
            </Button>
            
            {/* Main content */}
            <Grid container spacing={3}>
                {/* Event details */}
                <Grid item xs={12} md={8}>
                    <Card sx={{ mb: 3 }}>
                        <Box 
                            sx={{ 
                                height: 250,  // Increased height for better image display
                                bgcolor: 'primary.main', 
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                position: 'relative',
                                overflow: 'hidden' // Ensure image doesn't overflow
                            }}
                        >
                            {/* Display uploaded image or fallback to background color */}
                            {event.image_path && (
                                <img 
                                    src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${event.image_path}`}
                                    alt={event.name}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        position: 'absolute',
                                        top: 0,
                                        left: 0
                                    }}
                                />
                            )}
                            
                            {/* Add an overlay to ensure text is readable over the image */}
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    background: 'linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.6))',
                                    zIndex: 1
                                }}
                            />
                            
                            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', zIndex: 2 }}>
                                {event.name}
                            </Typography>
                            
                            {/* Status badge */}
                            <Chip
                                label={isPast ? 'Past Event' : 'Upcoming'}
                                color={isPast ? 'default' : 'success'}
                                sx={{ 
                                    position: 'absolute', 
                                    top: 16, 
                                    right: 16,
                                    zIndex: 2
                                }}
                            />
                        </Box>
                        
                        <CardContent>
                            {/* Event details */}
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <CalendarToday color="primary" sx={{ mr: 1 }} />
                                        <Typography variant="body1">
                                            {formatDate(event.event_date)}
                                        </Typography>
                                    </Box>
                                </Grid>
                                
                                <Grid item xs={12} sm={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <LocationOn color="primary" sx={{ mr: 1 }} />
                                        <Typography variant="body1">
                                            {event.location || 'No location specified'}
                                        </Typography>
                                    </Box>
                                </Grid>
                                
                                {event.category_name && (
                                    <Grid item xs={12} sm={6}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <Category color="primary" sx={{ mr: 1 }} />
                                            <Typography variant="body1">
                                                Category: {event.category_name}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                )}
                                
                                {event.attendees > 0 && (
                                    <Grid item xs={12} sm={6}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <Person color="primary" sx={{ mr: 1 }} />
                                            <Typography variant="body1">
                                                {event.attendees} Attendees
                                            </Typography>
                                        </Box>
                                    </Grid>
                                )}
                            </Grid>
                            
                            <Divider sx={{ my: 2 }} />
                            
                            {/* Event description */}
                            <Typography variant="h6" gutterBottom>
                                About this event
                            </Typography>
                            <Typography variant="body1" paragraph>
                                {event.description || 'No description provided for this event.'}
                            </Typography>
                            
                            {/* Event rating summary */}
                            <Box sx={{ mt: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    Event Rating
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <StarRating 
                                        value={avgRating} 
                                        readOnly 
                                        size="large"
                                        showValue
                                    />
                                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                        ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                                    </Typography>
                                </Box>
                            </Box>
                            
                            {/* Action buttons */}
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 2 }}>
                                <Button 
                                    variant="outlined"
                                    startIcon={<Share />}
                                    onClick={shareEvent}
                                >
                                    Share
                                </Button>
                                
                                <Button 
                                    variant="outlined"
                                    startIcon={<CalendarToday />}
                                    onClick={addToCalendar}
                                >
                                    Add to Calendar
                                </Button>
                                
                                <Button 
                                    variant="contained"
                                    startIcon={isPast ? <Comment /> : <EventAvailable />}
                                    onClick={() => {
                                        if (isPast) {
                                            setOpenReviewDialog(true);
                                        } else {
                                            // Logic to RSVP for event
                                            console.log('RSVP for event', event.event_id);
                                        }
                                    }}
                                >
                                    {isPast ? 'See Reviews' : 'RSVP'}
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                    
                    {/* Recent reviews */}
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6">
                                    Recent Reviews
                                </Typography>
                                <Button 
                                    variant="text" 
                                    endIcon={<Add />}
                                    onClick={() => setOpenReviewDialog(true)}
                                >
                                    {reviews.length > 0 ? 'See All Reviews' : 'Add Review'}
                                </Button>
                            </Box>
                            
                            <Divider sx={{ mb: 2 }} />
                            
                            {loadingReviews ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                                    <CircularProgress size={30} />
                                </Box>
                            ) : reviews.length > 0 ? (
                                <List>
                                    {reviews.slice(0, 3).map((review) => (
                                        <ListItem key={review.review_id} alignItems="flex-start" sx={{ px: 0 }}>
                                            <ListItemAvatar>
                                                <Avatar>
                                                    {review.username?.charAt(0).toUpperCase() || 'U'}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <Typography variant="subtitle1" component="span">
                                                            {review.username}
                                                        </Typography>
                                                        <Box sx={{ ml: 'auto' }}>
                                                            <StarRating value={review.rating} readOnly size="small" />
                                                        </Box>
                                                    </Box>
                                                }
                                                secondary={
                                                    <>
                                                        <Typography variant="body2" color="text.primary" sx={{ mb: 0.5 }}>
                                                            {review.review_text || "No comment provided"}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {new Date(review.created_at).toLocaleDateString()}
                                                        </Typography>
                                                    </>
                                                }
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            ) : (
                                <Box sx={{ py: 3, textAlign: 'center' }}>
                                    <Typography variant="body1" color="text.secondary">
                                        No reviews yet for this event.
                                    </Typography>
                                    <Button 
                                        variant="outlined" 
                                        startIcon={<Add />} 
                                        sx={{ mt: 2 }}
                                        onClick={() => setOpenReviewDialog(true)}
                                    >
                                        Be the first to review
                                    </Button>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
                
                {/* Sidebar */}
                <Grid item xs={12} md={4}>
                    {/* Event organizer */}
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Event Organizer
                            </Typography>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar sx={{ mr: 2 }}>
                                    {event.organizer_name ? event.organizer_name.charAt(0).toUpperCase() : 'O'}
                                </Avatar>
                                <Box>
                                    <Typography variant="subtitle1">
                                        {event.organizer_name || 'Event Organizer'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {event.organizer_email || 'Contact information not available'}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                    
                    {/* Similar events */}
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Similar Events
                            </Typography>
                            
                            {similarEvents.length > 0 ? (
                                <Stack spacing={2}>
                                    {similarEvents.map((similarEvent) => (
                                        <Paper 
                                            key={similarEvent.event_id} 
                                            elevation={0} 
                                            sx={{ 
                                                p: 2, 
                                                bgcolor: 'background.default',
                                                cursor: 'pointer',
                                                '&:hover': {
                                                    bgcolor: 'action.hover'
                                                }
                                            }}
                                            onClick={() => navigate(`/events/${similarEvent.event_id}`)}
                                        >
                                            <Typography variant="subtitle1" sx={{ fontWeight: 'medium', mb: 0.5 }}>
                                                {similarEvent.name}
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                                <CalendarToday fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                                                <Typography variant="body2" color="text.secondary">
                                                    {new Date(similarEvent.event_date).toLocaleDateString()}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <LocationOn fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                                                <Typography variant="body2" color="text.secondary">
                                                    {similarEvent.location || 'No location'}
                                                </Typography>
                                            </Box>
                                        </Paper>
                                    ))}
                                </Stack>
                            ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                                    No similar events found
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
            
            {/* Review Dialog */}
            <ReviewDialog
                open={openReviewDialog}
                onClose={() => setOpenReviewDialog(false)}
                eventId={event.event_id}
                eventName={event.name}
                eventDate={event.event_date}
                eventLocation={event.location}
                initialRating={avgRating}
                reviewCount={reviews.length}
            />
        </Box>
    );
};

export default EventDetail;