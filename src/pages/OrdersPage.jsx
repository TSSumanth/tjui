import React, { useState } from 'react';
import { Container, Box, Typography, Button } from '@mui/material';
import OrdersTable from '../components/zerodha/OrdersTable';
import CreateOCOOrder from '../components/zerodha/CreateOCOOrder';
import CreateOAOOrder from '../components/zerodha/CreateOAOOrder';

export default function OrdersPage() {
    const [isOCODialogOpen, setIsOCODialogOpen] = useState(false);
    const [isOAODialogOpen, setIsOAODialogOpen] = useState(false);

    return (
        <Container maxWidth="xl">
            <Box sx={{ my: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Orders
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                    View and manage your orders here.
                </Typography>
                <div style={{ marginBottom: '20px' }}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => setIsOCODialogOpen(true)}
                        style={{ marginRight: '10px' }}
                    >
                        Create OCO Order
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => setIsOAODialogOpen(true)}
                    >
                        Create OAO Order
                    </Button>
                </div>
                <OrdersTable />
            </Box>
            <CreateOCOOrder
                open={isOCODialogOpen}
                onClose={() => setIsOCODialogOpen(false)}
            />
            <CreateOAOOrder
                open={isOAODialogOpen}
                onClose={() => setIsOAODialogOpen(false)}
            />
        </Container>
    );
} 