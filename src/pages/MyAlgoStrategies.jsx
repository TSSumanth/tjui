import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import Header from '../components/Header/Header';

const MyAlgoStrategiesPage = () => {
    return (
        <Box>
            <Header />
            <Container>
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