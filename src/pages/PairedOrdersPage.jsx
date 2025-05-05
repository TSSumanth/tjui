import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import OcoPairsTable from '../components/zerodha/OcoPairsTable';

export default function PairedOrdersPage() {
    return (
        <Container maxWidth="xl">
            <Box sx={{ my: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Paired Orders
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                    Manage your One-Cancels-Other (OCO) order pairs here. When one order is executed, the other will be automatically cancelled.
                </Typography>
                <OcoPairsTable />
            </Box>
        </Container>
    );
} 