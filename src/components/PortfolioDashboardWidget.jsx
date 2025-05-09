import React, { useState, useEffect } from 'react';
import { IconButton, Modal, Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Tooltip, Avatar } from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CloseIcon from '@mui/icons-material/Close';
import { getAllPortfolioValues } from '../services/portfolioValue';
import { useZerodha } from '../context/ZerodhaContext';
import { formatCurrency } from '../utils/formatters';

const modalStyle = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 1300,
    maxWidth: '99vw',
    bgcolor: '#fff',
    borderRadius: 8,
    boxShadow: 3,
    p: 0,
    outline: 'none',
    zIndex: 1300,
    color: '#222',
};

const PortfolioDashboardWidget = () => {
    const [open, setOpen] = useState(false);
    const [accounts, setAccounts] = useState([]);
    const { accountInfo } = useZerodha();

    useEffect(() => {
        if (open) {
            getAllPortfolioValues().then(res => {
                if (res.success) setAccounts(res.data);
            });
        }
    }, [open]);

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    return (
        <>
            <Tooltip title="Show all portfolio accounts">
                <IconButton color="primary" onClick={handleOpen} sx={{ ml: 1 }}>
                    <AccountBalanceWalletIcon fontSize="large" />
                </IconButton>
            </Tooltip>
            <Modal open={open} onClose={handleClose}>
                <Box sx={modalStyle}>
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        px: 2,
                        py: 2,
                        borderBottom: '1px solid #eee',
                    }}>
                        <Typography variant="h6" fontWeight={600} color="#222">
                            Portfolio Dashboard
                        </Typography>
                        <IconButton onClick={handleClose} size="small"><CloseIcon /></IconButton>
                    </Box>
                    <Box sx={{ px: 2, py: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Open the Portfolio page and click on <b>Update Portfolio Value</b> to get the latest Account Value.
                        </Typography>
                        <Paper elevation={3} sx={{ borderRadius: 3, boxShadow: 3, overflow: 'auto', maxHeight: 520 }}>
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
                                        {accounts.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={6} align="center">
                                                    <Typography variant="body2" color="text.secondary">No accounts found.</Typography>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        {accounts.map((acc, idx) => {
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
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </Box>
                </Box>
            </Modal>
        </>
    );
};

export default PortfolioDashboardWidget; 