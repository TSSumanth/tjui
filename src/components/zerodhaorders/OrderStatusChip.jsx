import React from 'react';
import { Chip } from '@mui/material';

const OrderStatusChip = ({ status }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'COMPLETE':
                return 'success';
            case 'CANCELLED':
                return 'default';
            case 'TRIGGER PENDING':
                return 'info';
            default:
                return 'warning';
        }
    };

    return (
        <Chip
            label={status}
            color={getStatusColor(status)}
            size="small"
        />
    );
};

export default OrderStatusChip; 