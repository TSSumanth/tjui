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
                const isSessionValid = await checkSession();
                // Only fetch data if session is valid and we don't have data yet
                if (isSessionValid && (!holdings?.length || !positions?.net?.length)) {
                    await fetchData();
                }
            } catch (err) {
                console.error('Error initializing data:', err);
            } finally {
                setLocalLoading(false);
            }
        };

        // Only initialize if we have auth and no data
        if (isAuth && (!holdings?.length || !positions?.net?.length)) {
            initializeData();
        } else {
            setLocalLoading(false);
        }
        // Remove holdings.length and positions.length from dependencies to prevent continuous fetching
    }, [isAuth, checkSession, fetchData]);

    // Process positions data
    const processedPositions = React.useMemo(() => {
        if (!positions || !positions.net) return [];
        const allPositions = [...(positions.net || []), ...(positions.day || [])];
        // Filter out duplicates based on tradingsymbol
        return allPositions.filter((position, index, self) =>
            index === self.findIndex((p) => p.tradingsymbol === position.tradingsymbol)
        );
    }, [positions]);

    // Calculate P&L for positions
    const { positionsTotalPnL, positionsDayPnL, activePositionsCount } = React.useMemo(() => {
        let totalPnL = 0;
        let dayPnL = 0;
        let activeCount = 0;

        processedPositions.forEach((position) => {
            const posType = getPositionType(position.tradingsymbol);
            if (posType === 'Future' || posType === 'Option') {
                if (position.quantity !== 0) {
                    activeCount++;
                }
                totalPnL += Number(position.pnl) || 0;
                dayPnL += Number(position.m2m) || 0;
            }
        });

        return { positionsTotalPnL: totalPnL, positionsDayPnL: dayPnL, activePositionsCount: activeCount };
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
                            to="/zerodha/account"
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
        <Box>
            <Header />
            <Container maxWidth={false} sx={{ mt: 4, px: { xs: 2, sm: 3, md: 4 } }}>
                {/* Auto-sync switch */}
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    mb: 3,
                    gap: 2,
                    alignItems: 'center'
                }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={isAutoSync}
                                onChange={handleAutoSyncChange}
                                color="primary"
                                size="small"
                            />
                        }
                        label={
                            <Box display="flex" alignItems="center" sx={{ typography: 'body2' }}>
                                Auto-sync
                                <Tooltip title="Auto-sync updates your portfolio data every minute during market hours (9:15 AM - 3:30 PM, Mon-Fri)">
                                    <InfoIcon sx={{ ml: 0.5, fontSize: '1rem', color: 'text.secondary' }} />
                                </Tooltip>
                            </Box>
                        }
                    />
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={fetchData}
                        disabled={loading}
                        size="small"
                        sx={{
                            borderRadius: 1.5,
                            textTransform: 'none',
                            px: 1.5,
                            py: 0.5
                        }}
                    >
                        {loading ? 'Refreshing...' : 'Refresh'}
                    </Button>
                </Box>

                {/* Cards Grid */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={4}>
                        <Paper sx={{
                            p: 2,
                            height: '100%',
                            borderRadius: 2,
                            boxShadow: theme.shadows[2],
                            background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.02)}, ${alpha(theme.palette.success.main, 0.05)})`,
                            border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                            transition: 'transform 0.2s ease-in-out',
                            '&:hover': {
                                transform: 'translateY(-2px)'
                            }
                        }}>
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                    mb: 1
                                }}>
                                    Equity Holdings
                                    <Tooltip title="Your long-term equity investments">
                                        <InfoIcon fontSize="small" sx={{ ml: 0.5, fontSize: '0.875rem', color: 'text.secondary' }} />
                                    </Tooltip>
                                </Typography>
                                <Typography variant="h6" sx={{
                                    color: 'text.primary',
                                    fontWeight: 600,
                                    mb: 1.5
                                }}>
                                    {holdings?.length || 0} Stocks
                                </Typography>
                                <Stack direction="row" spacing={2}>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            Today's Change
                                        </Typography>
                                        <Typography variant="body1" sx={{
                                            color: holdingsDayPnL >= 0 ? 'success.main' : 'error.main',
                                            fontWeight: 500,
                                            fontFamily: 'monospace'
                                        }}>
                                            {formatCurrency(holdingsDayPnL)}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            Overall P&L
                                        </Typography>
                                        <Typography variant="body1" sx={{
                                            color: holdingsPnL >= 0 ? 'success.main' : 'error.main',
                                            fontWeight: 500,
                                            fontFamily: 'monospace'
                                        }}>
                                            {formatCurrency(holdingsPnL)}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Box>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Paper sx={{
                            p: 2,
                            height: '100%',
                            borderRadius: 2,
                            boxShadow: theme.shadows[2],
                            background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.02)}, ${alpha(theme.palette.warning.main, 0.05)})`,
                            border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`,
                            transition: 'transform 0.2s ease-in-out',
                            '&:hover': {
                                transform: 'translateY(-2px)'
                            }
                        }}>
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                    mb: 1
                                }}>
                                    F&O Positions
                                    <Tooltip title="Your futures and options positions">
                                        <InfoIcon fontSize="small" sx={{ ml: 0.5, fontSize: '0.875rem', color: 'text.secondary' }} />
                                    </Tooltip>
                                </Typography>
                                <Typography variant="h6" sx={{
                                    color: 'text.primary',
                                    fontWeight: 600,
                                    mb: 1.5
                                }}>
                                    {activePositionsCount} Positions
                                </Typography>
                                <Stack direction="row" spacing={2}>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            Today's Change
                                        </Typography>
                                        <Typography variant="body1" sx={{
                                            color: positionsDayPnL >= 0 ? 'success.main' : 'error.main',
                                            fontWeight: 500,
                                            fontFamily: 'monospace'
                                        }}>
                                            {formatCurrency(positionsDayPnL)}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            Overall P&L
                                        </Typography>
                                        <Typography variant="body1" sx={{
                                            color: positionsTotalPnL >= 0 ? 'success.main' : 'error.main',
                                            fontWeight: 500,
                                            fontFamily: 'monospace'
                                        }}>
                                            {formatCurrency(positionsTotalPnL)}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Box>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Paper sx={{
                            p: 2,
                            height: '100%',
                            borderRadius: 2,
                            boxShadow: theme.shadows[2],
                            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)}, ${alpha(theme.palette.primary.main, 0.05)})`,
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                            transition: 'transform 0.2s ease-in-out',
                            '&:hover': {
                                transform: 'translateY(-2px)'
                            }
                        }}>
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                    mb: 1
                                }}>
                                    Total Portfolio
                                    <Tooltip title="Your total portfolio value and performance">
                                        <InfoIcon fontSize="small" sx={{ ml: 0.5, fontSize: '0.875rem', color: 'text.secondary' }} />
                                    </Tooltip>
                                </Typography>
                                <Typography variant="h6" sx={{
                                    color: 'text.primary',
                                    fontWeight: 600,
                                    mb: 1.5
                                }}>
                                    Portfolio Summary
                                </Typography>
                                <Stack direction="row" spacing={2}>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            Today's Change
                                        </Typography>
                                        <Typography variant="body1" sx={{
                                            color: totalDayPnL >= 0 ? 'success.main' : 'error.main',
                                            fontWeight: 500,
                                            fontFamily: 'monospace'
                                        }}>
                                            {formatCurrency(totalDayPnL)}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            Overall P&L
                                        </Typography>
                                        <Typography variant="body1" sx={{
                                            color: totalPnL >= 0 ? 'success.main' : 'error.main',
                                            fontWeight: 500,
                                            fontFamily: 'monospace'
                                        }}>
                                            {formatCurrency(totalPnL)}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>

                {/* Tabs Section */}
                <Paper sx={{
                    borderRadius: 2,
                    boxShadow: theme.shadows[2],
                    overflow: 'hidden',
                    mb: 4
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
                    <Box sx={{ p: { xs: 2, sm: 3 }, minHeight: '300px' }}>
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