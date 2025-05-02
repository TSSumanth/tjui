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
import Orders from '../components/zerodha/Orders';
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
            <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
                <Container maxWidth={false} sx={{ py: 4, px: { xs: 2, sm: 3, md: 4 } }}>
                    <Paper sx={{ p: 3, borderRadius: 2 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                            <Typography variant="h5">
                                Orders
                            </Typography>
                            <Button
                                variant="outlined"
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
                        </Stack>
                        {loadingStates.orders ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <Orders />
                        )}
                    </Paper>
                </Container>
            </Box>
        </>
    );
};

export default ZerodhaOrders; 