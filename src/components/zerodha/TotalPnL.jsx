import React from 'react';
import { Box, Typography, Paper, Stack, CircularProgress } from '@mui/material';
import { useZerodha } from '../../context/ZerodhaContext';

const TotalPnL = () => {
    const { pnl, loading, error } = useZerodha();

    const formatCurrency = (value) => {
        if (value === null || value === undefined || isNaN(value)) {
            return '₹0.00';
        }
        return `₹${Number(value).toFixed(2)}`;
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" p={2}>
                <CircularProgress size={24} />
            </Box>
        );
    }

    if (error) {
        return (
            <Box p={2}>
                <Typography color="error">{error}</Typography>
            </Box>
        );
    }

    // Ensure pnl object exists and has required properties
    const dayPnL = pnl?.dayPnL || 0;
    const overallPnL = pnl?.overallPnL || 0;

    return (
        <Paper elevation={3} sx={{ p: 2, bgcolor: 'background.paper' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                    Total Portfolio P&L
                </Typography>
                <Stack direction="row" spacing={3}>
                    <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Day's P&L
                        </Typography>
                        <Typography
                            variant="h6"
                            sx={{
                                color: dayPnL >= 0 ? 'success.main' : 'error.main',
                                fontWeight: 'bold'
                            }}
                        >
                            {formatCurrency(dayPnL)}
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Overall P&L
                        </Typography>
                        <Typography
                            variant="h6"
                            sx={{
                                color: overallPnL >= 0 ? 'success.main' : 'error.main',
                                fontWeight: 'bold'
                            }}
                        >
                            {formatCurrency(overallPnL)}
                        </Typography>
                    </Box>
                </Stack>
            </Box>
            <Typography variant="body1" color="textSecondary" align="center">
                No data available. Click &#39;Get PnL&#39; to load data.
            </Typography>
        </Paper>
    );
};

export default TotalPnL; 