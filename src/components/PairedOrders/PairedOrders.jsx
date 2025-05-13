import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Box,
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Snackbar,
    Alert,
    Tabs,
    Tab
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useZerodha } from '../../context/ZerodhaContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import OcoOrderDialog from './OcoOrderDialog';
import CreateOAOOrder from './CreateOAOOrder';
import SOCreateDialog from './SOCreateDialog';
import { getOrderPairs, getCompletedOrderPairs } from '../../services/zerodha/oco';

function TabPanel({ children, value, index }) {
    return (
        <div hidden={value !== index} style={{ padding: '20px 0' }}>
            {value === index && children}
        </div>
    );
}

export default function PairedOrders() {
    const [tabValue, setTabValue] = useState(0);
    const [ocoDialogOpen, setOcoDialogOpen] = useState(false);
    const [oaoDialogOpen, setOaoDialogOpen] = useState(false);
    const [soDialogOpen, setSoDialogOpen] = useState(false);
    const [orderPairs, setOrderPairs] = useState([]);
    const [completedOrderPairs, setCompletedOrderPairs] = useState([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const { fetchOrders } = useZerodha();

    const fetchOrderPairs = async () => {
        try {
            const [activePairs, completedPairs] = await Promise.all([
                getOrderPairs(),
                getCompletedOrderPairs()
            ]);
            setOrderPairs(activePairs);
            setCompletedOrderPairs(completedPairs);
        } catch (error) {
            console.error('Error fetching order pairs:', error);
            setSnackbar({
                open: true,
                message: 'Failed to fetch order pairs',
                severity: 'error'
            });
        }
    };

    useEffect(() => {
        fetchOrderPairs();
    }, []);

    const handleRefresh = async () => {
        await Promise.all([fetchOrders(), fetchOrderPairs()]);
        setSnackbar({
            open: true,
            message: 'Orders refreshed successfully',
            severity: 'success'
        });
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    return (
        <Container maxWidth="xl">
            <Box sx={{ my: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Paired Orders
                </Typography>

                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={tabValue} onChange={handleTabChange}>
                        <Tab label="Active Orders" />
                        <Tab label="Completed Orders" />
                    </Tabs>
                </Box>

                {/* Active Orders Tab */}
                <TabPanel value={tabValue} index={0}>
                    {/* OCO Orders Section */}
                    <Box sx={{ mb: 4 }}>
                        <Paper elevation={3} sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h5" component="h2">
                                    One Cancels Other (OCO) Orders
                                </Typography>
                                <Box>
                                    <IconButton onClick={handleRefresh} sx={{ mr: 1 }}>
                                        <RefreshIcon />
                                    </IconButton>
                                    <Button
                                        variant="contained"
                                        startIcon={<AddIcon />}
                                        onClick={() => setOcoDialogOpen(true)}
                                    >
                                        Create OCO
                                    </Button>
                                </Box>
                            </Box>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Order 1</TableCell>
                                            <TableCell>Order 2</TableCell>
                                            <TableCell>Status</TableCell>
                                            <TableCell>Created At</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {orderPairs
                                            .filter(pair => pair.type === 'OCO')
                                            .map((pair) => (
                                                <TableRow key={pair.id}>
                                                    <TableCell>
                                                        <Box>
                                                            <Typography variant="body2">
                                                                {pair.order1_details.tradingsymbol}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {pair.order1_details.transaction_type} @ {formatCurrency(pair.order1_details.price)}
                                                            </Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box>
                                                            <Typography variant="body2">
                                                                {pair.order2_details.tradingsymbol}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {pair.order2_details.transaction_type} @ {formatCurrency(pair.order2_details.price)}
                                                            </Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={pair.status}
                                                            color={pair.status === 'COMPLETED' ? 'success' : 'default'}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell>{formatDate(pair.created_at)}</TableCell>
                                                </TableRow>
                                            ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </Box>

                    {/* OAO Orders Section */}
                    <Box sx={{ mb: 4 }}>
                        <Paper elevation={3} sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h5" component="h2">
                                    One After Other (OAO) Orders
                                </Typography>
                                <Box>
                                    <IconButton onClick={handleRefresh} sx={{ mr: 1 }}>
                                        <RefreshIcon />
                                    </IconButton>
                                    <Button
                                        variant="contained"
                                        startIcon={<AddIcon />}
                                        onClick={() => setOaoDialogOpen(true)}
                                    >
                                        Create OAO
                                    </Button>
                                </Box>
                            </Box>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Order 1</TableCell>
                                            <TableCell>Order 2</TableCell>
                                            <TableCell>Status</TableCell>
                                            <TableCell>Created At</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {orderPairs
                                            .filter(pair => pair.type === 'OAO')
                                            .map((pair) => (
                                                <TableRow key={pair.id}>
                                                    <TableCell>
                                                        <Box>
                                                            <Typography variant="body2">
                                                                {pair.order1_details.tradingsymbol}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {pair.order1_details.transaction_type} @ {formatCurrency(pair.order1_details.price)}
                                                            </Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box>
                                                            <Typography variant="body2">
                                                                {pair.order2_details.tradingsymbol}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {pair.order2_details.transaction_type} @ {formatCurrency(pair.order2_details.price)}
                                                            </Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={pair.status}
                                                            color={pair.status === 'COMPLETED' ? 'success' : 'default'}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell>{formatDate(pair.created_at)}</TableCell>
                                                </TableRow>
                                            ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </Box>

                    {/* Saved Orders Section */}
                    <Box sx={{ mb: 4 }}>
                        <Paper elevation={3} sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h5" component="h2">
                                    Saved Orders
                                </Typography>
                                <Box>
                                    <IconButton onClick={handleRefresh} sx={{ mr: 1 }}>
                                        <RefreshIcon />
                                    </IconButton>
                                    <Button
                                        variant="contained"
                                        startIcon={<AddIcon />}
                                        onClick={() => setSoDialogOpen(true)}
                                    >
                                        Create Saved Order
                                    </Button>
                                </Box>
                            </Box>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Symbol</TableCell>
                                            <TableCell>Type</TableCell>
                                            <TableCell>Price</TableCell>
                                            <TableCell>Status</TableCell>
                                            <TableCell>Created At</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {orderPairs
                                            .filter(pair => pair.type === 'SAVED')
                                            .map((pair) => (
                                                <TableRow key={pair.id}>
                                                    <TableCell>{pair.order1_details.tradingsymbol}</TableCell>
                                                    <TableCell>{pair.order1_details.order_type}</TableCell>
                                                    <TableCell>{formatCurrency(pair.order1_details.price)}</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={pair.status}
                                                            color={pair.status === 'COMPLETED' ? 'success' : 'default'}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell>{formatDate(pair.created_at)}</TableCell>
                                                </TableRow>
                                            ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </Box>
                </TabPanel>

                {/* Completed Orders Tab */}
                <TabPanel value={tabValue} index={1}>
                    <Box sx={{ mb: 4 }}>
                        <Paper elevation={3} sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h5" component="h2">
                                    Completed Orders
                                </Typography>
                                <IconButton onClick={handleRefresh}>
                                    <RefreshIcon />
                                </IconButton>
                            </Box>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Type</TableCell>
                                            <TableCell>Order 1</TableCell>
                                            <TableCell>Order 2</TableCell>
                                            <TableCell>Status</TableCell>
                                            <TableCell>Created At</TableCell>
                                            <TableCell>Completed At</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {completedOrderPairs
                                            .filter(pair => pair.type === 'OCO' || pair.type === 'OAO')
                                            .map((pair) => (
                                                <TableRow key={pair.id}>
                                                    <TableCell>
                                                        <Chip
                                                            label={pair.type}
                                                            color={pair.type === 'OCO' ? 'primary' : 'secondary'}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box>
                                                            <Typography variant="body2">
                                                                {pair.order1_details.tradingsymbol}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {pair.order1_details.transaction_type} @ {formatCurrency(pair.order1_details.price)}
                                                            </Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box>
                                                            <Typography variant="body2">
                                                                {pair.order2_details.tradingsymbol}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {pair.order2_details.transaction_type} @ {formatCurrency(pair.order2_details.price)}
                                                            </Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={pair.status}
                                                            color={pair.status === 'COMPLETED' ? 'success' : 'default'}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell>{formatDate(pair.created_at)}</TableCell>
                                                    <TableCell>{pair.completed_at ? formatDate(pair.completed_at) : '-'}</TableCell>
                                                </TableRow>
                                            ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </Box>
                </TabPanel>
            </Box>

            {/* Dialogs */}
            <OcoOrderDialog
                open={ocoDialogOpen}
                onClose={() => setOcoDialogOpen(false)}
                onSuccess={() => {
                    setOcoDialogOpen(false);
                    fetchOrderPairs();
                    setSnackbar({
                        open: true,
                        message: 'OCO order pair created successfully',
                        severity: 'success'
                    });
                }}
            />

            <CreateOAOOrder
                open={oaoDialogOpen}
                onClose={() => setOaoDialogOpen(false)}
                onSuccess={() => {
                    setOaoDialogOpen(false);
                    fetchOrderPairs();
                    setSnackbar({
                        open: true,
                        message: 'OAO order pair created successfully',
                        severity: 'success'
                    });
                }}
            />

            <SOCreateDialog
                open={soDialogOpen}
                onClose={() => setSoDialogOpen(false)}
                onSuccess={() => {
                    setSoDialogOpen(false);
                    fetchOrderPairs();
                    setSnackbar({
                        open: true,
                        message: 'Saved order created successfully',
                        severity: 'success'
                    });
                }}
            />

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
} 