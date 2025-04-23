import React, { useEffect } from 'react';
import {
    Box,
    Button,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Tooltip,
    CircularProgress,
} from '@mui/material';
import { useZerodha } from '../../context/ZerodhaContext';
import { Link } from 'react-router-dom';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import RefreshIcon from '@mui/icons-material/Refresh';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

const SessionStatus = () => {
    const {
        isAuth,
        sessionActive,
        loading,
        handleLogout,
        checkSession,
        fetchData
    } = useZerodha();

    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);

    // Check session status on mount and periodically
    useEffect(() => {
        const checkSessionStatus = async () => {
            await checkSession();
        };

        if (isAuth) {
            checkSessionStatus();
        }

        const interval = setInterval(() => {
            if (isAuth) {
                checkSessionStatus();
            }
        }, 300000);

        return () => clearInterval(interval);
    }, [isAuth, checkSession]);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleRefresh = async () => {
        handleClose();
        const isValid = await checkSession();
        if (isValid && sessionActive) {
            await fetchData();
        }
    };

    const handleDisconnect = () => {
        handleClose();
        handleLogout();
    };

    // Loading state
    if (loading) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={20} sx={{ color: 'white' }} />
            </Box>
        );
    }

    // Not authenticated state
    if (!isAuth || !sessionActive) {
        return (
            <Button
                component={Link}
                to="/zerodha"
                startIcon={<LinkIcon />}
                sx={{
                    color: 'white',
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    '&:hover': {
                        borderColor: 'white',
                        bgcolor: 'rgba(255, 255, 255, 0.08)'
                    }
                }}
                variant="outlined"
                size="small"
            >
                Connect Zerodha
            </Button>
        );
    }

    // Authenticated state
    return (
        <>
            <Tooltip title="Zerodha Account">
                <Button
                    onClick={handleClick}
                    endIcon={<KeyboardArrowDownIcon />}
                    startIcon={<AccountCircleIcon />}
                    sx={{
                        color: 'white',
                        borderColor: 'rgba(255, 255, 255, 0.5)',
                        '&:hover': {
                            borderColor: 'white',
                            bgcolor: 'rgba(255, 255, 255, 0.08)'
                        }
                    }}
                    variant="outlined"
                    size="small"
                >
                    Connected
                </Button>
            </Tooltip>
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                onClick={handleClose}
                PaperProps={{
                    sx: {
                        mt: 1,
                        minWidth: 200,
                        boxShadow: '0px 2px 8px rgba(0,0,0,0.15)'
                    }
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <MenuItem component={Link} to="/zerodha/accountdetails">
                    <ListItemIcon>
                        <AccountCircleIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Account Details</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleRefresh}>
                    <ListItemIcon>
                        <RefreshIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Refresh Data</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleDisconnect} sx={{ color: 'error.main' }}>
                    <ListItemIcon>
                        <LinkOffIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText>Disconnect</ListItemText>
                </MenuItem>
            </Menu>
        </>
    );
};

export default SessionStatus; 