import React from 'react';
import { Box, Typography, Container } from '@mui/material';
import ZerodhaSubHeader from '../components/zerodha/ZerodhaSubHeader';
import ZerodhaWebSocketSubscription from '../components/zerodhawebsocket/ZerodhaWebSocketSubscription';

const SubscribeLiveDataPage = () => {
    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
            <ZerodhaSubHeader />
            <Container maxWidth={false} sx={{ mt: 2, px: 4 }}>
                <Typography variant="h5" fontWeight={700} sx={{ mb: 2, color: '#1a237e', textAlign: 'left' }}>
                    Subscribe Live Data
                </Typography>
                <ZerodhaWebSocketSubscription />
            </Container>
        </Box>
    );
};

export default SubscribeLiveDataPage; 