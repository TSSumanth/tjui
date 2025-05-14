import React from 'react';
import {
    Grid,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Box
} from '@mui/material';
import { formatCurrency } from '../../utils/formatters';

const getMutualFundStats = (mutualFunds) => {
    if (!mutualFunds?.length) return null;

    const totalInvested = mutualFunds.reduce((sum, fund) => sum + (fund.units * fund.average_cost), 0);
    const currentValue = mutualFunds.reduce((sum, fund) => sum + (fund.units * fund.current_nav), 0);
    const totalPL = currentValue - totalInvested;

    return { totalInvested, currentValue, totalPL };
};

const MutualFunds = ({ mutualFunds }) => {
    const stats = getMutualFundStats(mutualFunds);

    if (!mutualFunds?.length || !stats) return null;

    return (
        <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, height: 56, flexWrap: 'wrap', width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', flex: '1 1 180px', pr: 2, height: '100%', minWidth: 120 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1 }}>
                            Mutual Fund Holdings
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, height: '100%', flex: 3 }}>
                        <Paper elevation={2} sx={{ p: 0, flex: '1 1 120px', minWidth: 100, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mb: 0 }}>
                                Invested
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1 }}>
                                ₹{formatCurrency(stats.totalInvested)}
                            </Typography>
                        </Paper>
                        <Paper elevation={2} sx={{ p: 0, flex: '1 1 120px', minWidth: 100, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mb: 0 }}>
                                Current Value
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1 }}>
                                ₹{formatCurrency(stats.currentValue)}
                            </Typography>
                        </Paper>
                        <Paper elevation={2} sx={{ p: 0, flex: '1 1 120px', minWidth: 100, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mb: 0 }}>
                                Total P/L
                            </Typography>
                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 700,
                                    color: stats.totalPL >= 0 ? 'success.main' : 'error.main',
                                    lineHeight: 1
                                }}
                            >
                                ₹{formatCurrency(stats.totalPL)}
                            </Typography>
                        </Paper>
                    </Box>
                </Box>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Scheme</TableCell>
                                <TableCell align="right">Units</TableCell>
                                <TableCell align="right">Average Cost</TableCell>
                                <TableCell align="right">Current NAV</TableCell>
                                <TableCell align="right">Current Value</TableCell>
                                <TableCell align="right">P&L</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {mutualFunds.map((fund, index) => {
                                const currentValue = fund.units * fund.current_nav;
                                const investedValue = fund.units * fund.average_cost;
                                const pnl = currentValue - investedValue;
                                const pnlPercentage = (pnl / investedValue) * 100;

                                return (
                                    <TableRow key={index}>
                                        <TableCell>{fund.scheme_name}</TableCell>
                                        <TableCell align="right">{fund.units.toFixed(2)}</TableCell>
                                        <TableCell align="right">₹{formatCurrency(fund.average_cost)}</TableCell>
                                        <TableCell align="right">₹{formatCurrency(fund.current_nav)}</TableCell>
                                        <TableCell align="right">₹{formatCurrency(currentValue)}</TableCell>
                                        <TableCell align="right">
                                            <Typography
                                                color={pnl >= 0 ? 'success.main' : 'error.main'}
                                            >
                                                ₹{formatCurrency(pnl)} ({pnlPercentage.toFixed(2)}%)
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Grid>
    );
};

export default React.memo(MutualFunds); 