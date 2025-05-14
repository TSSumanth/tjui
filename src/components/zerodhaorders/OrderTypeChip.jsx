import React from 'react';
import { Chip } from '@mui/material';

const OrderTypeChip = ({ type }) => {
    return (
        <Chip
            label={type}
            size="small"
            variant="outlined"
        />
    );
};

export default OrderTypeChip; 