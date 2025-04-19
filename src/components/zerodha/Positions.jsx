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

const Positions = () => {
    const { positions, loading, error } = useZerodha();

    // Debug log to see position data structure
    React.useEffect(() => {
        if (positions && positions.length > 0) {
            console.log('Position data structure:', positions[0]);
        }
    }, [positions]);

    const formatCurrency = (value) => {
        if (value === null || value === undefined || isNaN(value)) {
            return '₹0.00';
        }
        return `₹${Number(value).toFixed(2)}`;
    };

    const formatPercentage = (value) => {
        if (value === null || value === undefined || isNaN(value)) {
            return '0.00%';
        }
        return `${Number(value).toFixed(2)}%`;
    };

    const calculateDayPnL = (position) => {
        // Use day_m2m for day's P&L
        return Number(position.day_m2m) || 0;
    };

    const calculateTotalPnL = (position) => {
        // Use pnl (Profit and Loss) value directly from the API
        return Number(position.pnl) || 0;
    };

    const calculateChangePercentage = (position) => {
        const { last_price, close_price } = position;
        if (!last_price || !close_price || close_price === 0) return 0;

        return ((last_price - close_price) / close_price) * 100;
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

    if (!positions || !positions.length) {
        return (
            <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="h5" component="h2" gutterBottom>
                    Open Positions
                </Typography>
                <Typography variant="body1" color="textSecondary">
                    No open positions found.
                </Typography>
            </Box>
        );
    }

    const totalPnL = positions.reduce((sum, pos) => {
        const pnl = calculateTotalPnL(pos);
        return sum + (isNaN(pnl) ? 0 : pnl);
    }, 0);

    const dayPnL = positions.reduce((sum, pos) => {
        const dayPnl = calculateDayPnL(pos);
        return sum + (isNaN(dayPnl) ? 0 : dayPnl);
    }, 0);

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" component="h2">
                    Open Positions
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
                            <TableCell align="right">Avg. Price</TableCell>
                            <TableCell align="right">LTP</TableCell>
                            <TableCell align="right">Current Value</TableCell>
                            <TableCell align="right">Day's P&L</TableCell>
                            <TableCell align="right">Total P&L</TableCell>
                            <TableCell align="right">Change %</TableCell>
                            <TableCell align="right">Product</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {positions.map((position) => {
                            // Log each position's P&L related fields
                            console.log(`P&L fields for ${position.tradingsymbol}:`, {
                                m2m: position.m2m,
                                pnl: position.pnl
                            });

                            const dayPnL = calculateDayPnL(position);
                            const totalPnL = calculateTotalPnL(position);
                            const changePercentage = calculateChangePercentage(position);
                            const currentValue = Math.abs(position.quantity * position.last_price) || 0;

                            return (
                                <TableRow
                                    key={`${position.tradingsymbol}-${position.product}`}
                                    sx={{
                                        backgroundColor: Number(position.quantity) < 0 ? 'error.lighter' : 'inherit'
                                    }}
                                >
                                    <TableCell component="th" scope="row">
                                        {position.tradingsymbol}
                                    </TableCell>
                                    <TableCell align="right" sx={{
                                        color: Number(position.quantity) < 0 ? 'error.main' : 'inherit',
                                        fontWeight: 'bold'
                                    }}>
                                        {position.quantity || 0}
                                    </TableCell>
                                    <TableCell align="right">
                                        {formatCurrency(position.average_price)}
                                    </TableCell>
                                    <TableCell align="right">
                                        {formatCurrency(position.last_price)}
                                    </TableCell>
                                    <TableCell align="right">
                                        {formatCurrency(currentValue)}
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
                                            color: totalPnL >= 0 ? 'success.main' : 'error.main',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        {formatCurrency(totalPnL)}
                                    </TableCell>
                                    <TableCell
                                        align="right"
                                        sx={{
                                            color: changePercentage >= 0 ? 'success.main' : 'error.main',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        {formatPercentage(changePercentage)}
                                    </TableCell>
                                    <TableCell align="right">
                                        <Chip
                                            label={position.product}
                                            size="small"
                                            color={position.product === 'MIS' ? 'warning' : 'default'}
                                        />
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

export default Positions; 