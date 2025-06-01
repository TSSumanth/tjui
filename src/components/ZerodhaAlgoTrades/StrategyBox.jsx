import React from 'react';
import { Box, Card, CardContent, Typography, Table, TableHead, TableRow, TableCell, TableBody, Button, Divider } from '@mui/material';

const StrategyBox = ({ strategyName, trades, details }) => (
    <Card sx={{ mb: 3, minWidth: 400 }}>
        <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
                {strategyName}
            </Typography>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Created By</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Action</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {trades.map((trade, idx) => (
                        <TableRow key={idx}>
                            <TableCell>{trade.date}</TableCell>
                            <TableCell>{trade.createdBy}</TableCell>
                            <TableCell>{trade.name}</TableCell>
                            <TableCell>
                                <Button size="small" variant="outlined">View</Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" color="text.secondary">
                {details}
            </Typography>
        </CardContent>
    </Card>
);

export default StrategyBox;