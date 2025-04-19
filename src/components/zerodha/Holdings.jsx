import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    CircularProgress,
    Alert,
    Box,
    Chip,
    Stack
} from '@mui/material';
import { useZerodha } from '../../context/ZerodhaContext';

const Holdings = () => {
    const { holdings, loading, error } = useZerodha();

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

    const formatPercentage = (value) => {
        if (typeof value !== 'number' || isNaN(value)) {
            return '0.00%';
        }
        return `${value.toFixed(2)}%`;
    };

    const calculateDayPnL = (holding) => {
        const lastPrice = Number(holding.last_price) || 0;
        const prevClose = Number(holding.previous_close) || lastPrice;
        const quantity = Number(holding.quantity) || 0;
        return (lastPrice - prevClose) * quantity;
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ mb: 2 }}>
                {error}
            </Alert>
        );
    }

    if (!holdings.length) {
        return (
            <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="h5" component="h2" gutterBottom>
                    Stock Holdings
                </Typography>
                <Typography variant="body1" color="textSecondary">
                    No holdings found.
                </Typography>
            </Box>
        );
    }

    const totalPnL = holdings.reduce((sum, holding) => {
        const pnl = Number(holding.pnl) || 0;
        return sum + pnl;
    }, 0);

    const dayPnL = holdings.reduce((sum, holding) => {
        const dayChange = calculateDayPnL(holding);
        return sum + dayChange;
    }, 0);

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" component="h2">
                    Stock Holdings
                </Typography>
                <Stack direction="row" spacing={2}>
                    <Chip
                        label={`Day's P&L: ${formatCurrency(dayPnL)}`}
                        color={dayPnL >= 0 ? "success" : "error"}
                        sx={{ fontWeight: 'bold' }}
                    />
                    <Chip
                        label={`Total P&L: ${formatCurrency(totalPnL)}`}
                        color={totalPnL >= 0 ? "success" : "error"}
                        sx={{ fontWeight: 'bold' }}
                    />
                </Stack>
            </Box>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Symbol</TableCell>
                            <TableCell align="right">Quantity</TableCell>
                            <TableCell align="right">Avg. Cost</TableCell>
                            <TableCell align="right">LTP</TableCell>
                            <TableCell align="right">Current Value</TableCell>
                            <TableCell align="right">Day's P&L</TableCell>
                            <TableCell align="right">Total P&L</TableCell>
                            <TableCell align="right">Day Change %</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {holdings.map((holding) => {
                            const dayPnL = calculateDayPnL(holding);
                            return (
                                <TableRow key={holding.tradingsymbol}>
                                    <TableCell component="th" scope="row">
                                        {holding.tradingsymbol}
                                    </TableCell>
                                    <TableCell align="right">{holding.quantity}</TableCell>
                                    <TableCell align="right">
                                        {formatCurrency(Number(holding.average_price))}
                                    </TableCell>
                                    <TableCell align="right">
                                        {formatCurrency(Number(holding.last_price))}
                                    </TableCell>
                                    <TableCell align="right">
                                        {formatCurrency(Number(holding.quantity) * Number(holding.last_price))}
                                    </TableCell>
                                    <TableCell
                                        align="right"
                                        sx={{
                                            color: dayPnL >= 0 ? 'success.main' : 'error.main',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        {formatCurrency(dayPnL)}
                                    </TableCell>
                                    <TableCell
                                        align="right"
                                        sx={{
                                            color: Number(holding.pnl) >= 0 ? 'success.main' : 'error.main',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        {formatCurrency(Number(holding.pnl))}
                                    </TableCell>
                                    <TableCell
                                        align="right"
                                        sx={{
                                            color: Number(holding.day_change_percentage) >= 0
                                                ? 'success.main'
                                                : 'error.main',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        {formatPercentage(Number(holding.day_change_percentage))}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default Holdings; 