import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import EventIcon from '@mui/icons-material/Event';

const Header = () => {
    const navigate = useNavigate();

    return (
        <div>
            {/* Existing code */}
            <MenuItem onClick={() => navigate('/tags')}>
                <ListItemIcon>
                    <LocalOfferIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Tag Management</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => navigate('/events-holidays')}>
                <ListItemIcon>
                    <EventIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Events and Holidays</ListItemText>
            </MenuItem>
            {/* Existing code */}
        </div>
    );
};

export default Header; 