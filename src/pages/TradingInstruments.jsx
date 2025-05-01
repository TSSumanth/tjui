import React from 'react';
import { Box, Container,  Button, } from '@mui/material';
import {  useNavigate } from 'react-router-dom';
import TradingInstrumentsComponent from '../components/zerodha/TradingInstruments';

const TradingInstrumentsPage = () => {
    const navigate = useNavigate();

    return (
        <div>
            <Container maxWidth={false} sx={{ mt: 4, px: 4 }}>
                <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
                    <Button
                        variant="outlined"
                        onClick={() => navigate('/zerodha/accountdetails')}
                    >
                        ← Back to Account
                    </Button>
                </Box>
                <TradingInstrumentsComponent />
            </Container>
        </div>
    );
};

export default TradingInstrumentsPage; 