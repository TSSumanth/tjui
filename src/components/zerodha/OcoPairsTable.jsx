import React, { useContext, useEffect } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Chip, Typography, Divider } from '@mui/material';
import { useZerodha } from '../../context/ZerodhaContext';

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

export default function OcoPairsTable({ onChange }) {
    const { ocoPairs, ocoStatusMap, refreshOcoPairs } = useZerodha();

    useEffect(() => {
        refreshOcoPairs();
        // Only on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleCancel = async (id) => {
        // Optionally, you can call a context method to delete/cancel the pair and refresh
        await refreshOcoPairs();
        if (onChange) onChange();
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

    // Split pairs into active and completed (today only)
    const activePairs = ocoPairs.filter(pair => pair.status !== 'completed');
    const completedTodayPairs = ocoPairs.filter(pair => pair.status === 'completed' && isToday(pair.created_at));

    return (
        <Paper sx={{ mb: 3, p: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                OCO Pairs
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
                                    <TableCell>{pair.order1_symbol || ''} <br /> <small>{pair.order1_id}</small></TableCell>
                                    <TableCell>{pair.order1_type || ''}</TableCell>
                                    <TableCell><Chip label={status1} color={getStatusColor(status1)} size="small" /></TableCell>
                                    <TableCell>{pair.order2_symbol || ''} <br /> <small>{pair.order2_id}</small></TableCell>
                                    <TableCell>{pair.order2_type || ''}</TableCell>
                                    <TableCell><Chip label={status2} color={getStatusColor(status2)} size="small" /></TableCell>
                                    <TableCell>{formatDate(pair.updated_at)}</TableCell>
                                    <TableCell>
                                        <Button variant="outlined" color="error" size="small" onClick={() => handleCancel(pair.id)}>
                                            Cancel OCO
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
            {completedTodayPairs.length > 0 && (
                <>
                    <Divider sx={{ my: 3 }} />
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        Completed OCO Pairs (Today)
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
                                            <TableCell>{pair.order1_symbol || ''} <br /> <small>{pair.order1_id}</small></TableCell>
                                            <TableCell>{pair.order1_type || ''}</TableCell>
                                            <TableCell><Chip label={status1} color={getStatusColor(status1)} size="small" /></TableCell>
                                            <TableCell>{pair.order2_symbol || ''} <br /> <small>{pair.order2_id}</small></TableCell>
                                            <TableCell>{pair.order2_type || ''}</TableCell>
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
        </Paper>
    );
} 