import React, { useState } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import Header from '../components/Header/Header';
import AuthenticationCard from '../components/zerodha/AuthenticationCard';
import Holdings from '../components/zerodha/Holdings';
import Positions from '../components/zerodha/Positions';
import TotalPnL from '../components/zerodha/TotalPnL';
import { isAuthenticated } from '../services/zerodha/authentication';

const ZerodhaAccount = () => {
    const [authenticated, setAuthenticated] = useState(isAuthenticated());
    const [activeSection, setActiveSection] = useState('holdings-positions');

    React.useEffect(() => {
        setAuthenticated(isAuthenticated());
    }, []);

    return (
        <Box>
            <Header />
            <Box sx={{ p: 3 }}>
                <Box sx={{ mb: 3 }}>
                    <AuthenticationCard />
                </Box>

                {authenticated && (
                    <>
                        <Box sx={{ mb: 3 }}>
                            <TotalPnL />
                        </Box>

                        <Stack
                            direction="row"
                            spacing={2}
                            sx={{ mb: 3 }}
                        >
                            <Button
                                variant={activeSection === 'holdings-positions' ? 'contained' : 'outlined'}
                                onClick={() => setActiveSection('holdings-positions')}
                                fullWidth
                            >
                                Holdings & Positions
                            </Button>
                            <Button
                                variant={activeSection === 'orders' ? 'contained' : 'outlined'}
                                onClick={() => setActiveSection('orders')}
                                fullWidth
                            >
                                Orders
                            </Button>
                            <Button
                                variant={activeSection === 'pl-report' ? 'contained' : 'outlined'}
                                onClick={() => setActiveSection('pl-report')}
                                fullWidth
                            >
                                P/L Report
                            </Button>
                        </Stack>

                        {activeSection === 'holdings-positions' && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <Positions />
                                <Holdings />
                            </Box>
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
                    </>
                )}
            </Box>
        </Box>
    );
};

export default ZerodhaAccount; 