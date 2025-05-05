import React from 'react';
import { Box, Typography, Container, Grid, Card, CardContent, Stack, Chip, Button, CircularProgress } from '@mui/material';
import { useZerodha } from '../context/ZerodhaContext';
import Holdings from '../components/zerodha/Holdings';
import Positions from '../components/zerodha/Positions';
import useScrollToTop from '../hooks/useScrollToTop';

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

const PortfolioDetailsPage = () => {
    const { holdings, positions, fetchData, loading, error, isAutoSync } = useZerodha();
    useScrollToTop();

    // Calculate P&L components
    const { holdingsPnL, positionsPnL, holdingsDayPnL, positionsDayPnL, totalPnL, totalDayPnL } = React.useMemo(() => {
        let holdingsPnL = 0;
        let holdingsDayPnL = 0;
        let positionsPnL = 0;
        let positionsDayPnL = 0;

        // Calculate holdings P&L
        holdings?.forEach(holding => {
            holdingsPnL += Number(holding.pnl) || 0;
            const lastPrice = Number(holding.last_price) || 0;
            const prevClose = Number(holding.previous_close) || lastPrice;
            const quantity = Number(holding.quantity) || 0;
            holdingsDayPnL += (lastPrice - prevClose) * quantity;
        });

        // Calculate positions P&L
        positions?.forEach(position => {
            positionsPnL += Number(position.pnl) || 0;
            positionsDayPnL += Number(position.day_m2m) || 0;
        });

        return {
            holdingsPnL,
            positionsPnL,
            holdingsDayPnL,
            positionsDayPnL,
            totalPnL: holdingsPnL + positionsPnL,
            totalDayPnL: holdingsDayPnL + positionsDayPnL
        };
    }, [holdings, positions]);

    return (
        <div>
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                {/* Header with Sync Status */}
                <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h4" color="success.main">Portfolio Overview</Typography>
                    <Stack direction="row" spacing={2}>
                        <Chip
                            label={isAutoSync ? "Auto-sync ON" : "Auto-sync OFF"}
                            color={isAutoSync ? "success" : "default"}
                            size="small"
                            sx={{ height: '32px' }}
                        />
                        <Button
                            variant="outlined"
                            onClick={fetchData}
                            disabled={loading}
                            startIcon={loading && <CircularProgress size={20} />}
                            title={isAutoSync ? "Auto-sync is active during market hours (9:00 AM - 3:30 PM, Mon-Fri)" : "Click to manually sync data"}
                        >
                            {loading ? 'Refreshing...' : 'Sync Data'}
                        </Button>
                    </Stack>
                </Box>

                {error && (
                    <Box mb={3}>
                        <Typography color="error">{error}</Typography>
                    </Box>
                )}

                {/* P&L Summary Cards */}
                <Box mb={4}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                            <Card elevation={1}>
                                <CardContent>
                                    <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                                        Holdings P&L
                                    </Typography>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Day Change
                                        </Typography>
                                        <Typography
                                            variant="h6"
                                            color={holdingsDayPnL >= 0 ? "success.main" : "error.main"}
                                        >
                                            {formatCurrency(holdingsDayPnL)}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Total
                                        </Typography>
                                        <Typography
                                            variant="h6"
                                            color={holdingsPnL >= 0 ? "success.main" : "error.main"}
                                        >
                                            {formatCurrency(holdingsPnL)}
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Card elevation={1}>
                                <CardContent>
                                    <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                                        Positions P&L
                                    </Typography>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Day Change
                                        </Typography>
                                        <Typography
                                            variant="h6"
                                            color={positionsDayPnL >= 0 ? "success.main" : "error.main"}
                                        >
                                            {formatCurrency(positionsDayPnL)}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Total
                                        </Typography>
                                        <Typography
                                            variant="h6"
                                            color={positionsPnL >= 0 ? "success.main" : "error.main"}
                                        >
                                            {formatCurrency(positionsPnL)}
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Card elevation={1}>
                                <CardContent>
                                    <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                                        Total P&L
                                    </Typography>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Day Change
                                        </Typography>
                                        <Typography
                                            variant="h6"
                                            color={totalDayPnL >= 0 ? "success.main" : "error.main"}
                                        >
                                            {formatCurrency(totalDayPnL)}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Total
                                        </Typography>
                                        <Typography
                                            variant="h6"
                                            color={totalPnL >= 0 ? "success.main" : "error.main"}
                                        >
                                            {formatCurrency(totalPnL)}
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Box>

                {/* Holdings Section */}
                <Box mb={4}>
                    <Typography variant="h5" gutterBottom color="text.primary" sx={{ mb: 2 }}>
                        Holdings
                    </Typography>
                            <Holdings />
                        </Box>

                {/* Positions Section */}
                <Box mb={4}>
                    <Typography variant="h5" gutterBottom color="text.primary" sx={{ mb: 2 }}>
                        Positions
                    </Typography>
                            <Positions />
                </Box>
            </Container>
        </div>
    );
};

export default PortfolioDetailsPage; 