import React from 'react';
import { Box, Container } from '@mui/material';
import ZerodhaSubHeader from '../components/zerodha/ZerodhaSubHeader';
import ZerodhaWebSocketSubscription from '../components/zerodha/ZerodhaWebSocketSubscription';

const MyAlgoStrategiesPage = () => {
    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
            <ZerodhaSubHeader />
            <Container>
                <ZerodhaWebSocketSubscription />
            </Container>
        </Box>
    );
};

export default MyAlgoStrategiesPage; 