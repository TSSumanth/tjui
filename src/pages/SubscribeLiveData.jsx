import React from 'react';
import { Box, Container } from '@mui/material';
import ZerodhaSubHeader from '../components/zerodha/ZerodhaSubHeader';
import WebSocketDataDisplay from '../components/zerodhawebsocket/WebSocketDataDisplay';

const SubscribeLiveDataPage = () => {
    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
            <ZerodhaSubHeader />
            <Container maxWidth={false} sx={{ mt: 2, px: 4 }}>
                <WebSocketDataDisplay />
            </Container>
        </Box>
    );
};

export default SubscribeLiveDataPage; 