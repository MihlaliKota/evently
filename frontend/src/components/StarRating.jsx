// StarRating.jsx
import React, { useState, useEffect } from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import { Star, StarBorder, StarHalf } from '@mui/icons-material';

const StarRating = ({ 
    value = 0, 
    onChange, 
    precision = 0.5, 
    readOnly = false, 
    size = 'medium',
    showValue = false,
    hoverLabels = []
}) => {
    const [rating, setRating] = useState(value);
    const [hover, setHover] = useState(null);
    
    useEffect(() => {
        setRating(value);
    }, [value]);
    
    // Define icon sizes
    const iconSizes = {
        small: '1rem',
        medium: '1.5rem',
        large: '2rem'
    };
    
    // Get icon size based on size prop
    const getIconSize = () => {
        return iconSizes[size] || iconSizes.medium;
    };
    
    // Get label for current hover value
    const getHoverLabel = (hoverValue) => {
        if (!hoverLabels || hoverLabels.length === 0) return null;
        
        // If we have exact labels for each value based on our precision
        const totalSteps = 5 / precision;
        if (hoverLabels.length === totalSteps) {
            const index = Math.ceil(hoverValue / precision) - 1;
            return index >= 0 && index < hoverLabels.length ? hoverLabels[index] : null;
        }
        
        // If we just have 5 labels (one per star)
        if (hoverLabels.length === 5) {
            return hoverLabels[Math.ceil(hoverValue) - 1];
        }
        
        return null;
    };

    const handleMouseMove = (event, index) => {
        if (readOnly) return;
        
        const { left, width } = event.currentTarget.getBoundingClientRect();
        const percent = (event.clientX - left) / width;
        
        // If precision is 0.5, we'll either set to full or half star
        let value;
        if (precision === 0.5) {
            value = percent > 0.5 ? index + 1 : index + 0.5;
        } else if (precision === 0.1) {
            // For 0.1 precision, we'll round to nearest 0.1
            value = index + Math.round(percent * 10) / 10;
            // Ensure value is between index and index+1
            value = Math.max(index, Math.min(index + 1, value));
        } else {
            // For whole stars or other precision values
            value = percent > 0.5 ? index + 1 : index;
        }
        
        setHover(value);
    };

    const handleMouseLeave = () => {
        if (readOnly) return;
        setHover(null);
    };

    const handleClick = (event, index) => {
        if (readOnly) return;
        
        const { left, width } = event.currentTarget.getBoundingClientRect();
        const percent = (event.clientX - left) / width;
        
        // Similar logic as handleMouseMove
        let newRating;
        if (precision === 0.5) {
            newRating = percent > 0.5 ? index + 1 : index + 0.5;
        } else if (precision === 0.1) {
            newRating = index + Math.round(percent * 10) / 10;
            newRating = Math.max(index, Math.min(index + 1, newRating));
        } else {
            newRating = percent > 0.5 ? index + 1 : index;
        }
        
        setRating(newRating);
        if (onChange) {
            onChange(newRating);
        }
    };

    return (
        <Box 
            sx={{ 
                display: 'flex', 
                alignItems: 'center',
                cursor: readOnly ? 'default' : 'pointer'
            }}
        >
            {[...Array(5)].map((_, index) => {
                const value = index + 1;
                const displayValue = hover !== null ? hover : rating;
                
                // Determine what kind of star to show
                let icon;
                
                if (displayValue >= value) {
                    // Full star
                    icon = (
                        <Star 
                            sx={{ 
                                fontSize: getIconSize(),
                                color: 'gold',
                                transition: 'transform 0.1s',
                                '&:hover': {
                                    transform: !readOnly ? 'scale(1.2)' : 'none'
                                }
                            }} 
                        />
                    );
                } else if (displayValue >= value - 0.5 && displayValue < value) {
                    // Half star
                    icon = (
                        <StarHalf 
                            sx={{ 
                                fontSize: getIconSize(),
                                color: 'gold',
                                transition: 'transform 0.1s',
                                '&:hover': {
                                    transform: !readOnly ? 'scale(1.2)' : 'none'
                                }
                            }} 
                        />
                    );
                } else {
                    // Empty star
                    icon = (
                        <StarBorder 
                            sx={{ 
                                fontSize: getIconSize(),
                                color: 'gold',
                                transition: 'transform 0.1s',
                                '&:hover': {
                                    transform: !readOnly ? 'scale(1.2)' : 'none'
                                }
                            }} 
                        />
                    );
                }
                
                // Get hover label
                const hoverLabel = hover !== null ? getHoverLabel(hover) : null;
                
                return (
                    <Tooltip 
                        key={index} 
                        title={!readOnly && hoverLabel ? hoverLabel : ''}
                        placement="top"
                        arrow
                    >
                        <Box
                            onMouseMove={(e) => handleMouseMove(e, index)}
                            onMouseLeave={handleMouseLeave}
                            onClick={(e) => handleClick(e, index)}
                            sx={{ display: 'inline-flex' }}
                        >
                            {icon}
                        </Box>
                    </Tooltip>
                );
            })}
            
            {showValue && (
                <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ ml: 1, fontWeight: 'medium' }}
                >
                    {(hover !== null ? hover : rating).toFixed(1)}
                </Typography>
            )}
        </Box>
    );
};

export default StarRating;