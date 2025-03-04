import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Paper, Button, IconButton, Grid, 
    Card, CardContent, Chip, Divider, CircularProgress,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Alert, useTheme, useMediaQuery, TextField, MenuItem,
    FormControl, InputLabel, Select, Tooltip
} from '@mui/material';
import { 
    ChevronLeft, ChevronRight, CalendarMonth, 
    Event, FilterList, LocationOn, AccessTime, Share,
    Add, Today, Download
} from '@mui/icons-material';

// Function to get the days in a month
const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
};

// Function to get the first day of the month (0 = Sunday, 1 = Monday, etc.)
const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
};

function SimpleEventCalendar() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [eventDetailsOpen, setEventDetailsOpen] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [categories, setCategories] = useState([]);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [selectedDay, setSelectedDay] = useState(new Date().getDate());
    const [dayEvents, setDayEvents] = useState([]);
    
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // Get token from localStorage
    const getToken = () => {
        return localStorage.getItem('authToken');
    };

    // Format date (YYYY-MM-DD)
    const formatDateISO = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Format date for display
    const formatDateForDisplay = (dateString) => {
        const date = new Date(dateString);
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return date.toLocaleDateString('en-US', options);
    };

    // Format time for display
    const formatTimeForDisplay = (dateString) => {
        const date = new Date(dateString);
        const options = { hour: '2-digit', minute: '2-digit' };
        return date.toLocaleTimeString('en-US', options);
    };

    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            try {
                const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
                const response = await fetch(`${apiUrl}/api/events`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setEvents(data);
                setLoading(false);
            } catch (e) {
                setError(e.message);
                setLoading(false);
                console.error("Error fetching events:", e);
            }
        };
    
        const fetchCategories = async () => {
            try {
                const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
                const response = await fetch(`${apiUrl}/api/categories`);
                if (response.ok) {
                    const data = await response.json();
                    setCategories(data);
                }
            } catch (error) {
                console.error("Error fetching categories:", error);
            }
        };
    
        fetchEvents();
        fetchCategories();
    }, []);

    // Filter events for selected day
    useEffect(() => {
        if (events.length > 0) {
            const date = new Date(currentYear, currentMonth, selectedDay);
            const dateStr = formatDateISO(date);
            
            // Filter events for the selected day
            const filteredEvents = events.filter(event => {
                const eventDate = new Date(event.event_date);
                const eventDateStr = formatDateISO(eventDate);
                const categoryMatches = categoryFilter === 'all' || 
                                      event.category_id === parseInt(categoryFilter);
                
                return eventDateStr === dateStr && categoryMatches;
            });
            
            setDayEvents(filteredEvents);
        }
    }, [selectedDay, currentMonth, currentYear, events, categoryFilter]);

    // Go to previous month
    const goToPreviousMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
        setSelectedDay(1);
    };

    // Go to next month
    const goToNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
        setSelectedDay(1);
    };

    // Go to today
    const goToToday = () => {
        const today = new Date();
        setCurrentYear(today.getFullYear());
        setCurrentMonth(today.getMonth());
        setSelectedDay(today.getDate());
    };

    // Handle day selection
    const handleDayClick = (day) => {
        setSelectedDay(day);
    };

    // Handle event click
    const handleEventClick = (event) => {
        setSelectedEvent(event);
        setEventDetailsOpen(true);
    };

    // Add event to Google Calendar
    const addToCalendar = (event) => {
        const { name, description, location, event_date } = event;
        const eventStart = new Date(event_date);
        // Default duration 1 hour
        const eventEnd = new Date(eventStart.getTime() + 60 * 60 * 1000);
        
        // Format dates for Google Calendar
        const formatGoogleDate = (date) => {
            return date.toISOString().replace(/-|:|\.\d\d\d/g, '');
        };
        
        // Create Google Calendar URL
        const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(name)}&dates=${formatGoogleDate(eventStart)}/${formatGoogleDate(eventEnd)}&details=${encodeURIComponent(description || '')}&location=${encodeURIComponent(location || '')}&sf=true&output=xml`;
        
        // Open in new window
        window.open(googleCalendarUrl, '_blank');
    };

    // Get category color
    const getCategoryColor = (categoryId) => {
        // Define a set of colors for categories
        const colors = [
            '#4caf50', // Green
            '#2196f3', // Blue
            '#f44336', // Red
            '#ff9800', // Orange
            '#9c27b0', // Purple
            '#00bcd4', // Cyan
            '#795548', // Brown
            '#607d8b'  // Blue-grey
        ];
        
        // Use modulo to cycle through colors if we have more categories than colors
        return colors[categoryId % colors.length];
    };

    // Check if a date has events
    const dateHasEvents = (year, month, day) => {
        const date = new Date(year, month, day);
        const dateStr = formatDateISO(date);
        
        return events.some(event => {
            const eventDate = new Date(event.event_date);
            const eventDateStr = formatDateISO(eventDate);
            return eventDateStr === dateStr;
        });
    };

    // Render calendar
    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(currentYear, currentMonth);
        const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);
        
        // Generate days of the week
        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        // Generate calendar days
        const days = [];
        
        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(<Grid item key={`empty-${i}`} xs={12/7}><Box sx={{ height: 40 }}></Box></Grid>);
        }
        
        // Add cells for each day of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const isToday = 
                currentYear === new Date().getFullYear() && 
                currentMonth === new Date().getMonth() && 
                day === new Date().getDate();
                
            const isSelected = day === selectedDay;
            const hasEvents = dateHasEvents(currentYear, currentMonth, day);
            
            days.push(
                <Grid item key={day} xs={12/7}>
                    <Box 
                        onClick={() => handleDayClick(day)}
                        sx={{
                            height: 40,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            borderRadius: '50%',
                            position: 'relative',
                            bgcolor: isSelected ? 'primary.main' : isToday ? 'primary.light' : 'transparent',
                            color: isSelected ? 'white' : 'inherit',
                            '&:hover': {
                                bgcolor: isSelected ? 'primary.dark' : 'action.hover'
                            },
                            fontWeight: hasEvents ? 'bold' : 'normal'
                        }}
                    >
                        {day}
                        {hasEvents && (
                            <Box
                                sx={{
                                    position: 'absolute',
                                    bottom: 2,
                                    width: 4,
                                    height: 4,
                                    borderRadius: '50%',
                                    bgcolor: isSelected ? 'white' : 'primary.main'
                                }}
                            />
                        )}
                    </Box>
                </Grid>
            );
        }
        
        return (
            <Box>
                <Grid container spacing={1} sx={{ mb: 2 }}>
                    {daysOfWeek.map((day, index) => (
                        <Grid item key={day} xs={12/7}>
                            <Typography variant="caption" align="center" display="block">
                                {day}
                            </Typography>
                        </Grid>
                    ))}
                </Grid>
                <Grid container spacing={1}>
                    {days}
                </Grid>
            </Box>
        );
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography 
                    variant="h4" 
                    component="h1" 
                    sx={{ fontWeight: 'bold' }}
                >
                    Event Calendar
                </Typography>
                <Button 
                    variant="outlined" 
                    startIcon={<FilterList />}
                    onClick={() => setShowFilters(!showFilters)}
                >
                    Filters
                </Button>
            </Box>
            
            {/* Error alert */}
            {error && (
                <Alert 
                    severity="error" 
                    sx={{ mb: 4 }}
                >
                    Error loading events: {error}
                </Alert>
            )}
            
            {/* Filters section */}
            {showFilters && (
                <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={6} md={4}>
                            <FormControl fullWidth size="small">
                                <InputLabel id="category-filter-label">Category</InputLabel>
                                <Select
                                    labelId="category-filter-label"
                                    id="category-filter"
                                    value={categoryFilter}
                                    label="Category"
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                >
                                    <MenuItem value="all">All Categories</MenuItem>
                                    {categories.map((category) => (
                                        <MenuItem key={category.category_id} value={category.category_id}>
                                            {category.category_name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </Paper>
            )}
            
            {/* Main Calendar UI */}
            <Grid container spacing={3}>
                {/* Calendar widget */}
                <Grid item xs={12} md={7}>
                    <Paper sx={{ p: 2, borderRadius: 2 }}>
                        {/* Month navigation */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <IconButton onClick={goToPreviousMonth} aria-label="previous month">
                                <ChevronLeft />
                            </IconButton>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography variant="h6">
                                    {new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </Typography>
                                <Tooltip title="Go to today">
                                    <IconButton onClick={goToToday} sx={{ ml: 1 }}>
                                        <Today fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                            <IconButton onClick={goToNextMonth} aria-label="next month">
                                <ChevronRight />
                            </IconButton>
                        </Box>
                        
                        {/* Calendar grid */}
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            renderCalendar()
                        )}
                    </Paper>
                </Grid>
                
                {/* Events for selected day */}
                <Grid item xs={12} md={5}>
                    <Paper sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>
                            Events for {new Date(currentYear, currentMonth, selectedDay).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </Typography>
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                <CircularProgress />
                            </Box>
                        ) : dayEvents.length > 0 ? (
                            <Box sx={{ mt: 2 }}>
                                {dayEvents.map((event) => (
                                    <Card 
                                        key={event.event_id} 
                                        sx={{ 
                                            mb: 2, 
                                            cursor: 'pointer',
                                            transition: 'transform 0.2s, box-shadow 0.2s',
                                            '&:hover': {
                                                transform: 'translateY(-2px)',
                                                boxShadow: 3,
                                            },
                                            borderLeft: '4px solid',
                                            borderColor: getCategoryColor(event.category_id)
                                        }}
                                        onClick={() => handleEventClick(event)}
                                    >
                                        <CardContent sx={{ p: 2 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                                <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'bold' }}>
                                                    {event.name}
                                                </Typography>
                                                <Chip 
                                                    label={formatTimeForDisplay(event.event_date)} 
                                                    size="small" 
                                                    color="primary" 
                                                    icon={<AccessTime fontSize="small" />}
                                                />
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                                <LocationOn fontSize="small" color="action" sx={{ mr: 0.5 }} />
                                                <Typography variant="body2" color="text.secondary">
                                                    {event.location || 'No location specified'}
                                                </Typography>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Box>
                        ) : (
                            <Box sx={{ py: 4, textAlign: 'center' }}>
                                <CalendarMonth sx={{ fontSize: 40, color: 'text.disabled', mb: 2 }} />
                                <Typography variant="body1" color="text.secondary">
                                    No events scheduled for this day
                                </Typography>
                                <Button 
                                    variant="outlined" 
                                    sx={{ mt: 2 }}
                                    startIcon={<Add />}
                                >
                                    Add an Event
                                </Button>
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>
            
            {/* Event Details Modal */}
            <Dialog
                open={eventDetailsOpen}
                onClose={() => setEventDetailsOpen(false)}
                fullWidth
                maxWidth="sm"
            >
                {selectedEvent && (
                    <>
                        <DialogTitle sx={{ pb: 1 }}>
                            <Typography variant="h6">{selectedEvent.name}</Typography>
                        </DialogTitle>
                        <DialogContent dividers>
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle1" component="div" fontWeight="medium" gutterBottom>
                                    When
                                </Typography>
                                <Typography variant="body1">
                                    {formatDateForDisplay(selectedEvent.event_date)}
                                </Typography>
                            </Box>
                            
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle1" component="div" fontWeight="medium" gutterBottom>
                                    Where
                                </Typography>
                                <Typography variant="body1">
                                    {selectedEvent.location || 'No location specified'}
                                </Typography>
                            </Box>
                            
                            <Divider sx={{ my: 2 }} />
                            
                            <Box>
                                <Typography variant="subtitle1" component="div" fontWeight="medium" gutterBottom>
                                    Description
                                </Typography>
                                <Typography variant="body1">
                                    {selectedEvent.description || 'No description available'}
                                </Typography>
                            </Box>
                        </DialogContent>
                        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
                            <Button startIcon={<Share />} onClick={() => {
                                if (navigator.share) {
                                    navigator.share({
                                        title: selectedEvent.name,
                                        text: `Check out this event: ${selectedEvent.name}`,
                                        url: window.location.href
                                    });
                                }
                            }}>
                                Share
                            </Button>
                            <Box>
                                <Button onClick={() => setEventDetailsOpen(false)}>
                                    Close
                                </Button>
                                <Button 
                                    variant="contained" 
                                    color="primary"
                                    startIcon={<Event />}
                                    onClick={() => addToCalendar(selectedEvent)}
                                    sx={{ ml: 1 }}
                                >
                                    Add to Calendar
                                </Button>
                            </Box>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </Box>
    );
}

export default SimpleEventCalendar;