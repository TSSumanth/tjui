import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Alert,
    Container,
    Stack,
    CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useZerodha } from '../../context/ZerodhaContext';
import Holdings from './Holdings';
import Positions from './Positions';

const ZerodhaAccount = () => {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('holdings-positions');
    const { isAuth, sessionActive, loading, handleLogout, checkSession } = useZerodha();

    useEffect(() => {
        // Check session status when component mounts
        checkSession(true);
    }, [checkSession]);

    const handleLogoutClick = () => {
        handleLogout();
        navigate('/zerodha/login');
    };

    if (loading) {
        return (
            <Container maxWidth="lg">
                <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    if (!isAuth || !sessionActive) {
        return (
            <Container maxWidth="lg">
                <Box sx={{ p: 3 }}>
                    <Alert severity="warning">
                        Your session has expired or is invalid. Please login again to continue.
                    </Alert>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => navigate('/zerodha/login')}
                        sx={{ mt: 2 }}
                    >
                        Login to Zerodha
                    </Button>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg">
            <Box sx={{ p: 3 }}>
                <Box sx={{ mb: 3 }}>
                    <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
                        <Typography variant="h4" component="h1">
                            Zerodha Account
                        </Typography>
                        <Button
                            variant="outlined"
                            color="error"
                            onClick={handleLogoutClick}
                        >
                            Logout
                        </Button>
                    </Stack>
                </Box>

                <Box sx={{ mb: 3 }}>
                    <Stack direction="row" spacing={2}>
                        <Button
                            variant={activeSection === 'holdings-positions' ? 'contained' : 'outlined'}
                            onClick={() => setActiveSection('holdings-positions')}
                        >
                            Holdings & Positions
                        </Button>
                        <Button
                            variant={activeSection === 'orders' ? 'contained' : 'outlined'}
                            onClick={() => setActiveSection('orders')}
                        >
                            Orders
                        </Button>
                    </Stack>
                </Box>

                <Box sx={{ p: 3 }}>
                    {activeSection === 'holdings-positions' && (
                        <>
                            <Box sx={{ mb: 4 }}>
                                <Positions />
                            </Box>
                            <Holdings />
                        </>
                    )}
                    {activeSection === 'orders' && (
                        <Box sx={{ textAlign: 'center', py: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Orders
                            </Typography>
                            <Typography color="textSecondary">
                                Orders section coming soon...
                            </Typography>
                        </Box>
                    )}
                    {!activeSection && (
                        <Box sx={{ textAlign: 'center', py: 3 }}>
                            <Typography color="textSecondary">
                                Please select a section to view details
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Box>
        </Container>
    );
};

export default ZerodhaAccount; 