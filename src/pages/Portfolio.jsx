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

                // Only fetch data if we don't already have holdings or positions
                const needsInitialFetch = !holdings.length && !positions.length;
                console.log('Initial fetch check:', { needsInitialFetch, holdingsCount: holdings.length, positionsCount: positions.length });

                if (isSessionValid && needsInitialFetch) {
                    console.log('Session is valid and data needed, fetching data...');
                    await fetchData();
                } else {
                    console.log('Skipping initial fetch:', {
                        reason: !isSessionValid ? 'Invalid session' : 'Data already loaded',
                        sessionValid: isSessionValid,
                        hasData: !needsInitialFetch
                    });
                }
            } catch (err) {
                console.error('Error initializing data:', err);
            } finally {
                setLocalLoading(false);
            }
        };

        initializeData();
    }, [isAuth, holdings.length, positions.length]); // Dependencies to check if we need to fetch

    // Process positions data
    const processedPositions = React.useMemo(() => {
        if (!positions || !positions.net) return [];

        console.log('Raw positions data:', {
            net: positions.net,
            day: positions.day
        });

        // Take all positions without any filtering
        const allPositions = [...(positions.net || []), ...(positions.day || [])];

        console.log('All positions before processing:', allPositions.map(p => ({
            symbol: p.tradingsymbol,
            quantity: p.quantity,
            overnight_quantity: p.overnight_quantity,
            m2m: p.m2m,
            pnl: p.pnl,
            isSquaredOff: p.quantity === 0 && (p.day_buy_quantity > 0 || p.day_sell_quantity > 0)
        })));

        return allPositions;
    }, [positions]);

    // Calculate P&L for positions
    const { positionsTotalPnL, positionsDayPnL } = React.useMemo(() => {
        let totalPnL = 0;
        let dayPnL = 0;

        console.log('Starting P&L calculations for positions:', processedPositions);

        processedPositions.forEach((position, index) => {
            const posType = getPositionType(position.tradingsymbol);

            console.log(`Processing position ${index + 1}:`, {
                symbol: position.tradingsymbol,
                type: posType,
                isOption: posType === 'Option',
                isFuture: posType === 'Future',
                quantity: position.quantity,
                overnight_quantity: position.overnight_quantity,
                day_buy_quantity: position.day_buy_quantity,
                day_sell_quantity: position.day_sell_quantity,
                m2m: position.m2m,
                pnl: position.pnl,
                isSquaredOff: position.quantity === 0 && (position.day_buy_quantity > 0 || position.day_sell_quantity > 0)
            });

            // Calculate for all F&O positions, including squared off ones
            if (posType === 'Future' || posType === 'Option') {
                // Calculate total P&L
                const posPnL = Number(position.pnl) || 0;
                totalPnL += posPnL;

                // Use m2m for day's P&L
                const posM2M = Number(position.m2m) || 0;
                dayPnL += posM2M;

                console.log('Added to P&L calculation:', {
                    symbol: position.tradingsymbol,
                    type: posType,
                    pnl: posPnL,
                    m2m: posM2M,
                    quantity: position.quantity,
                    overnight_quantity: position.overnight_quantity,
                    day_buy_quantity: position.day_buy_quantity,
                    day_sell_quantity: position.day_sell_quantity,
                    running_total_pnl: totalPnL,
                    running_total_m2m: dayPnL
                });
            }
        });

        console.log('Final P&L totals:', {
            totalPnL,
            dayPnL,
            positionsCount: processedPositions.length,
            positionsList: processedPositions.map(p => ({
                symbol: p.tradingsymbol,
                type: getPositionType(p.tradingsymbol),
                quantity: p.quantity,
                overnight_quantity: p.overnight_quantity,
                day_buy_quantity: p.day_buy_quantity,
                day_sell_quantity: p.day_sell_quantity,
                m2m: p.m2m,
                pnl: p.pnl,
                isSquaredOff: p.quantity === 0 && (p.day_buy_quantity > 0 || p.day_sell_quantity > 0)
            }))
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
                                    Equity Positions
                                    <Tooltip title="Your equity positions">
                                        <InfoIcon fontSize="small" sx={{ ml: 1, color: 'text.secondary' }} />
                                    </Tooltip>
                                </Typography>
                                <Typography variant="h6" gutterBottom>
                                    {positions?.length || 0} Positions
                                </Typography>
                                <Stack direction="row" spacing={2}>
                                    <Chip
                                        label={`Today's Change: ${formatCurrency(positionsDayPnL)}`}
                                        color={positionsDayPnL >= 0 ? "success" : "error"}
                                        size="small"
                                        sx={{ borderRadius: 1 }}
                                    />
                                    <Chip
                                        label={`Overall P&L: ${formatCurrency(positionsTotalPnL)}`}
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
                            background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.primary.main, 0.1)})`,
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                        }}>
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                    Total Portfolio
                                    <Tooltip title="Your total portfolio P&L">
                                        <InfoIcon fontSize="small" sx={{ ml: 1, color: 'text.secondary' }} />
                                    </Tooltip>
                                </Typography>
                                <Typography variant="h6" gutterBottom>
                                    {formatCurrency(totalPnL)}
                                </Typography>
                                <Stack direction="row" spacing={2}>
                                    <Chip
                                        label={`Today's Change: ${formatCurrency(totalDayPnL)}`}
                                        color={totalDayPnL >= 0 ? "success" : "error"}
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