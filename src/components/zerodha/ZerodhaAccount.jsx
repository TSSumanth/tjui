import React, { useState } from 'react';
import {
    Box,
    Typography,
    Button,
    Alert,
    Container,
    Stack,
    Paper
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getAccessToken, logout } from '../../services/zerodha/authentication';
import Holdings from './Holdings';
import Positions from './Positions';
import TotalPnL from './TotalPnL';

const ZerodhaAccount = () => {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('holdings-positions');
    const accessToken = getAccessToken();

    const handleLogout = () => {
        logout();
        navigate('/zerodha/login');
    };

    if (!accessToken) {
        return (
            <Container maxWidth="lg">
                <Box sx={{ p: 3 }}>
                    <Alert severity="info">
                        Please login to view your Zerodha account details.
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
            <Box sx={{
                width: '100%',
                bgcolor: 'background.paper',
                borderRadius: 1,
                boxShadow: 1,
                mt: 3
            }}>
                <Box sx={{
                    borderBottom: 1,
                    borderColor: 'divider',
                    p: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <Typography variant="h5" component="h1">
                        Zerodha Account
                    </Typography>
                    <Button
                        variant="outlined"
                        color="error"
                        onClick={handleLogout}
                        size="small"
                    >
                        Logout
                    </Button>
                </Box>

                {/* Always show TotalPnL */}
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <TotalPnL />
                </Box>

                <Stack
                    direction="row"
                    spacing={2}
                    sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}
                >
                    <Button
                        variant={activeSection === 'holdings-positions' ? 'contained' : 'outlined'}
                        onClick={() => setActiveSection('holdings-positions')}
                        sx={{ flex: 1 }}
                    >
                        Holdings & Positions
                    </Button>
                    <Button
                        variant={activeSection === 'orders' ? 'contained' : 'outlined'}
                        onClick={() => setActiveSection('orders')}
                        sx={{ flex: 1 }}
                    >
                        Orders
                    </Button>
                    <Button
                        variant={activeSection === 'pl-report' ? 'contained' : 'outlined'}
                        onClick={() => setActiveSection('pl-report')}
                        sx={{ flex: 1 }}
                    >
                        P/L Report
                    </Button>
                </Stack>

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
                    {activeSection === 'pl-report' && (
                        <Box sx={{ textAlign: 'center', py: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Profit & Loss Report
                            </Typography>
                            <Typography color="textSecondary">
                                P/L Report section coming soon...
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