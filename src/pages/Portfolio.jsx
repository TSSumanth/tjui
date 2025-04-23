import React, { useState, useEffect } from 'react';
import { Box, Typography, Container, Tabs, Tab, Stack, Chip, Grid, Button, Switch, FormControlLabel, Tooltip, Paper, useTheme, alpha, CircularProgress } from '@mui/material';
import { useZerodha } from '../context/ZerodhaContext';
import Header from '../components/Header/Header';
import Holdings from '../components/zerodha/Holdings';
import Positions from '../components/zerodha/Positions';
import Orders from '../components/zerodha/Orders';
import RefreshIcon from '@mui/icons-material/Refresh';
import InfoIcon from '@mui/icons-material/Info';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import useScrollToTop from '../hooks/useScrollToTop';
import { getAccountInfo } from '../services/zerodha/api';
import { Link } from 'react-router-dom';
import LinkIcon from '@mui/icons-material/Link';

const formatCurrency = (value) => {
    if (typeof value !== 'number' || isNaN(value)) {
        return '₹0.00';
    }
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value).replace('₹', '₹');
};

const getPositionType = (tradingsymbol) => {
    if (!tradingsymbol) return 'Stock';
    const symbol = tradingsymbol.toUpperCase();
    if (symbol.endsWith('FUT')) {
        return 'Future';
    } else if (symbol.endsWith('CE') || symbol.endsWith('PE')) {
        return 'Option';
    }
    return 'Stock';
};

