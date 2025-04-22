import React, { useState } from 'react';
import { Box, Typography, Container, Tabs, Tab, Stack, Chip, Grid, Button, Switch, FormControlLabel, Tooltip, Paper } from '@mui/material';
import { useZerodha } from '../context/ZerodhaContext';
import Header from '../components/Header/Header';
import Holdings from '../components/zerodha/Holdings';
import Positions from '../components/zerodha/Positions';
import Orders from '../components/zerodha/Orders';
import RefreshIcon from '@mui/icons-material/Refresh';
import InfoIcon from '@mui/icons-material/Info';

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
    const { holdings, positions, fetchData, loading, isAuth, isAutoSync, setIsAutoSync } = useZerodha();
    const [activeTab, setActiveTab] = useState(0);

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

    if (!isAuth) {
        return (
            <div>
                <Header />
                <Container maxWidth="md" sx={{ mt: 4 }}>
                    <Typography variant="h5" gutterBottom>
                        Please authenticate with Zerodha to view your portfolio
                    </Typography>
                </Container>
            </div>
        );
    }

    return (
        <div>
            <Header />
            <Box sx={{ width: '100%', p: 3 }}>
                <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                        <Typography variant="h4" color="success.main">Portfolio Overview</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
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
                        >
                            {loading ? 'Refreshing...' : 'Refresh Data'}
                        </Button>
                    </Box>
                </Box>

                {/* Portfolio Stats */}
                <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: 'background.paper' }}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
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
                                    />
                                    <Chip
                                        label={`Overall P&L: ${formatCurrency(holdingsPnL)}`}
                                        color={holdingsPnL >= 0 ? "success" : "error"}
                                        size="small"
                                    />
                                </Stack>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
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
                                    />
                                    <Chip
                                        label={`Total P&L: ${formatCurrency(positionsTotalPnL)}`}
                                        color={positionsTotalPnL >= 0 ? "success" : "error"}
                                        size="small"
                                    />
                                </Stack>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
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
                                    />
                                    <Chip
                                        label={`Net P&L: ${formatCurrency(totalPnL)}`}
                                        color={totalPnL >= 0 ? "success" : "error"}
                                        size="small"
                                    />
                                </Stack>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>

                {/* Tabs Section */}
                <Box sx={{ width: '100%', bgcolor: 'background.paper' }}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs value={activeTab} onChange={handleTabChange} aria-label="portfolio tabs">
                            <Tab label="Holdings" id="portfolio-tab-0" aria-controls="portfolio-tabpanel-0" />
                            <Tab label="Positions" id="portfolio-tab-1" aria-controls="portfolio-tabpanel-1" />
                            <Tab label="Orders" id="portfolio-tab-2" aria-controls="portfolio-tabpanel-2" />
                        </Tabs>
                    </Box>
                    <div
                        role="tabpanel"
                        hidden={activeTab !== 0}
                        id="portfolio-tabpanel-0"
                        aria-labelledby="portfolio-tab-0"
                        style={{ display: activeTab === 0 ? 'block' : 'none' }}
                    >
                        <Box sx={{ p: 3, minHeight: '300px' }}>
                            <Holdings />
                        </Box>
                    </div>
                    <div
                        role="tabpanel"
                        hidden={activeTab !== 1}
                        id="portfolio-tabpanel-1"
                        aria-labelledby="portfolio-tab-1"
                        style={{ display: activeTab === 1 ? 'block' : 'none' }}
                    >
                        <Box sx={{ p: 3, minHeight: '300px' }}>
                            <Positions />
                        </Box>
                    </div>
                    <div
                        role="tabpanel"
                        hidden={activeTab !== 2}
                        id="portfolio-tabpanel-2"
                        aria-labelledby="portfolio-tab-2"
                        style={{ display: activeTab === 2 ? 'block' : 'none' }}
                    >
                        <Box sx={{ p: 3, minHeight: '300px' }}>
                            <Orders />
                        </Box>
                    </div>
                </Box>
            </Box>
        </div>
    );
};

export default Portfolio; 