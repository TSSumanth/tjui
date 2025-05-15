import React from 'react';
import { Table, TableHead, TableRow, TableCell, TableBody, IconButton, Chip, TableContainer, Paper, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString();
}

export default function SavedOrdersTable({ savedOrders, onEdit, onPlace, onDelete, placingOrder }) {
    return (
        <Paper sx={{ mb: 3, p: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ color: '#1a237e' }}>
                Saved Orders (SO)
            </Typography>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Symbol</TableCell>
                            <TableCell>Qty</TableCell>
                            <TableCell>Price</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Product</TableCell>
                            <TableCell>Transaction</TableCell>
                            <TableCell>Last Updated</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {savedOrders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center">
                                    No saved orders found. Create a new saved order to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            savedOrders.map(order => (
                                <TableRow
                                    key={order.id}
                                    sx={{
                                        backgroundColor: order.order1_details?.transaction_type === 'BUY'
                                            ? 'rgba(76, 175, 80, 0.1)'
                                            : 'rgba(244, 67, 54, 0.1)',
                                        '&:hover': {
                                            backgroundColor: order.order1_details?.transaction_type === 'BUY'
                                                ? 'rgba(76, 175, 80, 0.2)'
                                                : 'rgba(244, 67, 54, 0.2)',
                                        }
                                    }}
                                >
                                    <TableCell>{order.order1_details?.symbol || order.order1_details?.tradingsymbol}</TableCell>
                                    <TableCell>{order.order1_details?.quantity}</TableCell>
                                    <TableCell>{order.order1_details?.price}</TableCell>
                                    <TableCell>{order.order1_details?.order_type}</TableCell>
                                    <TableCell>{order.order1_details?.product}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={order.order1_details?.transaction_type}
                                            color={order.order1_details?.transaction_type === 'BUY' ? 'success' : 'error'}
                                            size="small"
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell>{formatDate(order.order1_details?.lastupdatedat)}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => onEdit(order)} color="primary">
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton
                                            onClick={() => onPlace(order)}
                                            color="success"
                                            disabled={placingOrder}
                                        >
                                            <PlayArrowIcon />
                                        </IconButton>
                                        <IconButton onClick={() => onDelete(order)} color="error">
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
} 