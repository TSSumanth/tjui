import React, { useState } from 'react';
import { IconButton, Menu, MenuItem } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';

const OrderActions = ({
    order,
    onCancel,
    onModify,
    onLinkToTrade,
    onViewDetails
}) => {
    const [menuAnchorEl, setMenuAnchorEl] = useState(null);

    const handleMenuClick = (event) => {
        setMenuAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setMenuAnchorEl(null);
    };

    return (
        <>
            <IconButton
                size="small"
                onClick={handleMenuClick}
            >
                <MoreVertIcon />
            </IconButton>
            <Menu
                anchorEl={menuAnchorEl}
                open={Boolean(menuAnchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                {order.status === 'TRIGGER PENDING' && (
                    <MenuItem onClick={() => {
                        onCancel(order);
                        handleMenuClose();
                    }}>
                        Cancel
                    </MenuItem>
                )}
                {['OPEN', 'AMO REQ RECEIVED'].includes(order.status) && (
                    <>
                        <MenuItem onClick={() => {
                            onCancel(order);
                            handleMenuClose();
                        }}>
                            Cancel
                        </MenuItem>
                        <MenuItem onClick={() => {
                            onModify(order);
                            handleMenuClose();
                        }}>
                            Modify
                        </MenuItem>
                    </>
                )}
                <MenuItem onClick={() => {
                    onViewDetails(order);
                    handleMenuClose();
                }}>
                    View Details
                </MenuItem>
                {order.status === 'COMPLETE' && (
                    <MenuItem onClick={() => {
                        onLinkToTrade(order);
                        handleMenuClose();
                    }}>
                        Link to Trade
                    </MenuItem>
                )}
            </Menu>
        </>
    );
};

export default OrderActions; 