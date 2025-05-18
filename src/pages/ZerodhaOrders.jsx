import React, { useState, useEffect } from 'react';
import {
    Box,
    CircularProgress,
    Button,
    Snackbar,
    Alert
} from '@mui/material';
import Orders from '../components/zerodhaorders/Orders';
import ZerodhaSubHeader from '../components/zerodha/ZerodhaSubHeader';
import { getOrders } from '../services/zerodha/api';
import RefreshIcon from '@mui/icons-material/Refresh';

const ZerodhaOrders = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'error'
    });
    const [orders, setOrders] = useState([]);

    const fetchOrders = async () => {
        try {
            setIsLoading(true);
            const response = await getOrders();
            setOrders(response.data || []);
            throw new Error('test');
        } catch (err) {
            console.error('Error fetching orders:', err);
            setSnackbar({
                open: true,
                message: 'Failed to fetch orders. Please try again.',
                severity: 'error'
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Only fetch orders on initial mount
    useEffect(() => {
        fetchOrders();
    }, []);

    const handleRefresh = () => {
        fetchOrders();
    };

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    return (
        <>
            <ZerodhaSubHeader />
            <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<RefreshIcon />}
                        onClick={handleRefresh}
                        disabled={isLoading}
                        size="small"
                        sx={{
                            borderRadius: 1.5,
                            textTransform: 'none',
                            px: 1.5,
                            py: 0.5
                        }}
                    >
                        {isLoading ? 'Refreshing...' : 'Refresh'}
                    </Button>
                </Box>
                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Orders orders={orders} onRefresh={fetchOrders} />
                )}
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={3000}
                    onClose={handleCloseSnackbar}
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                    <Alert
                        onClose={handleCloseSnackbar}
                        severity={snackbar.severity}
                        sx={{ width: '100%' }}
                        variant="filled"
                    >
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Box>
        </>
    );
};

export default ZerodhaOrders; 