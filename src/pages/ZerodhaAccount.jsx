import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, Button, CircularProgress, Container, Tabs, Tab, Stack, Chip, Grid } from '@mui/material';
import { useZerodha } from '../context/ZerodhaContext';
import Holdings from '../components/zerodha/Holdings';
import Orders from '../components/zerodha/Orders';
import Positions from '../components/zerodha/Positions';
import Header from '../components/Header/Header';

const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5003';

const formatCurrency = (value) => {
    if (typeof value !== 'number' || isNaN(value)) {
        return '₹0.00';
    }
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
};

// Test comment for approval workflow demonstration
const ZerodhaAccount = () => {
    const { isAuth, isLoading, error, fetchData, setIsAuth, holdings, positions, isAutoSync } = useZerodha();
    const [loginUrl, setLoginUrl] = useState(null);
    const [activeTab, setActiveTab] = useState(0);

    // Calculate portfolio P/L components
    const { totalPortfolioPnL, totalDayPnL, holdingsPnL, positionsPnL, holdingsDayPnL, positionsDayPnL } = React.useMemo(() => {
        let holdingsPnL = 0;
        let holdingsDayPnL = 0;
        let positionsPnL = 0;
        let positionsDayPnL = 0;

        // Calculate holdings P/L
        holdings?.forEach(holding => {
            holdingsPnL += Number(holding.pnl) || 0;
            const lastPrice = Number(holding.last_price) || 0;
            const prevClose = Number(holding.previous_close) || lastPrice;
            const quantity = Number(holding.quantity) || 0;
            holdingsDayPnL += (lastPrice - prevClose) * quantity;
        });

        // Calculate positions P/L
        positions?.forEach(position => {
            positionsPnL += Number(position.pnl) || 0;
            positionsDayPnL += Number(position.day_m2m) || 0;
        });

        return {
            holdingsPnL,
            positionsPnL,
            holdingsDayPnL,
            positionsDayPnL,
            totalPortfolioPnL: holdingsPnL + positionsPnL,
            totalDayPnL: holdingsDayPnL + positionsDayPnL
        };
    }, [holdings, positions]);

    useEffect(() => {
        const fetchLoginUrl = async () => {
            try {
                console.log('Fetching login URL...');
                const response = await fetch(`${API_URL}/api/zerodha/login-url`);
                console.log('Response status:', response.status);
                const data = await response.json();
                console.log('Login URL response:', data);
                if (data.success) {
                    setLoginUrl(data.loginUrl);
                } else {
                    console.error('Failed to get login URL:', data.error);
                }
            } catch (error) {
                console.error('Error fetching login URL:', error);
                console.error('Error details:', {
                    message: error.message,
                    stack: error.stack
                });
            }
        };
        fetchLoginUrl();

        // Add message listener for popup window
        const handleMessage = (event) => {
            console.log('Received message:', event.data);
            if (event.data.type === 'ZERODHA_AUTH_SUCCESS') {
                const { access_token, public_token } = event.data.data;
                console.log('Storing tokens:', { access_token, public_token });
                localStorage.setItem('zerodha_access_token', access_token);
                localStorage.setItem('zerodha_public_token', public_token);
                setIsAuth(true);
                fetchData();
            } else if (event.data.type === 'ZERODHA_AUTH_ERROR') {
                console.error('Authentication error:', event.data.error);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [fetchData, setIsAuth]);

    const handleLogin = () => {
        if (loginUrl) {
            const width = 600;
            const height = 600;
            const left = window.screenX + (window.outerWidth - width) / 2;
            const top = window.screenY + (window.outerHeight - height) / 2;
            const popup = window.open(
                loginUrl,
                'Zerodha Login',
                `width=${width},height=${height},left=${left},top=${top}`
            );

            if (!popup) {
                console.error('Popup was blocked by the browser');
            }
        }
    };

    const handleRefresh = () => {
        fetchData();
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    if (!isAuth) {
        return (
            <div>
                <Header />
                <Container maxWidth="md" sx={{ mt: 4 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h5" gutterBottom>
                                Zerodha Authentication Required
                            </Typography>
                            <Typography variant="body1" color="textSecondary">
                                Please authenticate with Zerodha to view your account details.
                            </Typography>
                            <Box mt={2}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleLogin}
                                    disabled={!loginUrl}
                                >
                                    Login with Zerodha
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Container>
            </div>
        );
    }

    return (
        <div>
            <Header />
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center" gap={2}>
                        <Typography variant="h4">Zerodha Account</Typography>
                        <Chip
                            label="Connected to Zerodha"
                            color="success"
                            sx={{ height: '24px' }}
                        />
                        <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={() => {
                                localStorage.removeItem('zerodha_access_token');
                                localStorage.removeItem('zerodha_public_token');
                                setIsAuth(false);
                            }}
                        >
                            Disconnect
                        </Button>
                    </Box>
                    <Stack direction="row" spacing={2}>
                        <Chip
                            label={isAutoSync ? "Auto-sync ON" : "Auto-sync OFF"}
                            color={isAutoSync ? "success" : "default"}
                            size="small"
                            sx={{ height: '32px' }}
                        />
                        <Button
                            variant="outlined"
                            onClick={handleRefresh}
                            disabled={isLoading}
                            startIcon={isLoading && <CircularProgress size={20} />}
                            title={isAutoSync ? "Auto-sync is active during market hours (9:00 AM - 3:30 PM, Mon-Fri)" : "Click to manually sync data"}
                        >
                            {isLoading ? 'Refreshing...' : 'Sync Data'}
                        </Button>
                    </Stack>
                </Box>

                {/* P/L Summary Section */}
                <Box
                    mb={3}
                    p={2}
                    sx={{
                        backgroundColor: 'background.paper',
                        borderRadius: 1,
                        boxShadow: 1
                    }}
                >
                    <Typography variant="h6" gutterBottom>Portfolio Summary</Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary">Holdings</Typography>
                                <Stack direction="row" spacing={2} mt={1}>
                                    <Chip
                                        label={`Day's P&L: ${formatCurrency(holdingsDayPnL)}`}
                                        color={holdingsDayPnL >= 0 ? "success" : "error"}
                                        size="small"
                                    />
                                    <Chip
                                        label={`Total P&L: ${formatCurrency(holdingsPnL)}`}
                                        color={holdingsPnL >= 0 ? "success" : "error"}
                                        size="small"
                                    />
                                </Stack>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary">Positions</Typography>
                                <Stack direction="row" spacing={2} mt={1}>
                                    <Chip
                                        label={`Day's P&L: ${formatCurrency(positionsDayPnL)}`}
                                        color={positionsDayPnL >= 0 ? "success" : "error"}
                                        size="small"
                                    />
                                    <Chip
                                        label={`Total P&L: ${formatCurrency(positionsPnL)}`}
                                        color={positionsPnL >= 0 ? "success" : "error"}
                                        size="small"
                                    />
                                </Stack>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary">Overall Portfolio</Typography>
                                <Stack direction="row" spacing={2} mt={1}>
                                    <Chip
                                        label={`Day's P&L: ${formatCurrency(totalDayPnL)}`}
                                        color={totalDayPnL >= 0 ? "success" : "error"}
                                        size="small"
                                    />
                                    <Chip
                                        label={`Total P&L: ${formatCurrency(totalPortfolioPnL)}`}
                                        color={totalPortfolioPnL >= 0 ? "success" : "error"}
                                        size="small"
                                    />
                                </Stack>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>

                {error && (
                    <Box mb={3}>
                        <Typography color="error">{error}</Typography>
                    </Box>
                )}

                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                    <Tabs value={activeTab} onChange={handleTabChange}>
                        <Tab label="Holdings" />
                        <Tab label="Positions" />
                        <Tab label="Orders" />
                    </Tabs>
                </Box>

                {activeTab === 0 && (
                    <Box mb={3}>
                        <Holdings />
                    </Box>
                )}

                {activeTab === 1 && (
                    <Box mb={3}>
                        <Positions />
                    </Box>
                )}

                {activeTab === 2 && (
                    <Box mb={3}>
                        <Orders />
                    </Box>
                )}
            </Container>
        </div>
    );
};

export default ZerodhaAccount; 