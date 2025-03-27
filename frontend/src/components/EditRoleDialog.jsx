import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, FormControl, InputLabel, Select, MenuItem,
    Typography, Box, Alert, CircularProgress
} from '@mui/material';
import { Save, Cancel, SecurityUpdate } from '@mui/icons-material';
import api from '../utils/api';

const EditRoleDialog = ({ open, onClose, user, onRoleUpdated }) => {
    const [selectedRole, setSelectedRole] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Set initial role when user data changes
    React.useEffect(() => {
        if (user) {
            setSelectedRole(user.role || 'user');
        }
    }, [user]);

    const handleRoleChange = (event) => {
        setSelectedRole(event.target.value);
        setError(null);
    };

    const handleSubmit = async () => {
        if (!user || !selectedRole) return;

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const updatedUser = await api.users.updateUserRole(user.user_id, { role: selectedRole });
            
            setSuccess(`User ${user.username} role updated to ${selectedRole} successfully!`);
            
            // Notify parent component
            if (onRoleUpdated) {
                onRoleUpdated(updatedUser);
            }
            
            // Close after a short delay
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (error) {
            console.error('Error updating user role:', error);
            setError(error.message || 'Failed to update user role. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                Edit User Role
            </DialogTitle>
            <DialogContent>
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
                
                <Box sx={{ mb: 3 }}>
                    <Typography variant="body1" gutterBottom>
                        Change role for user: <strong>{user.username}</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Changing a user's role will affect their permissions throughout the system.
                    </Typography>
                </Box>
                
                <FormControl fullWidth sx={{ mt: 2 }}>
                    <InputLabel id="role-select-label">Role</InputLabel>
                    <Select
                        labelId="role-select-label"
                        value={selectedRole}
                        label="Role"
                        onChange={handleRoleChange}
                        disabled={loading}
                    >
                        <MenuItem value="user">User</MenuItem>
                        <MenuItem value="admin">Administrator</MenuItem>
                    </Select>
                </FormControl>
                
                <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" color="warning.main">
                        Important:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        • Admin users have full access to all system functions
                        <br />
                        • Regular users have limited permissions
                        <br />
                        • This action will take effect immediately
                    </Typography>
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button 
                    onClick={onClose}
                    startIcon={<Cancel />}
                    disabled={loading}
                >
                    Cancel
                </Button>
                <Button 
                    onClick={handleSubmit}
                    variant="contained" 
                    color="primary"
                    startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                    disabled={loading || selectedRole === user.role}
                >
                    {loading ? 'Updating...' : 'Save Changes'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditRoleDialog;