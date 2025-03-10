import React, { useState, useEffect } from 'react';
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
    Close, Save
} from '@mui/icons-material';
import { fetchApi } from '../utils/api';

const CreateEventForm = ({ open, onClose, onEventCreated }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        location: '',
        event_date: new Date(),
        category_id: ''
    });
    
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    
    useEffect(() => {
        const fetchCategories = async () => {
            setLoadingCategories(true);
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                const response = await fetch(`${apiUrl}/api/categories`);
                
                if (!response.ok) {
                    throw new Error(`Failed to fetch categories: ${response.status}`);
                }
                
                const data = await response.json();
                setCategories(data);
            } catch (error) {
                console.error('Error fetching categories:', error);
                setError('Failed to load categories. Please try again.');
            } finally {
                setLoadingCategories(false);
            }
        };
        
        if (open) {
            fetchCategories();
        }
    }, [open]);
    
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };
    
    const handleDateChange = (newDate) => {
        setFormData({
            ...formData,
            event_date: newDate
        });
    };
    
    const validateForm = () => {
        if (!formData.name.trim()) {
            setError('Event name is required');
            return false;
        }
        
        if (!formData.category_id) {
            setError('Please select a category');
            return false;
        }
        
        return true;
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        setLoading(true);
        setError(null);
        setSuccess(null);
        
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('You must be logged in to create an event');
            }
            
            const payload = token.split('.')[1];
            const decodedPayload = JSON.parse(atob(payload));
            const user_id = decodedPayload.userId;
            
            if (!user_id) {
                throw new Error('Unable to retrieve user ID from session');
            }
            
            // Create a copy of the form data
            const eventData = {
                ...formData
            };
            
            // Ensure consistent date format
            if (eventData.event_date instanceof Date) {
                eventData.event_date = eventData.event_date.toISOString();
            }
            
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            
            console.log('Submitting event with data:', eventData);
            
            const response = await fetch(`${apiUrl}/api/events`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(eventData)
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to create event: ${response.status}`);
            }
            
            const data = await response.json();
            setSuccess('Event created successfully!');
            
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
            
            setTimeout(() => {
                onClose();
            }, 1500);
            
        } catch (error) {
            console.error('Error creating event:', error);
            setError(error.message || 'Failed to create event. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleNewReviewChange = (field, value) => {
        if (field === 'event_date') {
            const formattedDate = new Date(value).toISOString().slice(0, 19).replace('T', ' ');
            setFormData({
                ...formData,
                [field]: formattedDate
            });
        } else {
            setFormData({
                ...formData,
                [field]: value
            });
        }
    };
    
    const handleClose = () => {
        setFormData({
            name: '',
            description: '',
            location: '',
            event_date: new Date(),
            category_id: ''
        });
        setError(null);
        setSuccess(null);
        onClose();
    };
    
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