import React, { useState } from 'react';
import { Container, Typography, Box, Button } from '@mui/material';
import PairedOrdersTable from '../components/zerodha/PairedOrdersTable';
import ZerodhaSubHeader from '../components/zerodha/ZerodhaSubHeader';
import OcoOrderDialog from '../components/zerodha/OcoOrderDialog';
import CreateOAOOrder from '../components/zerodha/CreateOAOOrder';
import { useZerodha } from '../context/ZerodhaContext';

export default function PairedOrdersPage() {
    const [isOCODialogOpen, setIsOCODialogOpen] = useState(false);
    const [isOAODialogOpen, setIsOAODialogOpen] = useState(false);
    const { orders } = useZerodha();

    return (
        <>
            <ZerodhaSubHeader />
            <Container maxWidth="xl">
                <Box sx={{ my: 4 }}>
                    <Typography variant="body1" color="text.secondary" paragraph>
                        Manage your One-Cancels-Other (OCO) and One-After-Other (OAO) order pairs here.
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
                    <PairedOrdersTable />
                </Box>
                <OcoOrderDialog
                    open={isOCODialogOpen}
                    onClose={() => setIsOCODialogOpen(false)}
                    orders={orders ? orders.filter(order => order.status === 'OPEN') : []}
                />
                <CreateOAOOrder
                    open={isOAODialogOpen}
                    onClose={() => setIsOAODialogOpen(false)}
                />
            </Container>
        </>
    );
} 