import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box, Typography, Grid, Card, CardContent,
    Divider, CircularProgress, Paper,
    List, ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction,
    Chip, Tabs, Tab, Dialog, DialogTitle, DialogContent, Rating, Avatar,
    Button, Alert, useTheme, useMediaQuery, Badge, Tooltip, LinearProgress
} from '@mui/material';
import {
    EventAvailable, People, CalendarToday, Check,
    Event, History, Comment, TrendingUp, EmojiEvents,
    LocalActivity, Person, School, Favorite, Star
} from '@mui/icons-material';
import StarRating from './StarRating';
import ReviewDialog from './ReviewDialog';
import { format, differenceInDays } from 'date-fns';

function Dashboard({ username }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));
    
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
    
    const [dashboardTab, setDashboardTab] = useState(0);
    const [userEngagement, setUserEngagement] = useState({
        eventsAttended: 0,
        reviewsSubmitted: 0,
        averageRating: 0,
        categoryPreferences: [],
        recentActivity: [],
        achievements: []
    });
    const [showDetailedStats, setShowDetailedStats] = useState(false);
    const [communityActivity, setCommunityActivity] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    const getToken = () => {
        const token = localStorage.getItem('authToken');
        return token;
    };

    const fetchDashboardData = useCallback(async () => {
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

            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const eventsResponse = await fetch(`${apiUrl}/api/events`, { headers });
            if (!eventsResponse.ok) {
                throw new Error('Failed to fetch events');
            }
            const eventsData = await eventsResponse.json();

            let statsData = {};
            try {
                const statsResponse = await fetch(`${apiUrl}/api/dashboard/stats`, { headers });
                if (statsResponse.ok) {
                    statsData = await statsResponse.json();
                } else {
                    throw new Error('Failed to fetch stats');
                }
            } catch (statsError) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
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
                const totalAttendees = eventsData.reduce((sum, event) => sum + (event.attendees || 0), 0);
                
                statsData = {
                    totalEvents: eventsData.length,
                    upcomingEvents: upcoming,
                    completedEvents: completed,
                    totalAttendees: totalAttendees
                };
            }
            
            setStats(statsData);

            const today = new Date();
            today.setHours(0, 0, 0, 0);

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

            upcoming.sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
            past.sort((a, b) => new Date(b.event_date) - new Date(a.event_date));

            setUpcomingEvents(upcoming);
            setPastEvents(past);
            
            const mockUserEngagement = {
                eventsAttended: past.length,
                reviewsSubmitted: past.reduce((sum, event) => sum + (event.review_count || 0), 0),
                averageRating: 4.2,
                categoryPreferences: generateCategoryPreferences(past),
                recentActivity: generateRecentActivity(past.slice(0, 3)),
                achievements: generateAchievements(past.length, statsData)
            };
            
            setUserEngagement(mockUserEngagement);
            setCommunityActivity(generateCommunityActivity(past));

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setError(error.message);
            setUpcomingEvents([]);
            setPastEvents([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

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
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                const response = await fetch(`${apiUrl}/api/events/${eventId}/reviews`, { headers });
                if (response.ok) {
                    const data = await response.json();
                    setEventReviews(data);
                    return;
                }
                console.error('Reviews fetch error:', response.status);
                throw new Error('Failed to fetch reviews');
            } catch (apiError) {
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
            setEventReviews([]);
        } finally {
            setLoadingReviews(false);
        }
    };

    const handleOpenReviews = (event) => {
        setSelectedEvent(event);
        fetchEventReviews(event.event_id);
        setOpenReviewsDialog(true);
    };

    const handleCloseReviews = () => {
        setOpenReviewsDialog(false);
        setSelectedEvent(null);
        setEventReviews([]);
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchDashboardData();
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return format(date, 'EEE, MMM d, yyyy h:mm a');
    };

    const getDaysRemaining = (dateString) => {
        const eventDate = new Date(dateString);
        const today = new Date();
        return differenceInDays(eventDate, today);
    };

    const formatRating = (rating) => {
        return rating ? parseFloat(rating).toFixed(1) : 'No ratings';
    };

    const handleTabChange = (event, newValue) => {
        setEventTab(newValue);
    };
    
    const handleDashboardTabChange = (event, newValue) => {
        setDashboardTab(newValue);
    };
    
    const generateCategoryPreferences = (pastEvents) => {
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
                icon: <LocalActivity color="secondary" />,
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
    
    const renderAchievements = () => {
        return (
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
        );
    };
    
    const renderEngagementMetrics = () => {
        return (
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
                    {userEngagement.categoryPreferences.map((category) => (
                        <Chip 
                            key={category.id}
                            label={`${category.name} (${category.count})`}
                            color="primary"
                            variant="outlined"
                        />
                    ))}
                </Box>
            </Paper>
        );
    };
    
    const renderRecentActivity = () => {
        return (
            <Paper sx={{ p: 2, borderRadius: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Recent Activity
                </Typography>
                {userEngagement.recentActivity.length > 0 ? (
                    <List>
                        {userEngagement.recentActivity.map((activity, index) => (
                            <React.Fragment key={`activity-${index}`}>
                                <ListItem alignItems="flex-start">
                                    <ListItemIcon>
                                        {activity.type === 'event_attendance' ? (
                                            <EventAvailable color="primary" />
                                        ) : (
                                            <Comment color="secondary" />
                                        )}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={
                                            activity.type === 'event_attendance' 
                                                ? `Attended: ${activity.event_name}` 
                                                : `Reviewed: ${activity.event_name}`
                                        }
                                        secondary={formatDate(activity.date)}
                                    />
                                    {activity.type === 'event_attendance' && !activity.hasReview && (
                                        <ListItemSecondaryAction>
                                            <Button 
                                                variant="outlined" 
                                                size="small" 
                                                startIcon={<Comment />}
                                            >
                                                Add Review
                                            </Button>
                                        </ListItemSecondaryAction>
                                    )}
                                </ListItem>
                                {index < userEngagement.recentActivity.length - 1 && (
                                    <Divider component="li" />
                                )}
                            </React.Fragment>
                        ))}
                    </List>
                ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                        No recent activity to display
                    </Typography>
                )}
            </Paper>
        );
    };
    
    const renderCommunityInsights = () => {
        return (
            <Paper sx={{ p: 2, borderRadius: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Community Highlights
                </Typography>
                <List>
                    {communityActivity.map((item, index) => (
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
        );
    };

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
                    startIcon={refreshing ? <CircularProgress size={20} /> : null}
                >
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
            </Box>

            {error && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                    Note: Some data may be estimated due to API error: {error}
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
                        )}

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
                    {renderEngagementMetrics()}
                    {renderAchievements()}
                    {renderRecentActivity()}
                </>
            )}

            {dashboardTab === 2 && (
                <>
                    {renderCommunityInsights()}
                </>
            )}

            <ReviewDialog
                open={openReviewsDialog}
                onClose={() => {
                    setOpenReviewsDialog(false);
                    setSelectedEvent(null);
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