const Portfolio = () => {
    const theme = useTheme();
    const { holdings, positions, fetchData, loading, isAuth, isAutoSync, setIsAutoSync, handleLogout, sessionActive, checkSession } = useZerodha();
    const [activeTab, setActiveTab] = useState(0);
    const [localLoading, setLocalLoading] = useState(true);

    // Scroll to top when component mounts
    useScrollToTop();

    useEffect(() => {
        const initializeData = async () => {
            try {
                setLocalLoading(true);
                // First check if the session is active
                const isSessionValid = await checkSession();
                console.log('Session check result:', { isSessionValid, isAuth });

                if (isSessionValid) {
                    console.log('Session is valid, fetching data...');
                    await fetchData();
                } else {
                    console.log('Session is invalid or not authenticated');
                }
            } catch (err) {
                console.error('Error initializing data:', err);
            } finally {
                setLocalLoading(false);
            }
        };

        initializeData();
    }, [isAuth, checkSession, fetchData]); // Dependencies for the effect

    // Process positions data
    const processedPositions = React.useMemo(() => {
        if (!positions || !positions.net) return [];

        // Combine net positions
        const allPositions = [...positions.net];

        // Add day positions that aren't in net
        if (positions.day) {
            positions.day.forEach(dayPosition => {
                // Only add if not already in net positions
                if (!allPositions.some(p => p.tradingsymbol === dayPosition.tradingsymbol)) {
                    allPositions.push(dayPosition);
                }
            });
        }

        return allPositions;
    }, [positions]);

    // Calculate P&L for positions
    const { positionsTotalPnL, positionsDayPnL } = React.useMemo(() => {
        let totalPnL = 0;
        let dayPnL = 0;

        processedPositions.forEach(position => {
            const lastPrice = Number(position.last_price) || 0;
            const closePrice = Number(position.close_price) || lastPrice;
            const quantity = position.is_closed ? position.closed_quantity : Number(position.quantity) || 0;
            const positionType = getPositionType(position.tradingsymbol);

            // Calculate total P&L
            totalPnL += Number(position.pnl) || 0;

            // Calculate day's P&L
            if (position.is_closed) {
                dayPnL += Number(position.pnl) || 0;
            } else if (positionType === 'Future') {
                if (quantity > 0) {  // Long futures
                    dayPnL += (lastPrice - closePrice) * quantity;
                } else {  // Short futures
                    dayPnL += (closePrice - lastPrice) * Math.abs(quantity);
                }
            } else {
                // For options and other instruments
                const isLong = position.buy_quantity > position.sell_quantity;
                dayPnL += (lastPrice - closePrice) * quantity * (isLong ? 1 : -1);
            }

            console.log('Position P&L calculation:', {
                symbol: position.tradingsymbol,
                type: positionType,
                quantity,
                lastPrice,
                closePrice,
                dayPnL: position.is_closed ? position.pnl :
                    (positionType === 'Future' ?
                        (quantity > 0 ? (lastPrice - closePrice) * quantity : (closePrice - lastPrice) * Math.abs(quantity)) :
                        (lastPrice - closePrice) * quantity * (position.buy_quantity > position.sell_quantity ? 1 : -1)),
                totalPnL: position.pnl
            });
        });

        return { positionsTotalPnL: totalPnL, positionsDayPnL: dayPnL };
    }, [processedPositions]);

    // Calculate holdings P&L
    const { holdingsPnL, holdingsDayPnL } = React.useMemo(() => {
        let totalPnL = 0;
        let dayPnL = 0;

        holdings?.forEach(holding => {
            const quantity = Number(holding.quantity) || 0;
            const lastPrice = Number(holding.last_price) || 0;
            const closePrice = Number(holding.close_price) || lastPrice;
            const avgPrice = Number(holding.average_price) || 0;

            dayPnL += (lastPrice - closePrice) * quantity;
            totalPnL += (lastPrice - avgPrice) * quantity;
        });

        return {
            holdingsPnL: totalPnL,
            holdingsDayPnL: dayPnL
        };
    }, [holdings]);

    // Calculate total portfolio P&L
    const { totalPnL, totalDayPnL } = React.useMemo(() => ({
        totalPnL: holdingsPnL + positionsTotalPnL,
        totalDayPnL: holdingsDayPnL + positionsDayPnL
    }), [holdingsPnL, positionsTotalPnL, holdingsDayPnL, positionsDayPnL]);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const handleAutoSyncChange = (event) => {
        setIsAutoSync(event.target.checked);
    };

    const handleConnect = () => {
        // Redirect to Zerodha Account page for connection
        window.location.href = '/zerodha';
    };

    // Show loading state while initializing
    if (localLoading || loading) {
        return (
            <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
                <Header />
                <Container maxWidth="lg">
                    <Box sx={{
                        mt: 8,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                        <CircularProgress />
                    </Box>
                </Container>
            </Box>
        );
    }

    // Show connect screen if not authenticated or session inactive
    if (!isAuth || !sessionActive) {
        return (
            <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
                <Header />
                <Container maxWidth="md" sx={{ mt: 8 }}>
                    <Paper sx={{
                        p: 4,
                        textAlign: 'center',
                        borderRadius: 2,
                        boxShadow: theme.shadows[2],
                        background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.primary.main, 0.1)})`
                    }}>
                        <AccountBalanceIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                        <Typography variant="h5" gutterBottom>
                            Please authenticate with Zerodha
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                            Connect your Zerodha account to view your portfolio and trading information
                        </Typography>
                        <Button
                            variant="contained"
                            color="primary"
                            size="large"
                            startIcon={<LinkIcon />}
                            component={Link}
                            to="/zerodha/accountdetails"
                        >
                            Connect to Zerodha
                        </Button>
                    </Paper>
                </Container>
            </Box>
        );
    }

    // Show portfolio when authenticated and session is active
    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
            <Header />
            <Container maxWidth="lg" sx={{ py: 4 }}>
                {/* Header Section */}
                <Paper sx={{
                    p: 3,
                    mb: 3,
                    borderRadius: 2,
                    boxShadow: theme.shadows[2],
                    background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.primary.main, 0.1)})`
                }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                <ShowChartIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                                <Typography variant="h4">Portfolio Overview</Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                Last updated: {new Date().toLocaleTimeString()}
                            </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={2}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={isAutoSync}
                                        onChange={handleAutoSyncChange}
                                        color="primary"
                                    />
                                }
                                label={
                                    <Box display="flex" alignItems="center">
                                        Auto-sync
                                        <Tooltip title="Auto-sync updates your portfolio data every minute during market hours (9:15 AM - 3:30 PM, Mon-Fri)">
                                            <InfoIcon fontSize="small" sx={{ ml: 1, color: 'text.secondary' }} />
                                        </Tooltip>
                                    </Box>
                                }
                            />
                            <Button
                                variant="outlined"
                                startIcon={<RefreshIcon />}
                                onClick={fetchData}
                                disabled={loading}
                                sx={{
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    px: 2
                                }}
                            >
                                {loading ? 'Refreshing...' : 'Refresh Data'}
                            </Button>
                        </Box>
                    </Box>
                </Paper>

                {/* Portfolio Stats */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={4}>
                        <Paper sx={{
                            p: 3,
                            height: '100%',
                            borderRadius: 2,
                            boxShadow: theme.shadows[2],
                            background: `linear-gradient(45deg, ${alpha(theme.palette.success.main, 0.05)}, ${alpha(theme.palette.success.main, 0.1)})`,
                            border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`
                        }}>
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                    Equity Holdings
                                    <Tooltip title="Your long-term equity investments">
                                        <InfoIcon fontSize="small" sx={{ ml: 1, color: 'text.secondary' }} />
                                    </Tooltip>
                                </Typography>
                                <Typography variant="h6" gutterBottom>
                                    {holdings?.length || 0} Stocks
                                </Typography>
                                <Stack direction="row" spacing={2}>
                                    <Chip
                                        label={`Today's Change: ${formatCurrency(holdingsDayPnL)}`}
                                        color={holdingsDayPnL >= 0 ? "success" : "error"}
                                        size="small"
                                        sx={{ borderRadius: 1 }}
                                    />
                                    <Chip
                                        label={`Overall P&L: ${formatCurrency(holdingsPnL)}`}
                                        color={holdingsPnL >= 0 ? "success" : "error"}
                                        size="small"
                                        sx={{ borderRadius: 1 }}
                                    />
                                </Stack>
                            </Box>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Paper sx={{
                            p: 3,
                            height: '100%',
                            borderRadius: 2,
                            boxShadow: theme.shadows[2],
                            background: `linear-gradient(45deg, ${alpha(theme.palette.warning.main, 0.05)}, ${alpha(theme.palette.warning.main, 0.1)})`,
                            border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`
                        }}>
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                    F&O Positions
                                    <Tooltip title="Your Futures and Options positions">
                                        <InfoIcon fontSize="small" sx={{ ml: 1, color: 'text.secondary' }} />
                                    </Tooltip>
                                </Typography>
                                <Typography variant="h6" gutterBottom>
                                    {processedPositions.length || 0} Positions
                                </Typography>
                                <Stack direction="row" spacing={2}>
                                    <Chip
                                        label={`Today's M2M: ${formatCurrency(positionsDayPnL)}`}
                                        color={positionsDayPnL >= 0 ? "success" : "error"}
                                        size="small"
                                        sx={{ borderRadius: 1 }}
                                    />
                                    <Chip
                                        label={`Total P&L: ${formatCurrency(positionsTotalPnL)}`}
                                        color={positionsTotalPnL >= 0 ? "success" : "error"}
                                        size="small"
                                        sx={{ borderRadius: 1 }}
                                    />
                                </Stack>
                            </Box>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Paper sx={{
                            p: 3,
                            height: '100%',
                            borderRadius: 2,
                            boxShadow: theme.shadows[2],
                            background: `linear-gradient(45deg, ${alpha(theme.palette.info.main, 0.05)}, ${alpha(theme.palette.info.main, 0.1)})`,
                            border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`
                        }}>
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                    Total Portfolio
                                    <Tooltip title="Combined performance of your equity and F&O positions">
                                        <InfoIcon fontSize="small" sx={{ ml: 1, color: 'text.secondary' }} />
                                    </Tooltip>
                                </Typography>
                                <Typography variant="h6" gutterBottom>
                                    {(holdings?.length || 0) + (processedPositions.length || 0)} Total
                                </Typography>
                                <Stack direction="row" spacing={2}>
                                    <Chip
                                        label={`Today's P&L: ${formatCurrency(totalDayPnL)}`}
                                        color={totalDayPnL >= 0 ? "success" : "error"}
                                        size="small"
                                        sx={{ borderRadius: 1 }}
                                    />
                                    <Chip
                                        label={`Net P&L: ${formatCurrency(totalPnL)}`}
                                        color={totalPnL >= 0 ? "success" : "error"}
                                        size="small"
                                        sx={{ borderRadius: 1 }}
                                    />
                                </Stack>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>

                {/* Tabs Section */}
                <Paper sx={{
                    borderRadius: 2,
                    boxShadow: theme.shadows[2],
                    overflow: 'hidden'
                }}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs
                            value={activeTab}
                            onChange={handleTabChange}
                            aria-label="portfolio tabs"
                            sx={{
                                '& .MuiTab-root': {
                                    textTransform: 'none',
                                    fontWeight: 500,
                                    minHeight: 48
                                }
                            }}
                        >
                            <Tab label="Holdings" id="portfolio-tab-0" aria-controls="portfolio-tabpanel-0" />
                            <Tab label="Positions" id="portfolio-tab-1" aria-controls="portfolio-tabpanel-1" />
                            <Tab label="Orders" id="portfolio-tab-2" aria-controls="portfolio-tabpanel-2" />
                        </Tabs>
                    </Box>
                    <Box sx={{ p: 3, minHeight: '300px' }}>
                        {activeTab === 0 && <Holdings />}
                        {activeTab === 1 && <Positions />}
                        {activeTab === 2 && <Orders />}
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default Portfolio; 