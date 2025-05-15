import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import ZerodhaSubHeader from '../components/zerodha/ZerodhaSubHeader';
import ZerodhaWebSocketSubscription from '../components/zerodha/ZerodhaWebSocketSubscription';

const MyAlgoStrategiesPage = () => {
    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
            <ZerodhaSubHeader />
            <Container>
                <ZerodhaWebSocketSubscription />
                <Box sx={{
                    mt: 4,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '400px'
                }}>
                    <Typography variant="h5" color="text.secondary">
                        Functionality will be available soon
                    </Typography>
                </Box>
            </Container>
        </Box>
    );
};

export default MyAlgoStrategiesPage; 