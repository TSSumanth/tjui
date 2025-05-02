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
    Box,
    LinearProgress,
    Skeleton
} from '@mui/material';
import { useZerodha } from '../../context/ZerodhaContext';
import { formatCurrency } from '../../utils/formatters';

const Holdings = () => {
    const { holdings, loadingStates } = useZerodha();
    const isLoading = loadingStates.holdings;

    if (isLoading) {
        return (
            <Box>
                <Box sx={{ width: '100%', mb: 2 }}>
                    <LinearProgress />
                </Box>
                {[1, 2, 3].map((i) => (
                    <Box key={i} sx={{ mb: 1 }}>
                        <Skeleton variant="rectangular" height={40} />
                    </Box>
                ))}
            </Box>
        );
    }

    if (!holdings || holdings.length === 0) {
        return (
            <Typography variant="body1" color="text.secondary" align="center" py={4}>
                No holdings found
            </Typography>
        );
    }

    return (
        <TableContainer component={Paper} elevation={0}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Symbol</TableCell>
                        <TableCell align="right">Quantity</TableCell>
                        <TableCell align="right">Avg. Cost</TableCell>
                        <TableCell align="right">LTP</TableCell>
                        <TableCell align="right">Current Value</TableCell>
                        <TableCell align="right">P&L</TableCell>
                        <TableCell align="right">Day Change</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {holdings.map((holding) => {
                        const quantity = Number(holding.quantity) || 0;
                        const avgPrice = Number(holding.average_price) || 0;
                        const lastPrice = Number(holding.last_price) || 0;
                        const closePrice = Number(holding.close_price) || lastPrice;
                        const currentValue = quantity * lastPrice;
                        const investedValue = quantity * avgPrice;
                        const pnl = currentValue - investedValue;
                        const pnlPercentage = (pnl / investedValue) * 100;
                        const dayChange = (lastPrice - closePrice) * quantity;
                        const dayChangePercentage = ((lastPrice - closePrice) / closePrice) * 100;

                        return (
                            <TableRow key={holding.tradingsymbol}>
                                <TableCell component="th" scope="row">
                                    {holding.tradingsymbol}
                                </TableCell>
                                <TableCell align="right">{quantity}</TableCell>
                                <TableCell align="right">₹{formatCurrency(avgPrice)}</TableCell>
                                <TableCell align="right">₹{formatCurrency(lastPrice)}</TableCell>
                                <TableCell align="right">₹{formatCurrency(currentValue)}</TableCell>
                                <TableCell align="right">
                                    <Typography
                                        color={pnl >= 0 ? 'success.main' : 'error.main'}
                                    >
                                        ₹{formatCurrency(pnl)} ({pnlPercentage.toFixed(2)}%)
                                    </Typography>
                                </TableCell>
                                <TableCell align="right">
                                    <Typography
                                        color={dayChange >= 0 ? 'success.main' : 'error.main'}
                                    >
                                        ₹{formatCurrency(dayChange)} ({dayChangePercentage.toFixed(2)}%)
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default Holdings; 