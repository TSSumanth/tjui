import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Grid, Paper, Button, Stack, CircularProgress } from '@mui/material';
import StrategyHeader from '../components/Strategies/StrategiesHeader'
import StrategyCards from '../components/Strategies/StrategyCard'

const StrategyPage = () => {
    return (
        <Stack sx={{ width: '100%' }}>
            <Box sx={{
                bgcolor: 'background.paper',
                py: 3,
                borderBottom: '1px solid',
                borderColor: 'divider',
                width: '100%'
            }}>
                <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <StrategyHeader />
                    </Box>
                </Container>
            </Box>
            <Box sx={{ width: '100%', bgcolor: 'background.default' }}>
                <Container maxWidth={false} sx={{ py: 4, px: { xs: 2, sm: 3, md: 4 } }}>
                    <StrategyCards />
                </Container>
            </Box>
        </Stack>
    );
};

export default StrategyPage;