import React, { useState, useEffect, useCallback } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, FormControl, InputLabel, Select,
    MenuItem, Grid, Alert, CircularProgress,
    Box, Typography, InputAdornment
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
    Event, LocationOn, Description, Category,
    Close, Save, Error
} from '@mui/icons-material';
import api from '../utils/api';

const CreateEventForm = ({ open, onClose, onEventCreated }) => {
    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        location: '',
        event_date: new Date(),
        category_id: ''
    });
    
    // UI state
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccessMessage] = useState(null);
    
    // Get user role from localStorage
    const [userRole, setUserRole] = useState(() => 
        localStorage.getItem('userRole') || 'user'
    );
    
    // Fetch categories when dialog opens
    useEffect(() => {
        if (open) {
            fetchCategories();
        }
    }, [open]);
    
    // Reset form when dialog closes
    useEffect(() => {
        if (!open) {
            setFormData({
                name: '',
                description: '',
                location: '',
                event_date: new Date(),
                category_id: ''
            });
            setError(null);
            setSuccessMessage(null);
        }
    }, [open]);
    
    // Fetch event categories
    const fetchCategories = useCallback(async () => {
        setLoadingCategories(true);
        try {
            const data = await api.categories.getAllCategories();
            setCategories(data);
        } catch (error) {
            console.error('Error fetching categories:', error);
            setError('Failed to load categories. Please try again.');
        } finally {
            setLoadingCategories(false);
        }
    }, []);
    
    // Form input handlers
    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear error when user starts typing
        if (error) setError(null);
    }, [error]);
    
    const handleDateChange = useCallback((newDate) => {
        setFormData(prev => ({
            ...prev,
            event_date: newDate
        }));
    }, []);
    
    // Form validation
    const validateForm = useCallback(() => {
        if (userRole !== 'admin') {
            setError('Only administrators can create events');
            return false;
        }
        
        if (!formData.name.trim()) {
            setError('Event name is required');
            return false;
        }
        
        if (!formData.category_id) {
            setError('Please select a category');
            return false;
        }
        
        return true;
    }, [userRole, formData]);
    
    // Form submission
    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('You must be logged in to create an event');
            }
            
            // Format date for API
            const eventData = {
                ...formData
            };
            
            if (eventData.event_date instanceof Date) {
                eventData.event_date = eventData.event_date.toISOString();
            }
            
            // Create event using API service
            const data = await api.events.createEvent(eventData);
            
            setSuccessMessage('Event created successfully!');
            
            // Reset form
            setFormData({
                name: '',
                description: '',
                location: '',
                event_date: new Date(),
                category_id: ''
            });
            
            if (onEventCreated) {
                onEventCreated(data);
            }
            
            // Close dialog after success
            setTimeout(() => {
                onClose();
            }, 1500);
            
        } catch (error) {
            console.error('Error creating event:', error);
            setError(error.message || 'Failed to create event. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [formData, validateForm, onEventCreated, onClose]);
    
    const handleClose = useCallback(() => {
        setFormData({
            name: '',
            description: '',
            location: '',
            event_date: new Date(),
            category_id: ''
        });
        setError(null);
        setSuccessMessage(null);
        onClose();
    }, [onClose]);
    
    // If user is not admin, show access denied message
    if (userRole !== 'admin') {
        return (
            <Dialog 
                open={open} 
                onClose={handleClose}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="h6">Access Denied</Typography>
                        <Button 
                            color="inherit" 
                            onClick={handleClose}
                            startIcon={<Close />}
                        >
                            Close
                        </Button>
                    </Box>
                </DialogTitle>
                
                <DialogContent dividers>
                    <Alert severity="error" icon={<Error />} sx={{ mb: 2 }}>
                        Only administrators can create events
                    </Alert>
                    <Typography variant="body1">
                        You need administrator privileges to create and manage events. Please contact an administrator if you need to create an event.
                    </Typography>
                </DialogContent>
                
                <DialogActions sx={{ p: 2 }}>
                    <Button
                        variant="outlined"
                        onClick={handleClose}
                    >
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
    
    return (
        <Dialog 
            open={open} 
            onClose={handleClose}
            fullWidth
            maxWidth="md"
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h6">Create New Event</Typography>
                    <Button 
                        color="inherit" 
                        onClick={handleClose}
                        startIcon={<Close />}
                    >
                        Cancel
                    </Button>
                </Box>
            </DialogTitle>
            
            <form onSubmit={handleSubmit}>
                <DialogContent dividers>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                    
                    {success && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            {success}
                        </Alert>
                    )}
                    
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <TextField
                                label="Event Name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                fullWidth
                                required
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Event />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DateTimePicker 
                                    label="Event Date & Time"
                                    value={formData.event_date}
                                    onChange={handleDateChange}
                                    slotProps={{ textField: { fullWidth: true, required: true } }}
                                    disablePast
                                />
                            </LocalizationProvider>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth required>
                                <InputLabel id="category-label">Category</InputLabel>
                                <Select
                                    labelId="category-label"
                                    name="category_id"
                                    value={formData.category_id}
                                    onChange={handleInputChange}
                                    startAdornment={
                                        <InputAdornment position="start">
                                            <Category />
                                        </InputAdornment>
                                    }
                                    disabled={loadingCategories}
                                >
                                    {loadingCategories ? (
                                        <MenuItem value="">
                                            <CircularProgress size={20} /> Loading...
                                        </MenuItem>
                                    ) : (
                                        categories.map((category) => (
                                            <MenuItem key={category.category_id} value={category.category_id}>
                                                {category.category_name}
                                            </MenuItem>
                                        ))
                                    )}
                                </Select>
                            </FormControl>
                        </Grid>
                        
                        <Grid item xs={12}>
                            <TextField
                                label="Location"
                                name="location"
                                value={formData.location}
                                onChange={handleInputChange}
                                fullWidth
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <LocationOn />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        
                        <Grid item xs={12}>
                            <TextField
                                label="Description"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                fullWidth
                                multiline
                                rows={4}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
                                            <Description />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                
                <DialogActions sx={{ p: 2 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        type="submit"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                    >
                        {loading ? 'Creating...' : 'Create Event'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default CreateEventForm;