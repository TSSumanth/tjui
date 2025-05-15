import React, { useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Paper,
    CircularProgress,
    Button,
    Stack,
} from '@mui/material';
import Orders from '../components/zerodhaorders/Orders';
import ZerodhaSubHeader from '../components/zerodha/ZerodhaSubHeader';
import { useZerodha } from '../context/ZerodhaContext';
import RefreshIcon from '@mui/icons-material/Refresh';

const ZerodhaOrders = () => {
    const { fetchOrders, loadingStates } = useZerodha();

    // Only fetch orders on initial mount
    useEffect(() => {
        fetchOrders();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleRefresh = () => {
        fetchOrders();
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
                        disabled={loadingStates.orders}
                        size="small"
                        sx={{
                            borderRadius: 1.5,
                            textTransform: 'none',
                            px: 1.5,
                            py: 0.5
                        }}
                    >
                        {loadingStates.orders ? 'Refreshing...' : 'Refresh'}
                    </Button>
                </Box>
                {loadingStates.orders ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Orders />
                )}
            </Box>
        </>
    );
};

export default ZerodhaOrders; 