import React, { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Stack
} from '@mui/material';
import OrderStatusChip from './OrderStatusChip';
import OrderTypeChip from './OrderTypeChip';
import OrderActions from './OrderActions';
import { formatDateTime, formatPrice } from '../../utils/formatters';
import { getOrders as getAppOrders } from '../../services/orders';

const OrderTable = ({
    orders,
    onCancel,
    onModify,
    onViewDetails,
    onLinkToTrade
}) => {
    const [linkedOrderIds, setLinkedOrderIds] = useState(new Set());

    useEffect(() => {
        const checkLinkedOrders = async () => {
            const linkedIds = new Set();
            // Only check for completed orders
            const completedOrders = orders.filter(o => o.status === 'COMPLETE');
            await Promise.all(completedOrders.map(async (order) => {
                const appOrders = await getAppOrders({ tags: order.order_id });
                if (appOrders && appOrders.length > 0) {
                    linkedIds.add(order.order_id);
                }
            }));
            setLinkedOrderIds(linkedIds);
        };

        checkLinkedOrders();
    }, [orders]);

    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Order ID</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Trading Symbol</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Transaction Type</TableCell>
                        <TableCell>Quantity</TableCell>
                        <TableCell>Price</TableCell>
                        <TableCell>Trigger Price</TableCell>
                        <TableCell>Order Time</TableCell>
                        <TableCell>Exchange</TableCell>
                        <TableCell>Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {orders.map((order) => (
                        <TableRow key={order.order_id}>
                            <TableCell>{order.order_id}</TableCell>
                            <TableCell>
                                <Stack direction="row" spacing={1}>
                                    <OrderStatusChip status={order.status} />
                                    {order.status === 'COMPLETE' && linkedOrderIds.has(order.order_id) && (
                                        <Chip
                                            label="Linked"
                                            color="success"
                                            size="small"
                                            variant="outlined"
                                        />
                                    )}
                                </Stack>
                            </TableCell>
                            <TableCell>{order.tradingsymbol}</TableCell>
                            <TableCell>
                                <OrderTypeChip type={order.order_type} />
                            </TableCell>
                            <TableCell>
                                <Chip
                                    label={order.transaction_type}
                                    color={order.transaction_type === 'BUY' ? 'success' : 'error'}
                                    size="small"
                                    variant="outlined"
                                />
                            </TableCell>
                            <TableCell>{order.quantity}</TableCell>
                            <TableCell>{formatPrice(order.price)}</TableCell>
                            <TableCell>{formatPrice(order.trigger_price)}</TableCell>
                            <TableCell>{formatDateTime(order.order_timestamp)}</TableCell>
                            <TableCell>{order.exchange}</TableCell>
                            <TableCell>
                                <OrderActions
                                    order={order}
                                    onCancel={onCancel}
                                    onModify={onModify}
                                    onViewDetails={onViewDetails}
                                    onLinkToTrade={onLinkToTrade}
                                />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default OrderTable; 