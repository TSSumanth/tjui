import React from 'react';
import { Box, Container } from '@mui/material';
import TradingInstrumentsComponent from '../components/zerodha/TradingInstruments';
import ZerodhaSubHeader from '../components/zerodha/ZerodhaSubHeader';

const TradingInstrumentsPage = () => {
    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
            <ZerodhaSubHeader />
            <Container maxWidth={false} sx={{ mt: 4, px: 4 }}>
                <TradingInstrumentsComponent />
            </Container>
        </Box>
    );
};

export default TradingInstrumentsPage; 