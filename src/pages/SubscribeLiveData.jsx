import React from 'react';
import { Box, Typography, Container } from '@mui/material';
import ZerodhaSubHeader from '../components/zerodha/ZerodhaSubHeader';
import ZerodhaWebSocketSubscription from '../components/zerodhawebsocket/ZerodhaWebSocketSubscription';

const SubscribeLiveDataPage = () => {
    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
            <ZerodhaSubHeader />
            <Container maxWidth={false} sx={{ mt: 2, px: 4 }}>
                <ZerodhaWebSocketSubscription />
            </Container>
        </Box>
    );
};

export default SubscribeLiveDataPage; 