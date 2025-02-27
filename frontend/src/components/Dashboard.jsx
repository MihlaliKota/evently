import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Grid, Card, CardContent, 
    Divider, CircularProgress, Paper, IconButton,
    List, ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction,
    Chip, LinearProgress
} from '@mui/material';
import { 
    EventAvailable, People, CalendarToday, Check,
    TrendingUp, AccessTime, Event, CheckCircle,
    DonutSmall
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

    // Simulated data fetch 
    useEffect(() => {
        // In a real app, this would be an API call
        const fetchDashboardData = () => {
            setLoading(true);
            
            // Simulate API delay
            setTimeout(() => {
                // Mock data
                setStats({
                    totalEvents: 12,
                    upcomingEvents: 5,
                    totalAttendees: 248,
                    completedEvents: 7
                });
                
                setUpcomingEvents([
                    { id: 1, name: 'Team Meeting', date: '2024-02-28T10:00:00', location: 'Conference Room A', attendees: 8 },
                    { id: 2, name: 'Product Launch', date: '2024-03-15T09:00:00', location: 'Main Hall', attendees: 120 },
                    { id: 3, name: 'Client Workshop', date: '2024-03-02T14:00:00', location: 'Training Center', attendees: 25 }
                ]);
                
                setLoading(false);
            }, 1000);
        };
        
        fetchDashboardData();
    }, []);

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

    return (
        <Box sx={{ width: '100%', maxWidth: 'lg', mx: 'auto' }}>
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
                    <Card 
                        sx={{ 
                            height: '100%',
                            borderRadius: 2,
                            transition: 'transform 0.2s',
                            '&:hover': {
                                transform: 'translateY(-4px)',
                            }
                        }}
                    >
                        <CardContent>
                            {loading ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
                                    <CircularProgress size={30} />
                                </Box>
                            ) : (
                                <>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <Box 
                                            sx={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center',
                                                p: 1,
                                                borderRadius: '50%',
                                                bgcolor: 'primary.light',
                                                color: 'primary.main',
                                                mr: 2
                                            }}
                                        >
                                            <EventAvailable />
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
                    <Card 
                        sx={{ 
                            height: '100%',
                            borderRadius: 2,
                            transition: 'transform 0.2s',
                            '&:hover': {
                                transform: 'translateY(-4px)',
                            }
                        }}
                    >
                        <CardContent>
                            {loading ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
                                    <CircularProgress size={30} />
                                </Box>
                            ) : (
                                <>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <Box 
                                            sx={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center',
                                                p: 1,
                                                borderRadius: '50%',
                                                bgcolor: 'secondary.light',
                                                color: 'secondary.main',
                                                mr: 2
                                            }}
                                        >
                                            <CalendarToday />
                                        </Box>
                                        <Typography color="text.secondary" variant="body2">
                                            Upcoming Events
                                        </Typography>
                                    </Box>
                                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                                        {stats.upcomingEvents}
                                    </Typography>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} lg={3}>
                    <Card 
                        sx={{ 
                            height: '100%',
                            borderRadius: 2,
                            transition: 'transform 0.2s',
                            '&:hover': {
                                transform: 'translateY(-4px)',
                            }
                        }}
                    >
                        <CardContent>
                            {loading ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
                                    <CircularProgress size={30} />
                                </Box>
                            ) : (
                                <>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <Box 
                                            sx={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center',
                                                p: 1,
                                                borderRadius: '50%',
                                                bgcolor: 'info.light',
                                                color: 'info.main',
                                                mr: 2
                                            }}
                                        >
                                            <People />
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
                    <Card 
                        sx={{ 
                            height: '100%',
                            borderRadius: 2,
                            transition: 'transform 0.2s',
                            '&:hover': {
                                transform: 'translateY(-4px)',
                            }
                        }}
                    >
                        <CardContent>
                            {loading ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
                                    <CircularProgress size={30} />
                                </Box>
                            ) : (
                                <>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <Box 
                                            sx={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center',
                                                p: 1,
                                                borderRadius: '50%',
                                                bgcolor: 'success.light',
                                                color: 'success.main',
                                                mr: 2
                                            }}
                                        >
                                            <Check />
                                        </Box>
                                        <Typography color="text.secondary" variant="body2">
                                            Completed Events
                                        </Typography>
                                    </Box>
                                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                                        {stats.completedEvents}
                                    </Typography>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Upcoming Events Section */}
            <Box>
                <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                    Next Up
                </Typography>
                
                <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
                    {loading ? (
                        <Box sx={{ p: 3 }}>
                            <CircularProgress size={30} sx={{ display: 'block', mx: 'auto' }} />
                        </Box>
                    ) : upcomingEvents.length > 0 ? (
                        <List disablePadding>
                            {upcomingEvents.map((event, index) => {
                                const daysRemaining = getDaysRemaining(event.date);
                                return (
                                    <React.Fragment key={event.id}>
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
                                                            {formatDate(event.date)} • {event.location}
                                                        </Typography>
                                                        <Typography variant="body2" component="span" display="block">
                                                            {event.attendees} attendees
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
            </Box>
        </Box>
    );
}

export default Dashboard;