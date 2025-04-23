import React from 'react';
import {
    Box,
    Button,
    Chip,
    Stack,
    Tooltip,
    CircularProgress
} from '@mui/material';
import { useZerodha } from '../../context/ZerodhaContext';
import { Link } from 'react-router-dom';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import RefreshIcon from '@mui/icons-material/Refresh';

const SessionStatus = () => {
    const {
        isAuth,
        sessionActive,
        loading,
        handleLogout,
        checkSession,
        fetchData
    } = useZerodha();

    const handleRefresh = async () => {
        await checkSession();
        if (sessionActive) {
            await fetchData();
        }
    };

    // Base container style to maintain consistent width
    const containerStyle = {
        minWidth: '300px',
        display: 'flex',
        justifyContent: 'flex-end'
    };

    // Loading state
    if (loading) {
        return (
            <Box sx={containerStyle}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                        label="Updating..."
                        size="small"
                        sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', color: 'white' }}
                    />
                    <CircularProgress size={20} sx={{ color: 'white' }} />
                </Box>
            </Box>
        );
    }

    // Not authenticated state
    if (!isAuth || !sessionActive) {
        return (
            <Box sx={containerStyle}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                        label="Not Connected"
                        color="error"
                        size="small"
                        sx={{
                            bgcolor: 'rgba(255, 255, 255, 0.9)',
                            '& .MuiChip-label': {
                                fontWeight: 500
                            }
                        }}
                    />
                    <Button
                        component={Link}
                        to="/zerodha"
                        startIcon={<LinkIcon />}
                        size="small"
                        sx={{
                            bgcolor: 'white',
                            color: '#1976d2',
                            '&:hover': {
                                bgcolor: 'rgba(255, 255, 255, 0.9)'
                            },
                            minWidth: '100px'
                        }}
                    >
                        Connect
                    </Button>
                </Stack>
            </Box>
        );
    }

    // Authenticated state
    return (
        <Box sx={containerStyle}>
            <Stack direction="row" spacing={1} alignItems="center">
                <Tooltip title="Zerodha session is active">
                    <Chip
                        label="Connected"
                        color="success"
                        size="small"
                        sx={{
                            bgcolor: 'rgba(255, 255, 255, 0.9)',
                            '& .MuiChip-label': {
                                fontWeight: 500
                            }
                        }}
                    />
                </Tooltip>
                <Button
                    startIcon={<RefreshIcon />}
                    size="small"
                    onClick={handleRefresh}
                    sx={{
                        bgcolor: 'white',
                        color: '#1976d2',
                        '&:hover': {
                            bgcolor: 'rgba(255, 255, 255, 0.9)'
                        },
                        minWidth: '100px'
                    }}
                >
                    Refresh
                </Button>
                <Button
                    startIcon={<LinkOffIcon />}
                    size="small"
                    onClick={handleLogout}
                    sx={{
                        bgcolor: 'white',
                        color: '#d32f2f',
                        '&:hover': {
                            bgcolor: 'rgba(255, 255, 255, 0.9)',
                            color: '#d32f2f'
                        },
                        minWidth: '100px'
                    }}
                >
                    Disconnect
                </Button>
            </Stack>
        </Box>
    );
};

export default SessionStatus; 