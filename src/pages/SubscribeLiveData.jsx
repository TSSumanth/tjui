import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import ZerodhaSubHeader from '../components/zerodha/ZerodhaSubHeader';
import ZerodhaWebSocketSubscription from '../components/zerodha/ZerodhaWebSocketSubscription';

const SubscribeLiveDataPage = () => {
    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
            <ZerodhaSubHeader />
            <Container>
                <ZerodhaWebSocketSubscription />
            </Container>
        </Box>
    );
};

export default SubscribeLiveDataPage; 