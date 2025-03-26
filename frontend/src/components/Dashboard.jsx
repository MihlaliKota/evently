import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box, Typography, Grid, Card, CardContent,
    Divider, CircularProgress, Paper, List, ListItem, 
    ListItemText, ListItemIcon, ListItemSecondaryAction,
    Chip, Tabs, Tab, Avatar, Button, Alert, useTheme, 
    useMediaQuery, Badge, Tooltip, LinearProgress
} from '@mui/material';
import {
    EventAvailable, CalendarToday, Check, Event, 
    History, Star, TrendingUp, Person, Refresh, 
    Comment
} from '@mui/icons-material';
import StarRating from './StarRating';
import ReviewDialog from './ReviewDialog';
import { format, differenceInDays } from 'date-fns';
import api from '../utils/api';

function Dashboard({ username, profilePicture }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    
    const [stats, setStats] = useState({
        totalEvents: 0,
        upcomingEvents: 0,
        completedEvents: 0
    });
    
    const [loading, setLoading] = useState(true);
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [pastEvents, setPastEvents] = useState([]);
    const [eventTab, setEventTab] = useState(0);
    const [dashboardTab, setDashboardTab] = useState(0);
    const [openReviewsDialog, setOpenReviewsDialog] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [eventReviews, setEventReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    
    // Memoized user engagement data
    const [userEngagement, setUserEngagement] = useState({
        eventsAttended: 0,
        reviewsSubmitted: 0,
        averageRating: 0,
        categoryPreferences: [],
        recentActivity: [],
        achievements: []
    });
    
    const [communityActivity, setCommunityActivity] = useState([]);

    // Fetch dashboard data (optimized to use our API service)
    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Parallel API calls for better performance
            const [statsData, eventsData] = await Promise.all([
                api.dashboard.getStats().catch(() => ({
                    totalEvents: 0,
                    upcomingEvents: 0,
                    completedEvents: 0
                })),
                api.events.getAllEvents()
            ]);
            
            setStats(statsData || {
                totalEvents: 0,
                upcomingEvents: 0,
                completedEvents: 0
            });
            
            // Ensure eventsData has the expected structure
            const events = Array.isArray(eventsData) ? eventsData :
                          (eventsData && Array.isArray(eventsData.events) ? eventsData.events : []);
            
            // Process events into upcoming and past
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const upcoming = [];
            const past = [];
            
            // Ensure we have valid events before processing
            if (Array.isArray(events)) {
                events.forEach(event => {
                    if (!event || !event.event_date) return;
                    
                    try {
                        const eventDate = new Date(event.event_date);
                        if (eventDate >= today) {
                            upcoming.push(event);
                        } else {
                            past.push({
                                ...event,
                                review_count: event.review_count || 0,
                                avg_rating: event.avg_rating || 0
                            });
                        }
                    } catch (error) {
                        console.error('Date parsing error:', error);
                    }
                });
            }
            
            // Sort events for better UX
            if (upcoming.length > 0) {
                upcoming.sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
            }
            
            if (past.length > 0) {
                past.sort((a, b) => new Date(b.event_date) - new Date(a.event_date));
            }
            
            setUpcomingEvents(upcoming);
            setPastEvents(past);
            
            // Generate insights from event data
            generateInsights(past);
            
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setError(error.message || 'Failed to load dashboard data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);
    
    // Generate insights from event data
    const generateInsights = useCallback((pastEvents) => {
        // Ensure pastEvents is an array before processing
        const eventsArray = Array.isArray(pastEvents) ? pastEvents : [];
        
        // Calculate user engagement metrics
        const mockUserEngagement = {
            eventsAttended: eventsArray.length,
            reviewsSubmitted: eventsArray.reduce((sum, event) => sum + (event.review_count || 0), 0),
            averageRating: 4.2,
            categoryPreferences: generateCategoryPreferences(eventsArray),
            recentActivity: generateRecentActivity(eventsArray.slice(0, 3)),
            achievements: generateAchievements(eventsArray.length, stats)
        };
        
        setUserEngagement(mockUserEngagement);
        setCommunityActivity(generateCommunityActivity(eventsArray));
    }, [stats]);
    
    // Helper functions for generating insights
    const generateCategoryPreferences = (pastEvents) => {
        // Ensure pastEvents is an array
        if (!Array.isArray(pastEvents)) return [];
        
        const categories = {};
        pastEvents.forEach(event => {
            const categoryId = event.category_id;
            if (categoryId) {
                categories[categoryId] = (categories[categoryId] || 0) + 1;
            }
        });
        
        return Object.entries(categories)
            .map(([id, count]) => ({ id, count, name: `Category ${id}` }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 3);
    };
    
    const generateRecentActivity = (recentEvents) => {
        // Ensure recentEvents is an array
        if (!Array.isArray(recentEvents)) return [];
        
        return recentEvents.map(event => ({
            type: 'event_attendance',
            event_id: event.event_id,
            event_name: event.name,
            date: event.event_date,
            hasReview: event.review_count > 0
        }));
    };
    
    const generateAchievements = (pastEventsCount, stats) => {
        return [
            {
                id: 'first_event',
                title: 'First Event Attended',
                description: 'You attended your first event!',
                icon: <Event color="primary" />,
                completed: pastEventsCount > 0,
                progress: pastEventsCount > 0 ? 1 : 0
            },
            {
                id: 'event_explorer',
                title: 'Event Explorer',
                description: 'Attend 5 different events',
                icon: <Event color="secondary" />,
                completed: pastEventsCount >= 5,
                progress: Math.min(pastEventsCount / 5, 1)
            },
            {
                id: 'reviewer',
                title: 'Feedback Provider',
                description: 'Write your first review',
                icon: <Comment color="success" />,
                completed: userEngagement.reviewsSubmitted > 0,
                progress: userEngagement.reviewsSubmitted > 0 ? 1 : 0
            }
        ];
    };
    
    const generateCommunityActivity = (pastEvents) => {
        return [
            {
                type: 'popular_event',
                name: 'Tech Conference 2023',
                attendees: 120,
                rating: 4.8
            },
            {
                type: 'trending_category',
                name: 'Networking Events',
                growth: '+15%',
                events: 8
            },
            {
                type: 'active_user',
                username: 'JohnDoe',
                events_attended: 12,
                reviews: 8
            }
        ];
    };

    // Fetch event reviews when an event is selected
    const fetchEventReviews = useCallback(async (eventId) => {
        if (!eventId) return;
        
        setLoadingReviews(true);
        try {
            const reviews = await api.reviews.getEventReviews(eventId);
            // Ensure reviews is an array
            setEventReviews(Array.isArray(reviews) ? reviews : []);
        } catch (error) {
            console.error('Error fetching event reviews:', error);
            setEventReviews([]);
        } finally {
            setLoadingReviews(false);
        }
    }, []);

    // Initial data load
    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);
    
    // Load tab-specific data
    useEffect(() => {
        if (dashboardTab === 1) {
            // Load profile data if needed
        }
    }, [dashboardTab]);

    // Event handlers
    const handleOpenReviews = useCallback((event) => {
        setSelectedEvent(event);
        fetchEventReviews(event.event_id);
        setOpenReviewsDialog(true);
    }, [fetchEventReviews]);

    const handleCloseReviews = useCallback(() => {
        setOpenReviewsDialog(false);
        setSelectedEvent(null);
        setEventReviews([]);
    }, []);

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        fetchDashboardData();
    }, [fetchDashboardData]);

    const handleTabChange = useCallback((event, newValue) => {
        setEventTab(newValue);
    }, []);
    
    const handleDashboardTabChange = useCallback((event, newValue) => {
        setDashboardTab(newValue);
    }, []);

    // Formatter functions
    const formatDate = useCallback((dateString) => {
        const date = new Date(dateString);
        return format(date, 'EEE, MMM d, yyyy h:mm a');
    }, []);

    const getDaysRemaining = useCallback((dateString) => {
        const eventDate = new Date(dateString);
        const today = new Date();
        return differenceInDays(eventDate, today);
    }, []);

    const formatRating = useCallback((rating) => {
        return rating ? parseFloat(rating).toFixed(1) : 'No ratings';
    }, []);

    // Memoized rendering functions
    const renderAchievements = useMemo(() => (
        <Paper sx={{ p: 2, borderRadius: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
                Your Achievements
            </Typography>
            <Grid container spacing={2}>
                {userEngagement.achievements.map((achievement) => (
                    <Grid item xs={12} sm={4} key={achievement.id}>
                        <Card sx={{ height: '100%' }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <Avatar sx={{ bgcolor: achievement.completed ? 'success.light' : 'action.disabledBackground', mr: 1 }}>
                                        {achievement.icon}
                                    </Avatar>
                                    <Typography variant="subtitle1">
                                        {achievement.title}
                                    </Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    {achievement.description}
                                </Typography>
                                <LinearProgress 
                                    variant="determinate" 
                                    value={achievement.progress * 100} 
                                    sx={{ height: 8, borderRadius: 5, mt: 1 }}
                                    color={achievement.completed ? "success" : "primary"}
                                />
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Paper>
    ), [userEngagement.achievements]);
    
    const renderEngagementMetrics = useMemo(() => (
        <Paper sx={{ p: 2, borderRadius: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
                Your Engagement
            </Typography>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                        <Typography variant="h4" color="primary.main">
                            {userEngagement.eventsAttended}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Events Attended
                        </Typography>
                    </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                        <Typography variant="h4" color="secondary.main">
                            {userEngagement.reviewsSubmitted}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Reviews Submitted
                        </Typography>
                    </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                        <StarRating value={userEngagement.averageRating || 0} readOnly size="large" />
                        <Typography variant="body2" color="text.secondary">
                            Average Rating
                        </Typography>
                    </Box>
                </Grid>
            </Grid>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle1" gutterBottom>
                Category Preferences
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {Array.isArray(userEngagement.categoryPreferences) && userEngagement.categoryPreferences.map((category) => (
                    <Chip 
                        key={category.id}
                        label={`${category.name} (${category.count})`}
                        color="primary"
                        variant="outlined"
                    />
                ))}
            </Box>
        </Paper>
    ), [userEngagement]);

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                <Box>
                    <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                        Welcome back, {username || 'User'}!
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Here's an overview of your events and activities
                    </Typography>
                </Box>
                <Button 
                    variant="outlined" 
                    onClick={handleRefresh}
                    disabled={refreshing}
                    startIcon={refreshing ? <CircularProgress size={20} /> : <Refresh />}
                >
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
            </Box>

            {error && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            <Box sx={{ mb: 3 }}>
                <Tabs value={dashboardTab} onChange={handleDashboardTabChange} aria-label="dashboard tabs">
                    <Tab label="Overview" />
                    <Tab label="Your Profile" />
                    <Tab label="Community" />
                </Tabs>
            </Box>

            {dashboardTab === 0 && (
                <>
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
                                                {stats.totalEvents || (Array.isArray(upcomingEvents) && Array.isArray(pastEvents) ? 
                                                 upcomingEvents.length + pastEvents.length : 0)}
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
                                                {stats.upcomingEvents || (Array.isArray(upcomingEvents) ? upcomingEvents.length : 0)}
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
                                                {stats.completedEvents || (Array.isArray(pastEvents) ? pastEvents.length : 0)}
                                            </Typography>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

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

                    <Box sx={{ mb: 4 }}>
                        {eventTab === 0 ? (
                            <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
                                {loading ? (
                                    <Box sx={{ p: 3 }}>
                                        <CircularProgress size={30} sx={{ display: 'block', mx: 'auto' }} />
                                    </Box>
                                ) : Array.isArray(upcomingEvents) && upcomingEvents.length > 0 ? (
                                    <List disablePadding>
                                        {upcomingEvents.map((event, index) => {
                                            if (!event || !event.event_date) return null;
                                            
                                            const daysRemaining = getDaysRemaining(event.event_date);
                                            return (
                                                <React.Fragment key={event.event_id || index}>
                                                    <ListItem 
                                                        sx={{ 
                                                            px: 3, 
                                                            py: 2,
                                                            transition: 'background-color 0.2s',
                                                            '&:hover': {
                                                                bgcolor: 'action.hover'
                                                            },
                                                            cursor: 'pointer'
                                                        }}
                                                        onClick={() => handleOpenReviews(event)}
                                                    >
                                                        <ListItemIcon>
                                                            <Badge color="primary" badgeContent={daysRemaining <= 3 ? "!" : 0}>
                                                                <Event color="primary" />
                                                            </Badge>
                                                        </ListItemIcon>
                                                        <ListItemText
                                                            primary={
                                                                <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'medium' }}>
                                                                    {event.name}
                                                                </Typography>
                                                            }
                                                            secondary={
                                                                <Typography variant="body2" component="span" display="block">
                                                                    {formatDate(event.event_date)} • {event.location || 'No location'}
                                                                </Typography>
                                                            }
                                                        />
                                                        <ListItemSecondaryAction>
                                                            <Tooltip title={daysRemaining <= 0 ? "Today!" : `${daysRemaining} days left`}>
                                                                <Chip
                                                                    label={daysRemaining <= 0 ? "Today!" : `${daysRemaining} days left`}
                                                                    color={daysRemaining <= 1 ? "error" : daysRemaining <= 3 ? "warning" : "primary"}
                                                                    size="small"
                                                                />
                                                            </Tooltip>
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
                        ) : (
                            <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
                                {loading ? (
                                    <Box sx={{ p: 3 }}>
                                        <CircularProgress size={30} sx={{ display: 'block', mx: 'auto' }} />
                                    </Box>
                                ) : Array.isArray(pastEvents) && pastEvents.length > 0 ? (
                                    <List disablePadding>
                                        {pastEvents.map((event, index) => (
                                            <React.Fragment key={event.event_id || index}>
                                                <ListItem
                                                    sx={{ 
                                                        px: 3, 
                                                        py: 2,
                                                        transition: 'background-color 0.2s',
                                                        '&:hover': {
                                                            bgcolor: 'action.hover'
                                                        },
                                                        cursor: 'pointer'
                                                    }}
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
                                                            label={event.review_count > 0 ? `${event.review_count} Reviews` : "Add Review"}
                                                            color={event.review_count > 0 ? "primary" : "secondary"}
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
                </>
            )}

            {dashboardTab === 1 && (
                <>
                    {renderEngagementMetrics}
                    {renderAchievements}
                </>
            )}

            {dashboardTab === 2 && (
                <Paper sx={{ p: 2, borderRadius: 2, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Community Highlights
                    </Typography>
                    <List>
                        {Array.isArray(communityActivity) && communityActivity.map((item, index) => (
                            <React.Fragment key={`community-${index}`}>
                                <ListItem alignItems="flex-start">
                                    <ListItemIcon>
                                        {item.type === 'popular_event' ? (
                                            <Star sx={{ color: 'gold' }} />
                                        ) : item.type === 'trending_category' ? (
                                            <TrendingUp color="secondary" />
                                        ) : (
                                            <Person color="primary" />
                                        )}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={
                                            item.type === 'popular_event'
                                                ? `Popular Event: ${item.name}`
                                                : item.type === 'trending_category'
                                                    ? `Trending: ${item.name}`
                                                    : `Active User: ${item.username}`
                                        }
                                        secondary={
                                            item.type === 'popular_event'
                                                ? `${item.attendees} attendees, ${item.rating} ★`
                                                : item.type === 'trending_category'
                                                    ? `${item.growth} growth, ${item.events} events`
                                                    : `${item.events_attended} events, ${item.reviews} reviews`
                                        }
                                    />
                                </ListItem>
                                {index < communityActivity.length - 1 && (
                                    <Divider component="li" />
                                )}
                            </React.Fragment>
                        ))}
                    </List>
                </Paper>
            )}

            {selectedEvent && (
                <ReviewDialog
                    open={openReviewsDialog}
                    onClose={handleCloseReviews}
                    eventId={selectedEvent.event_id}
                    eventName={selectedEvent.name}
                    eventDate={selectedEvent.event_date}
                    eventLocation={selectedEvent.location}
                    initialRating={selectedEvent.avg_rating}
                    reviewCount={selectedEvent.review_count}
                />
            )}
        </Box>
    );
}

export default Dashboard;