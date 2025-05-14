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
    CircularProgress,
    Box
} from '@mui/material';
import { formatCurrency } from '../../utils/formatters';

const PortfolioDashboard = ({ portfolioAccounts, portfolioLoading, accountInfo }) => {
    return (
        <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6">
                        Portfolio Dashboard
                    </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Open the Portfolio page and click on <b>Update Portfolio Value</b> to get the latest Account Value.
                </Typography>
                <TableContainer>
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow sx={{ background: '#f5f7fa' }}>
                                <TableCell align="center" sx={{ fontWeight: 700, color: 'primary.dark', fontSize: 16, py: 2 }}>Name</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700, color: 'primary.dark', fontSize: 16, py: 2 }}>Account ID</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700, color: 'primary.dark', fontSize: 16, py: 2 }}>Balance</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700, color: 'primary.dark', fontSize: 16, py: 2 }}>Equity Value</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700, color: 'primary.dark', fontSize: 16, py: 2 }}>Positions Value</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700, color: 'primary.dark', fontSize: 16, py: 2 }}>Total Value</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700, color: 'primary.dark', fontSize: 16, py: 2 }}>Last Updated</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {portfolioLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                        <CircularProgress size={24} />
                                    </TableCell>
                                </TableRow>
                            ) : portfolioAccounts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">
                                        <Typography variant="body2" color="text.secondary">No accounts found.</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                <>
                                    {portfolioAccounts.map((acc, idx) => {
                                        const isCurrent = accountInfo && acc.account_id === accountInfo.clientId;
                                        return (
                                            <TableRow
                                                key={acc.id}
                                                sx={{
                                                    background: idx % 2 === 0 ? '#f9fbfd' : '#fff',
                                                    '&:hover': { background: '#e3f2fd' },
                                                    transition: 'background 0.2s',
                                                }}
                                            >
                                                <TableCell align="center" sx={{ fontWeight: isCurrent ? 700 : 500, color: isCurrent ? 'primary.main' : 'inherit', py: 2 }}>
                                                    {acc.account_member_name}
                                                </TableCell>
                                                <TableCell align="center" sx={{ color: isCurrent ? 'primary.main' : 'text.secondary', py: 2 }}>{acc.account_id}</TableCell>
                                                <TableCell align="center" sx={{ py: 2 }}>
                                                    <Typography fontWeight={700} color="primary.main" fontSize={17}>₹{formatCurrency(acc.equity_account_balance)}</Typography>
                                                </TableCell>
                                                <TableCell align="center" sx={{ py: 2 }}>
                                                    <Typography fontWeight={700} color="success.main" fontSize={17}>₹{formatCurrency(acc.equity_holdings_value)}</Typography>
                                                </TableCell>
                                                <TableCell align="center" sx={{ py: 2 }}>
                                                    <Typography fontWeight={700} color="warning.main" fontSize={17}>₹{formatCurrency(acc.equity_positions_value)}</Typography>
                                                </TableCell>
                                                <TableCell align="center" sx={{ py: 2 }}>
                                                    <Typography fontWeight={700} color="info.main" fontSize={18}>₹{formatCurrency(acc.total_account_value)}</Typography>
                                                </TableCell>
                                                <TableCell align="center" sx={{ py: 2 }}>
                                                    <Typography fontWeight={700} color="info.main" fontSize={17}>
                                                        {acc.updated_at ? new Date(acc.updated_at).toLocaleString() : '-'}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Grid>
    );
};

export default React.memo(PortfolioDashboard); 