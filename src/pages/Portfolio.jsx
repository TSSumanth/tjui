import React, { useState } from 'react';
import { Box, Typography, Container, Tabs, Tab, Stack, Chip, Grid, Card, CardContent, Button } from '@mui/material';
import { useZerodha } from '../context/ZerodhaContext';
import Header from '../components/Header/Header';
import Holdings from '../components/zerodha/Holdings';
import Positions from '../components/zerodha/Positions';
import RefreshIcon from '@mui/icons-material/Refresh';

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

const Portfolio = () => {
    console.log('=== PORTFOLIO COMPONENT MOUNTED ===');

    const { holdings, positions, fetchData, loading, error, isAuth } = useZerodha();
    const [activeTab, setActiveTab] = useState(0);

    // Add detailed debug logging
    console.log('Authentication Status:', {
        isAuth,
        accessToken: localStorage.getItem('zerodha_access_token'),
        publicToken: localStorage.getItem('zerodha_public_token')
    });
    console.log('Data Status:', {
        loading,
        error,
        holdingsCount: holdings?.length,
        positionsCount: positions?.length
    });

    // Calculate portfolio values
    const { totalInvestment, currentValue, totalPnL } = React.useMemo(() => {
        let totalInv = 0;
        let currValue = 0;

        // Calculate from holdings
        holdings?.forEach(holding => {
            const quantity = Number(holding.quantity) || 0;
            const avgPrice = Number(holding.average_price) || 0;
            const lastPrice = Number(holding.last_price) || 0;

            totalInv += quantity * avgPrice;
            currValue += quantity * lastPrice;
        });

        // Calculate from positions
        positions?.forEach(position => {
            const quantity = Number(position.quantity) || 0;
            const avgPrice = Number(position.average_price) || 0;
            const lastPrice = Number(position.last_price) || 0;

            if (quantity > 0) {
                totalInv += quantity * avgPrice;
                currValue += quantity * lastPrice;
            }
        });

        return {
            totalInvestment: totalInv,
            currentValue: currValue,
            totalPnL: currValue - totalInv
        };
    }, [holdings, positions]);

    // Calculate P/L components
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

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    return (
        <div>
            <Header />
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h4" color="success.main">Portfolio Overview</Typography>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={fetchData}
                        sx={{ ml: 2 }}
                    >
                        Refresh Data
                    </Button>
                </Box>

                {/* Portfolio Overview Cards */}
                <Box mb={4}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                            <Card elevation={1}>
                                <CardContent>
                                    <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                                        Total Investment
                                    </Typography>
                                    <Typography variant="h4" component="div">
                                        ₹{Math.abs(totalInvestment).toFixed(2)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Card elevation={1}>
                                <CardContent>
                                    <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                                        Current Value
                                    </Typography>
                                    <Typography variant="h4" component="div">
                                        ₹{Math.abs(currentValue).toFixed(2)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Card elevation={1}>
                                <CardContent>
                                    <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                                        Total P&L
                                    </Typography>
                                    <Typography
                                        variant="h4"
                                        component="div"
                                        color={totalPnL >= 0 ? "success.main" : "error.main"}
                                    >
                                        ₹{Math.abs(totalPnL).toFixed(2)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
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

                {/* Tabs Section */}
                <Box sx={{ width: '100%', mt: 4, bgcolor: 'background.paper' }}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs value={activeTab} onChange={handleTabChange} aria-label="portfolio tabs">
                            <Tab label="Holdings" id="portfolio-tab-0" aria-controls="portfolio-tabpanel-0" />
                            <Tab label="Positions" id="portfolio-tab-1" aria-controls="portfolio-tabpanel-1" />
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
                </Box>
            </Container>
        </div>
    );
};

export default Portfolio; 