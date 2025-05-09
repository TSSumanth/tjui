import React, { useContext, useEffect, useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    Chip,
    Typography,
    Divider,
    CircularProgress,
    Alert,
    Snackbar
} from '@mui/material';
import { useZerodha } from '../../context/ZerodhaContext';
import { deleteOaoOrderPair } from '../../services/zerodha/oao';
import { deleteOrderPair } from '../../services/zerodha/oco';

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString();
}

function isToday(dateStr) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

export default function PairedOrdersTable({ onChange }) {
    const { ocoPairs, ocoStatusMap, refreshOcoPairs } = useZerodha();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        refreshOcoPairs();
        // Only on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleCancel = async (id, type) => {
        setLoading(true);
        setError(null);
        try {
            if (type === 'OAO') {
                await deleteOaoOrderPair(id);
            } else {
                await deleteOrderPair(id);
            }
            await refreshOcoPairs();
            if (onChange) onChange();
        } catch (error) {
            console.error('Error cancelling order pair:', error);
            setError(error.response?.data?.message || 'Failed to cancel order pair. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!ocoPairs.length) return null;

    const getStatusColor = (status) => {
        switch (status) {
            case 'COMPLETE': return 'success';
            case 'CANCELLED': return 'default';
            case 'TRIGGER PENDING': return 'info';
            default: return 'warning';
        }
    };

    // Split pairs into OCO and OAO
    const ocoOnlyPairs = ocoPairs.filter(pair => pair.type === 'OCO' && isToday(pair.created_at));
    const oaoOnlyPairs = ocoPairs.filter(pair => pair.type === 'OAO' && isToday(pair.created_at));

    // OCO: Split into active and completed
    const activePairs = ocoOnlyPairs.filter(pair => pair.status !== 'COMPLETED');
    const completedTodayPairs = ocoOnlyPairs.filter(pair => pair.status === 'COMPLETED');

    // OAO: Show all (or split if needed)
    const activeOaoPairs = oaoOnlyPairs.filter(pair => pair.status !== 'COMPLETED');
    const completedOaoPairs = oaoOnlyPairs.filter(pair => pair.status === 'COMPLETED');

    return (
        <>
            {/* OCO Table */}
            <Paper sx={{ mb: 3, p: 2 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    OCO Pairs
                </Typography>
                {activePairs.length === 0 && completedTodayPairs.length === 0 ? (
                    <Typography variant="body1" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                        No OCO orders found for today. Create a new OCO order pair to get started.
                    </Typography>
                ) : (
                    <>
                        {/* Active OCO Orders */}
                        {activePairs.length > 0 ? (
                            <>
                                <Typography
                                    variant="subtitle2"
                                    fontWeight={600}
                                    gutterBottom
                                    sx={{ mt: 2, color: 'warning.main' }}
                                >
                                    Active Orders
                                </Typography>
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Order 1</TableCell>
                                                <TableCell>Type</TableCell>
                                                <TableCell>Status</TableCell>
                                                <TableCell>Order 2</TableCell>
                                                <TableCell>Type</TableCell>
                                                <TableCell>Status</TableCell>
                                                <TableCell>Last Updated</TableCell>
                                                <TableCell>Action</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {activePairs.map((pair) => {
                                                const status1 = ocoStatusMap[pair.order1_id] || '';
                                                const status2 = ocoStatusMap[pair.order2_id] || '';
                                                return (
                                                    <TableRow key={pair.id}>
                                                        <TableCell>
                                                            {pair.order1_details?.tradingsymbol || ''} <br />
                                                            <small>{pair.order1_id}</small>
                                                        </TableCell>
                                                        <TableCell>{pair.order1_details?.transaction_type || ''}</TableCell>
                                                        <TableCell><Chip label={status1} color={getStatusColor(status1)} size="small" /></TableCell>
                                                        <TableCell>
                                                            {pair.order2_details?.tradingsymbol || ''} <br />
                                                            <small>{pair.order2_id}</small>
                                                        </TableCell>
                                                        <TableCell>{pair.order2_details?.transaction_type || ''}</TableCell>
                                                        <TableCell><Chip label={status2} color={getStatusColor(status2)} size="small" /></TableCell>
                                                        <TableCell>{formatDate(pair.updated_at)}</TableCell>
                                                        <TableCell>
                                                            <Button
                                                                variant="outlined"
                                                                color="error"
                                                                size="small"
                                                                onClick={() => handleCancel(pair.id, 'OCO')}
                                                                disabled={loading}
                                                                startIcon={loading ? <CircularProgress size={20} /> : null}
                                                            >
                                                                Cancel OCO
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </>
                        ) : (
                            <Typography variant="body1" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                                No active OCO orders found.
                            </Typography>
                        )}

                        {/* Completed OCO Orders */}
                        {completedTodayPairs.length > 0 && (
                            <>
                                <Divider sx={{ my: 2 }} />
                                <Typography
                                    variant="subtitle2"
                                    fontWeight={600}
                                    gutterBottom
                                    sx={{ color: 'success.main' }}
                                >
                                    Completed Orders
                                </Typography>
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Order 1</TableCell>
                                                <TableCell>Type</TableCell>
                                                <TableCell>Status</TableCell>
                                                <TableCell>Order 2</TableCell>
                                                <TableCell>Type</TableCell>
                                                <TableCell>Status</TableCell>
                                                <TableCell>Last Updated</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {completedTodayPairs.map((pair) => {
                                                const status1 = ocoStatusMap[pair.order1_id] || '';
                                                const status2 = ocoStatusMap[pair.order2_id] || '';
                                                return (
                                                    <TableRow key={pair.id}>
                                                        <TableCell>{pair.order1_details?.tradingsymbol || ''} <br /> <small>{pair.order1_id}</small></TableCell>
                                                        <TableCell>{pair.order1_details?.transaction_type || ''}</TableCell>
                                                        <TableCell><Chip label={status1} color={getStatusColor(status1)} size="small" /></TableCell>
                                                        <TableCell>{pair.order2_details?.tradingsymbol || ''} <br /> <small>{pair.order2_id}</small></TableCell>
                                                        <TableCell>{pair.order2_details?.transaction_type || ''}</TableCell>
                                                        <TableCell><Chip label={status2} color={getStatusColor(status2)} size="small" /></TableCell>
                                                        <TableCell>{formatDate(pair.updated_at)}</TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </>
                        )}
                    </>
                )}
            </Paper>

            {/* OAO Table */}
            <Paper sx={{ mb: 3, p: 2 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    OAO Pairs
                </Typography>
                {activeOaoPairs.length === 0 && completedOaoPairs.length === 0 ? (
                    <Typography variant="body1" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                        No OAO orders found for today. Create a new OAO order pair to get started.
                    </Typography>
                ) : (
                    <>
                        {/* Active OAO Orders */}
                        {activeOaoPairs.length > 0 ? (
                            <>
                                <Typography
                                    variant="subtitle2"
                                    fontWeight={600}
                                    gutterBottom
                                    sx={{ mt: 2, color: 'warning.main' }}
                                >
                                    Active Orders
                                </Typography>
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Order 1</TableCell>
                                                <TableCell>Type</TableCell>
                                                <TableCell>Status</TableCell>
                                                <TableCell>Order 2 Details</TableCell>
                                                <TableCell>Order 2 ID</TableCell>
                                                <TableCell>Status</TableCell>
                                                <TableCell>Last Updated</TableCell>
                                                <TableCell>Action</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {activeOaoPairs.map((pair) => {
                                                const status1 = ocoStatusMap[pair.order1_id] || '';
                                                const status2 = pair.order2_id ? (ocoStatusMap[pair.order2_id] || '') : '';
                                                return (
                                                    <TableRow key={pair.id}>
                                                        <TableCell>
                                                            {pair.order1_details?.tradingsymbol || ''} <br />
                                                            <small>{pair.order1_id}</small>
                                                        </TableCell>
                                                        <TableCell>{pair.order1_details?.transaction_type || ''}</TableCell>
                                                        <TableCell><Chip label={status1} color={getStatusColor(status1)} size="small" /></TableCell>
                                                        <TableCell>
                                                            {pair.order2_details ? (
                                                                <>
                                                                    {pair.order2_details.tradingsymbol || ''} <br />
                                                                    {pair.order2_details.transaction_type || ''} <br />
                                                                    Qty: {pair.order2_details.quantity || ''} <br />
                                                                    Price: {pair.order2_details.price || ''}
                                                                </>
                                                            ) : ''}
                                                        </TableCell>
                                                        <TableCell>{pair.order2_id || '-'}</TableCell>
                                                        <TableCell><Chip label={status2} color={getStatusColor(status2)} size="small" /></TableCell>
                                                        <TableCell>{formatDate(pair.updated_at)}</TableCell>
                                                        <TableCell>
                                                            <Button
                                                                variant="outlined"
                                                                color="error"
                                                                size="small"
                                                                onClick={() => handleCancel(pair.id, 'OAO')}
                                                                disabled={loading}
                                                                startIcon={loading ? <CircularProgress size={20} /> : null}
                                                            >
                                                                Cancel OAO
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </>
                        ) : (
                            <Typography variant="body1" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                                No active OAO orders found.
                            </Typography>
                        )}

                        {/* Completed OAO Orders */}
                        {completedOaoPairs.length > 0 && (
                            <>
                                <Divider sx={{ my: 2 }} />
                                <Typography
                                    variant="subtitle2"
                                    fontWeight={600}
                                    gutterBottom
                                    sx={{ color: 'success.main' }}
                                >
                                    Completed Orders
                                </Typography>
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Order 1</TableCell>
                                                <TableCell>Type</TableCell>
                                                <TableCell>Status</TableCell>
                                                <TableCell>Order 2 Details</TableCell>
                                                <TableCell>Order 2 ID</TableCell>
                                                <TableCell>Status</TableCell>
                                                <TableCell>Last Updated</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {completedOaoPairs.map((pair) => {
                                                const status1 = ocoStatusMap[pair.order1_id] || '';
                                                const status2 = pair.order2_id ? (ocoStatusMap[pair.order2_id] || '') : '';
                                                return (
                                                    <TableRow key={pair.id}>
                                                        <TableCell>{pair.order1_details?.tradingsymbol || ''} <br /> <small>{pair.order1_id}</small></TableCell>
                                                        <TableCell>{pair.order1_details?.transaction_type || ''}</TableCell>
                                                        <TableCell><Chip label={status1} color={getStatusColor(status1)} size="small" /></TableCell>
                                                        <TableCell>
                                                            {pair.order2_details ? (
                                                                <>
                                                                    {pair.order2_details.tradingsymbol || ''} <br />
                                                                    {pair.order2_details.transaction_type || ''} <br />
                                                                    Qty: {pair.order2_details.quantity || ''} <br />
                                                                    Price: {pair.order2_details.price || ''}
                                                                </>
                                                            ) : ''}
                                                        </TableCell>
                                                        <TableCell>{pair.order2_id || '-'}</TableCell>
                                                        <TableCell><Chip label={status2} color={getStatusColor(status2)} size="small" /></TableCell>
                                                        <TableCell>{formatDate(pair.updated_at)}</TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </>
                        )}
                    </>
                )}
            </Paper>
            <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={() => setError(null)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={() => setError(null)} severity="error">
                    {error}
                </Alert>
            </Snackbar>
        </>
    );
} 