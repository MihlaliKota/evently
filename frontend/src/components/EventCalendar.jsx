import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Paper, Button, IconButton, Grid, 
    Card, CardContent, Chip, Divider, CircularProgress,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Alert, useTheme, useMediaQuery, Tooltip, Badge,
    ToggleButtonGroup, ToggleButton, TextField, MenuItem,
    FormControl, InputLabel, Select, Stack, Fab
} from '@mui/material';
import { 
    ChevronLeft, ChevronRight, CalendarMonth, 
    Event, FilterList, LocationOn, AccessTime, Share,
    ViewDay, ViewWeek, ViewModule, Add, Today, Download,
    CalendarViewMonth, CalendarViewWeek, CalendarViewDay
} from '@mui/icons-material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { 
    format, 
    isEqual, 
    isSameMonth, 
    isSameDay, 
    parseISO, 
    startOfMonth, 
    endOfMonth, 
    startOfWeek, 
    endOfWeek,
    startOfDay,
    endOfDay,
    addDays,
    eachDayOfInterval,
    getDay,
    isWithinInterval,
    isSameWeek,
    addMonths,
    subMonths
} from 'date-fns';

function EventCalendar() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [eventDetailsOpen, setEventDetailsOpen] = useState(false);
    const [newEventOpen, setNewEventOpen] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [categories, setCategories] = useState([]);
    const [view, setView] = useState('month'); // 'month', 'week', or 'day'
    const [monthEvents, setMonthEvents] = useState([]);
    const [weekEvents, setWeekEvents] = useState([]);
    const [dayEvents, setDayEvents] = useState([]);
    const [newEvent, setNewEvent] = useState({
        name: '',
        location: '',
        description: '',
        event_date: new Date(),
        category_id: ''
    });
    
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));

    // Get JWT token from localStorage
    const getToken = () => {
        const token = localStorage.getItem('authToken');
        return token;
    };

    // Fetch all events
    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            try {
                const response = await fetch('http://localhost:5000/api/events');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                
                // Transform dates into Date objects
                const eventsWithDates = data.map(event => ({
                    ...event,
                    eventDate: parseISO(event.event_date)
                }));
                
                setEvents(eventsWithDates);
                filterEventsByCurrentView(eventsWithDates, selectedDate, view);
                setLoading(false);
            } catch (e) {
                setError(e.message);
                setLoading(false);
                console.error("Error fetching events:", e);
            }
        };

        const fetchCategories = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/categories');
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

    // Refetch events after creating a new event
    const refetchEvents = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:5000/api/events');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            // Transform dates into Date objects
            const eventsWithDates = data.map(event => ({
                ...event,
                eventDate: parseISO(event.event_date)
            }));
            
            setEvents(eventsWithDates);
            filterEventsByCurrentView(eventsWithDates, selectedDate, view);
        } catch (e) {
            setError(e.message);
            console.error("Error fetching events:", e);
        } finally {
            setLoading(false);
        }
    };

    // Filter events for the current view whenever selected date or view changes
    useEffect(() => {
        if (events.length > 0) {
            filterEventsByCurrentView(events, selectedDate, view);
        }
    }, [selectedDate, events, categoryFilter, view]);

    // Filter events based on current view (month, week, day)
    const filterEventsByCurrentView = (allEvents, date, currentView) => {
        if (currentView === 'month') {
            filterEventsByMonth(allEvents, date);
        } else if (currentView === 'week') {
            filterEventsByWeek(allEvents, date);
        } else if (currentView === 'day') {
            filterEventsByDay(allEvents, date);
        }
    };

    // Filter events for the month containing the selected date
    const filterEventsByMonth = (allEvents, date) => {
        const start = startOfMonth(date);
        const end = endOfMonth(date);
        
        const filtered = allEvents.filter(event => {
            const eventDate = new Date(event.event_date);
            const categoryMatches = categoryFilter === 'all' || event.category_id === parseInt(categoryFilter);
            return isWithinInterval(eventDate, { start, end }) && categoryMatches;
        });
        
        setMonthEvents(filtered);
    };

    // Filter events for the week containing the selected date
    const filterEventsByWeek = (allEvents, date) => {
        const start = startOfWeek(date, { weekStartsOn: 0 }); // 0 = Sunday
        const end = endOfWeek(date, { weekStartsOn: 0 });
        
        const filtered = allEvents.filter(event => {
            const eventDate = new Date(event.event_date);
            const categoryMatches = categoryFilter === 'all' || event.category_id === parseInt(categoryFilter);
            return isWithinInterval(eventDate, { start, end }) && categoryMatches;
        });
        
        setWeekEvents(filtered);
    };

    // Filter events for the selected day
    const filterEventsByDay = (allEvents, date) => {
        const start = startOfDay(date);
        const end = endOfDay(date);
        
        const filtered = allEvents.filter(event => {
            const eventDate = new Date(event.event_date);
            const categoryMatches = categoryFilter === 'all' || event.category_id === parseInt(categoryFilter);
            return isWithinInterval(eventDate, { start, end }) && categoryMatches;
        });
        
        setDayEvents(filtered);
    };

    // Create a new event
    const handleCreateEvent = async () => {
        try {
            const token = getToken();
            if (!token) {
                setError('Authentication required');
                return;
            }
            
            // Get user ID from the token payload
            const tokenPayload = JSON.parse(atob(token.split('.')[1]));
            const userId = tokenPayload.userId;
            
            // Prepare event data
            const eventData = {
                ...newEvent,
                user_id: userId,
                // Ensure event_date is in the correct ISO string format
                event_date: newEvent.event_date.toISOString()
            };
            
            const response = await fetch('http://localhost:5000/api/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(eventData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create event');
            }
            
            // Reset form and close dialog
            setNewEvent({
                name: '',
                location: '',
                description: '',
                event_date: new Date(),
                category_id: ''
            });
            setNewEventOpen(false);
            
            // Refetch events to update the calendar
            await refetchEvents();
            
        } catch (err) {
            setError(err.message);
            console.error('Error creating event:', err);
        }
    };

    // Handle date change from the calendar
    const handleDateChange = (date) => {
        setSelectedDate(date);
    };

    // Handle view change
    const handleViewChange = (event, newView) => {
        if (newView !== null) {
            setView(newView);
        }
    };

    // Handle month navigation
    const goToPreviousMonth = () => {
        if (view === 'month') {
            setSelectedDate(subMonths(selectedDate, 1));
        } else if (view === 'week') {
            setSelectedDate(addDays(selectedDate, -7));
        } else if (view === 'day') {
            setSelectedDate(addDays(selectedDate, -1));
        }
    };

    const goToNextMonth = () => {
        if (view === 'month') {
            setSelectedDate(addMonths(selectedDate, 1));
        } else if (view === 'week') {
            setSelectedDate(addDays(selectedDate, 7));
        } else if (view === 'day') {
            setSelectedDate(addDays(selectedDate, 1));
        }
    };

    const goToToday = () => {
        setSelectedDate(new Date());
    };

    // Handle event selection and details
    const handleEventClick = (event) => {
        setSelectedEvent(event);
        setEventDetailsOpen(true);
    };

    const handleCloseEventDetails = () => {
        setEventDetailsOpen(false);
    };

    // Handle new event form inputs
    const handleNewEventInputChange = (e) => {
        const { name, value } = e.target;
        setNewEvent({
            ...newEvent,
            [name]: value
        });
    };

    const handleNewEventDateChange = (date) => {
        setNewEvent({
            ...newEvent,
            event_date: date
        });
    };

    // Format date for display
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return format(date, 'EEEE, MMMM d, yyyy h:mm a');
    };

    // Format time for display
    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return format(date, 'h:mm a');
    };

    // Get category color based on category_id
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

    // Add event to external calendar
    const addToCalendar = (event) => {
        const { name, description, location, event_date } = event;
        const eventStart = new Date(event_date);
        // Default duration 1 hour
        const eventEnd = new Date(eventStart.getTime() + 60 * 60 * 1000);
        
        // Format dates for Google Calendar
        const from = format(eventStart, "yyyyMMdd'T'HHmmss");
        const to = format(eventEnd, "yyyyMMdd'T'HHmmss");
        
        // Create Google Calendar URL
        const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(name)}&dates=${from}/${to}&details=${encodeURIComponent(description || '')}&location=${encodeURIComponent(location || '')}&sf=true&output=xml`;
        
        // Open in new window
        window.open(googleCalendarUrl, '_blank');
    };

    // Download event as ICS file
    const downloadEventICS = (event) => {
        const { name, description, location, event_date } = event;
        const eventStart = new Date(event_date);
        // Default duration 1 hour
        const eventEnd = new Date(eventStart.getTime() + 60 * 60 * 1000);
        
        // Format dates for iCalendar (YYYYMMDDTHHMMSSZ)
        const formatICalDate = (date) => {
            return format(date, "yyyyMMdd'T'HHmmss'Z'");
        };
        
        // Create iCalendar content
        const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Evently//NONSGML Event Calendar//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'BEGIN:VEVENT',
            `UID:${Date.now()}@evently.app`,
            `DTSTAMP:${formatICalDate(new Date())}`,
            `DTSTART:${formatICalDate(eventStart)}`,
            `DTEND:${formatICalDate(eventEnd)}`,
            `SUMMARY:${name}`,
            description ? `DESCRIPTION:${description.replace(/\\n/g, '\\n')}` : '',
            location ? `LOCATION:${location}` : '',
            'END:VEVENT',
            'END:VCALENDAR'
        ].filter(Boolean).join('\r\n');
        
        // Create a Blob and download link
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${name.replace(/[^a-z0-9]/gi, '_')}.ics`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Render different calendar views
    const renderCalendarView = () => {
        switch(view) {
            case 'month':
                return renderMonthView();
            case 'week':
                return renderWeekView();
            case 'day':
                return renderDayView();
            default:
                return renderMonthView();
        }
    };

    // Render month view
    const renderMonthView = () => {
        return (
            <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateCalendar 
                    value={selectedDate}
                    onChange={handleDateChange}
                    loading={loading}
                    renderLoading={() => <CircularProgress />}
                    showDaysOutsideCurrentMonth
                    dayOfWeekFormatter={(day) => format(new Date(2023, 0, parseInt(day) + 1), 'EEEEEE')}
                    slots={{
                        day: (props) => {
                            const dayEvents = monthEvents.filter(event => 
                                isSameDay(new Date(event.event_date), props.day)
                            );
                            
                            return (
                                <Box 
                                    onClick={() => props.onClick()}
                                    sx={{
                                        ...props.sx,
                                        position: 'relative',
                                        cursor: 'pointer',
                                        borderRadius: '4px',
                                        height: '40px',
                                        width: '40px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        '&:hover': {
                                            backgroundColor: 'action.hover',
                                        },
                                        ...(dayEvents.length > 0 && {
                                            '&::after': {
                                                content: '""',
                                                position: 'absolute',
                                                bottom: '4px',
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                                width: dayEvents.length > 2 ? '10px' : `${dayEvents.length * 4}px`,
                                                height: '4px',
                                                borderRadius: '4px',
                                                backgroundColor: 'primary.main',
                                            }
                                        })
                                    }}
                                >
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontWeight: dayEvents.length > 0 ? 'bold' : 'regular',
                                        }}
                                    >
                                        {props.day.getDate()}
                                    </Typography>
                                </Box>
                            );
                        }
                    }}
                />
            </LocalizationProvider>
        );
    };

    // Render week view
    const renderWeekView = () => {
        const startDate = startOfWeek(selectedDate, { weekStartsOn: 0 });
        const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
        
        return (
            <Grid container spacing={1}>
                {/* Day headers */}
                {weekDays.map((day, index) => (
                    <Grid item xs={12 / 7} key={`header-${index}`}>
                        <Paper 
                            sx={{ 
                                p: 1, 
                                textAlign: 'center', 
                                bgcolor: isSameDay(day, new Date()) ? 'primary.light' : 'background.paper',
                                borderRadius: '4px 4px 0 0',
                            }}
                        >
                            <Typography variant="caption" display="block">
                                {format(day, 'EEE')}
                            </Typography>
                            <Typography 
                                variant="h6" 
                                sx={{ 
                                    fontWeight: isSameDay(day, selectedDate) ? 'bold' : 'regular',
                                    cursor: 'pointer',
                                    '&:hover': { color: 'primary.main' }
                                }}
                                onClick={() => setSelectedDate(day)}
                            >
                                {format(day, 'd')}
                            </Typography>
                        </Paper>
                    </Grid>
                ))}
                
                {/* Event cells */}
                {weekDays.map((day, index) => {
                    const dayEvents = weekEvents.filter(event => 
                        isSameDay(new Date(event.event_date), day)
                    );
                    
                    return (
                        <Grid item xs={12 / 7} key={`events-${index}`}>
                            <Paper 
                                sx={{ 
                                    p: 1, 
                                    height: '300px',
                                    overflow: 'auto',
                                    bgcolor: isSameDay(day, selectedDate) ? 'rgba(0, 0, 0, 0.04)' : 'background.paper',
                                    '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' },
                                    cursor: 'pointer'
                                }}
                                onClick={() => {
                                    setSelectedDate(day);
                                    setView('day');
                                }}
                            >
                                {dayEvents.length > 0 ? (
                                    dayEvents.map(event => (
                                        <Box 
                                            key={event.event_id}
                                            sx={{ 
                                                p: 1, 
                                                mb: 1, 
                                                borderRadius: 1,
                                                bgcolor: getCategoryColor(event.category_id),
                                                color: 'white',
                                                cursor: 'pointer',
                                                fontSize: '0.8rem',
                                                '&:hover': {
                                                    boxShadow: 1,
                                                    transform: 'translateY(-2px)',
                                                    transition: 'transform 0.2s, box-shadow 0.2s'
                                                }
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEventClick(event);
                                            }}
                                        >
                                            <Typography variant="caption" fontWeight="bold">
                                                {format(new Date(event.event_date), 'h:mm a')}
                                            </Typography>
                                            <Typography variant="body2" noWrap>
                                                {event.name}
                                            </Typography>
                                        </Box>
                                    ))
                                ) : (
                                    <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Typography variant="caption" color="text.secondary">
                                            No events
                                        </Typography>
                                    </Box>
                                )}
                            </Paper>
                        </Grid>
                    );
                })}
            </Grid>
        );
    };

    // Render day view
    const renderDayView = () => {
        const hours = Array.from({ length: 24 }, (_, i) => i);
        
        return (
            <Box>
                <Paper 
                    sx={{ 
                        p: 2, 
                        mb: 2, 
                        borderRadius: 2,
                        bgcolor: isSameDay(selectedDate, new Date()) ? 'primary.light' : 'background.paper',
                        textAlign: 'center'
                    }}
                >
                    <Typography variant="h5" gutterBottom>
                        {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    </Typography>
                </Paper>
                
                <Paper sx={{ p: 0, borderRadius: 2, overflow: 'hidden' }}>
                    {hours.map(hour => {
                        const hourStart = new Date(
                            selectedDate.getFullYear(),
                            selectedDate.getMonth(),
                            selectedDate.getDate(),
                            hour
                        );
                        
                        const hourEnd = new Date(
                            selectedDate.getFullYear(),
                            selectedDate.getMonth(),
                            selectedDate.getDate(),
                            hour + 1
                        );
                        
                        const hourEvents = dayEvents.filter(event => {
                            const eventDate = new Date(event.event_date);
                            return eventDate.getHours() === hour;
                        });
                        
                        return (
                            <Box 
                                key={hour} 
                                sx={{ 
                                    display: 'flex', 
                                    borderBottom: '1px solid',
                                    borderColor: 'divider',
                                    ...(hour >= 8 && hour < 18 ? { 
                                        bgcolor: 'rgba(0, 0, 0, 0.02)'
                                    } : {}),
                                    minHeight: '60px'
                                }}
                            >
                                <Box 
                                    sx={{ 
                                        width: '60px', 
                                        borderRight: '1px solid', 
                                        borderColor: 'divider',
                                        p: 1,
                                        textAlign: 'right'
                                    }}
                                >
                                    <Typography variant="caption">
                                        {format(hourStart, 'h a')}
                                    </Typography>
                                </Box>
                                <Box sx={{ flex: 1, p: 1, position: 'relative' }}>
                                    {hourEvents.length > 0 ? (
                                        hourEvents.map(event => (
                                            <Box 
                                                key={event.event_id}
                                                sx={{ 
                                                    p: 1, 
                                                    mb: 1, 
                                                    borderRadius: 1,
                                                    bgcolor: getCategoryColor(event.category_id),
                                                    color: 'white',
                                                    cursor: 'pointer',
                                                    '&:hover': {
                                                        boxShadow: 1,
                                                        transform: 'translateY(-2px)',
                                                        transition: 'transform 0.2s, box-shadow 0.2s'
                                                    }
                                                }}
                                                onClick={() => handleEventClick(event)}
                                            >
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Typography variant="subtitle2">
                                                        {event.name}
                                                    </Typography>
                                                    <Typography variant="caption">
                                                        {format(new Date(event.event_date), 'h:mm a')}
                                                    </Typography>
                                                </Box>
                                                {event.location && (
                                                    <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <LocationOn fontSize="inherit" sx={{ mr: 0.5 }} />
                                                        {event.location}
                                                    </Typography>
                                                )}
                                            </Box>
                                        ))
                                    ) : (
                                        <Box 
                                            sx={{ 
                                                height: '100%', 
                                                width: '100%', 
                                                position: 'absolute', 
                                                top: 0, 
                                                left: 0, 
                                                opacity: 0.6,
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => {
                                                // Pre-set the time when adding a new event from the day view
                                                setNewEvent({
                                                    ...newEvent,
                                                    event_date: new Date(
                                                        selectedDate.getFullYear(),
                                                        selectedDate.getMonth(),
                                                        selectedDate.getDate(),
                                                        hour,
                                                        0
                                                    )
                                                });
                                                setNewEventOpen(true);
                                            }}
                                        />
                                    )}
                                </Box>
                            </Box>
                        );
                    })}
                </Paper>
            </Box>
        );
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
                <Typography 
                    variant="h4" 
                    component="h1" 
                    sx={{ fontWeight: 'bold' }}
                >
                    Event Calendar
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button 
                        variant="outlined" 
                        startIcon={<FilterList />}
                        onClick={() => setShowFilters(!showFilters)}
                        size={isMobile ? "small" : "medium"}
                    >
                        Filters
                    </Button>
                    <Button 
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => setNewEventOpen(true)}
                        size={isMobile ? "small" : "medium"}
                    >
                        Add Event
                    </Button>
                </Box>
            </Box>
            
            {/* Error alert */}
            {error && (
                <Alert 
                    severity="error" 
                    sx={{ mb: 4 }}
                >
                    Error: {error}
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
                {/* Calendar widget and navigation */}
                <Grid item xs={12} md={7}>
                    <Paper sx={{ p: 2, borderRadius: 2 }}>
                        {/* Calendar controls */}
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 2 }}>
                            {/* View toggle */}
                            <ToggleButtonGroup
                                value={view}
                                exclusive
                                onChange={handleViewChange}
                                aria-label="calendar view"
                                size={isMobile ? "small" : "medium"}
                            >
                                <ToggleButton value="month" aria-label="month view">
                                    <Tooltip title="Month View">
                                        <CalendarViewMonth />
                                    </Tooltip>
                                </ToggleButton>
                                <ToggleButton value="week" aria-label="week view">
                                    <Tooltip title="Week View">
                                        <CalendarViewWeek />
                                    </Tooltip>
                                </ToggleButton>
                                <ToggleButton value="day" aria-label="day view">
                                    <Tooltip title="Day View">
                                        <CalendarViewDay />
                                    </Tooltip>
                                </ToggleButton>
                            </ToggleButtonGroup>
                            
                            {/* Month/Date navigation */}
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <IconButton onClick={goToPreviousMonth} aria-label="previous">
                                    <ChevronLeft />
                                </IconButton>
                                <Button 
                                    onClick={goToToday}
                                    variant="outlined"
                                    size="small"
                                    startIcon={<Today />}
                                    sx={{ mx: 1 }}
                                >
                                    Today
                                </Button>
                                <IconButton onClick={goToNextMonth} aria-label="next">
                                    <ChevronRight />
                                </IconButton>
                            </Box>
                        </Box>
                        
                        {/* Date heading */}
                        <Typography 
                            variant="h6" 
                            sx={{ 
                                mb: 2, 
                                textAlign: 'center',
                                fontWeight: 'medium'
                            }}
                        >
                            {view === 'month' && format(selectedDate, 'MMMM yyyy')}
                            {view === 'week' && `Week of ${format(startOfWeek(selectedDate), 'MMM d')} - ${format(endOfWeek(selectedDate), 'MMM d, yyyy')}`}
                            {view === 'day' && format(selectedDate, 'MMMM d, yyyy')}
                        </Typography>
                        
                        {/* Calendar view */}
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            renderCalendarView()
                        )}
                    </Paper>
                </Grid>
                
                {/* Events for selected day/period */}
                <Grid item xs={12} md={5}>
                    <Paper sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>
                            {view === 'day' 
                                ? `Events on ${format(selectedDate, 'MMMM d, yyyy')}` 
                                : view === 'week'
                                    ? `Events this week`
                                    : `Events in ${format(selectedDate, 'MMMM yyyy')}`}
                        </Typography>
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <Box sx={{ mt: 2, maxHeight: '500px', overflow: 'auto' }}>
                                {view === 'day' && dayEvents.length > 0 && dayEvents.map((event) => (
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
                                                    label={formatTime(event.event_date)} 
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
                                
                                {view === 'week' && weekEvents.length > 0 && (
                                    <Box>
                                        {/* Group events by day */}
                                        {Array.from({ length: 7 }, (_, i) => {
                                            const day = addDays(startOfWeek(selectedDate), i);
                                            const eventsOnDay = weekEvents.filter(event => 
                                                isSameDay(new Date(event.event_date), day)
                                            );
                                            
                                            return eventsOnDay.length > 0 ? (
                                                <Box key={i} sx={{ mb: 3 }}>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                                                        {format(day, 'EEEE, MMMM d')}
                                                    </Typography>
                                                    {eventsOnDay.map(event => (
                                                        <Card 
                                                            key={event.event_id} 
                                                            sx={{ 
                                                                mb: 1, 
                                                                cursor: 'pointer',
                                                                transition: 'transform 0.2s, box-shadow 0.2s',
                                                                '&:hover': {
                                                                    transform: 'translateY(-2px)',
                                                                    boxShadow: 2,
                                                                },
                                                                borderLeft: '4px solid',
                                                                borderColor: getCategoryColor(event.category_id)
                                                            }}
                                                            onClick={() => handleEventClick(event)}
                                                        >
                                                            <CardContent sx={{ py: 1, px: 2 }}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                                    <Typography variant="body1">
                                                                        {event.name}
                                                                    </Typography>
                                                                    <Typography variant="body2" color="text.secondary">
                                                                        {format(new Date(event.event_date), 'h:mm a')}
                                                                    </Typography>
                                                                </Box>
                                                            </CardContent>
                                                        </Card>
                                                    ))}
                                                </Box>
                                            ) : null;
                                        })}
                                    </Box>
                                )}
                                
                                {view === 'month' && monthEvents.length > 0 && (
                                    <Box>
                                        {/* Group events by day */}
                                        {Array.from(
                                            // Create a set of days that have events
                                            new Set(
                                                monthEvents.map(event => 
                                                    format(new Date(event.event_date), 'yyyy-MM-dd')
                                                )
                                            )
                                        ).sort().map((dateStr) => {
                                            const day = new Date(dateStr);
                                            const eventsOnDay = monthEvents.filter(event => 
                                                isSameDay(new Date(event.event_date), day)
                                            );
                                            
                                            return (
                                                <Box key={dateStr} sx={{ mb: 3 }}>
                                                    <Typography variant="subtitle1" sx={{ 
                                                        fontWeight: 'bold', 
                                                        mb: 1,
                                                        color: isSameDay(day, new Date()) ? 'primary.main' : 'text.primary'
                                                    }}>
                                                        {format(day, 'EEEE, MMMM d')}
                                                    </Typography>
                                                    {eventsOnDay.map(event => (
                                                        <Card 
                                                            key={event.event_id} 
                                                            sx={{ 
                                                                mb: 1, 
                                                                cursor: 'pointer',
                                                                transition: 'transform 0.2s, box-shadow 0.2s',
                                                                '&:hover': {
                                                                    transform: 'translateY(-2px)',
                                                                    boxShadow: 2,
                                                                },
                                                                borderLeft: '4px solid',
                                                                borderColor: getCategoryColor(event.category_id)
                                                            }}
                                                            onClick={() => handleEventClick(event)}
                                                        >
                                                            <CardContent sx={{ py: 1, px: 2 }}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                                    <Typography variant="body1">
                                                                        {event.name}
                                                                    </Typography>
                                                                    <Typography variant="body2" color="text.secondary">
                                                                        {format(new Date(event.event_date), 'h:mm a')}
                                                                    </Typography>
                                                                </Box>
                                                            </CardContent>
                                                        </Card>
                                                    ))}
                                                </Box>
                                            );
                                        })}
                                    </Box>
                                )}
                                
                                {((view === 'day' && dayEvents.length === 0) || 
                                  (view === 'week' && weekEvents.length === 0) || 
                                  (view === 'month' && monthEvents.length === 0)) && (
                                    <Box sx={{ py: 4, textAlign: 'center' }}>
                                        <CalendarMonth sx={{ fontSize: 40, color: 'text.disabled', mb: 2 }} />
                                        <Typography variant="body1" color="text.secondary">
                                            No events scheduled for this {view}
                                        </Typography>
                                        <Button 
                                            variant="outlined" 
                                            sx={{ mt: 2 }}
                                            onClick={() => setNewEventOpen(true)}
                                        >
                                            Add an Event
                                        </Button>
                                    </Box>
                                )}
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>
            
            {/* Floating Action Button for adding event */}
            <Fab 
                color="primary" 
                aria-label="add event"
                sx={{ 
                    position: 'fixed',
                    bottom: 20,
                    right: 20,
                    display: { sm: 'none' } // Only show on mobile
                }}
                onClick={() => setNewEventOpen(true)}
            >
                <Add />
            </Fab>
            
            {/* Event Details Modal */}
            <Dialog
                open={eventDetailsOpen}
                onClose={handleCloseEventDetails}
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
                                    {formatDate(selectedEvent.event_date)}
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
                            <Button 
                                startIcon={<Share />} 
                                onClick={() => {
                                    // Basic share function
                                    if (navigator.share) {
                                        navigator.share({
                                            title: selectedEvent.name,
                                            text: `Check out this event: ${selectedEvent.name}`,
                                            url: window.location.href
                                        });
                                    }
                                }}
                            >
                                Share
                            </Button>
                            <Box>
                                <Button onClick={handleCloseEventDetails}>
                                    Close
                                </Button>
                                <Button 
                                    variant="outlined" 
                                    startIcon={<Download />}
                                    onClick={() => downloadEventICS(selectedEvent)}
                                    sx={{ ml: 1 }}
                                >
                                    Export
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
            
            {/* New Event Modal */}
            <Dialog
                open={newEventOpen}
                onClose={() => setNewEventOpen(false)}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle>
                    <Typography variant="h6">Create New Event</Typography>
                </DialogTitle>
                <DialogContent dividers>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    name="name"
                                    label="Event Name"
                                    value={newEvent.name}
                                    onChange={handleNewEventInputChange}
                                    fullWidth
                                    required
                                    margin="normal"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <DatePicker
                                    label="Date"
                                    value={newEvent.event_date}
                                    onChange={handleNewEventDateChange}
                                    slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TimePicker
                                    label="Time"
                                    value={newEvent.event_date}
                                    onChange={handleNewEventDateChange}
                                    slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    name="location"
                                    label="Location"
                                    value={newEvent.location}
                                    onChange={handleNewEventInputChange}
                                    fullWidth
                                    margin="normal"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <FormControl fullWidth margin="normal">
                                    <InputLabel id="category-select-label">Category</InputLabel>
                                    <Select
                                        labelId="category-select-label"
                                        name="category_id"
                                        value={newEvent.category_id}
                                        onChange={handleNewEventInputChange}
                                        label="Category"
                                        required
                                    >
                                        {categories.map((category) => (
                                            <MenuItem key={category.category_id} value={category.category_id}>
                                                {category.category_name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    name="description"
                                    label="Description"
                                    value={newEvent.description}
                                    onChange={handleNewEventInputChange}
                                    fullWidth
                                    multiline
                                    rows={3}
                                    margin="normal"
                                />
                            </Grid>
                        </Grid>
                    </LocalizationProvider>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setNewEventOpen(false)}>
                        Cancel
                    </Button>
                    <Button 
                        variant="contained" 
                        color="primary"
                        onClick={handleCreateEvent}
                        disabled={!newEvent.name || !newEvent.category_id}
                    >
                        Create Event
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default EventCalendar;