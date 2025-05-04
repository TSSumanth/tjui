import React, { useState, useEffect } from 'react';
import { IconButton, Modal, Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Tooltip, Avatar } from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CloseIcon from '@mui/icons-material/Close';
import { getAllPortfolioValues } from '../services/portfolioValue';
import { useZerodha } from '../context/ZerodhaContext';
import { formatCurrency } from '../utils/formatters';

const modalStyle = {
    position: 'fixed',
    top: 80,
    right: 32,
    width: 600,
    bgcolor: 'background.paper',
    borderRadius: 4,
    boxShadow: '0 8px 32px rgba(40,60,90,0.18)',
    p: 0,
    outline: 'none',
    zIndex: 1300
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
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2, borderBottom: '1px solid #e3e3e3' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AccountBalanceWalletIcon color="primary" />
                            <Typography variant="h6" fontWeight={600} color="text.primary">
                                Portfolio Dashboard
                            </Typography>
                        </Box>
                        <IconButton onClick={handleClose} size="small"><CloseIcon /></IconButton>
                    </Box>
                    <TableContainer component={Paper} elevation={0} sx={{ maxHeight: 520, borderRadius: 0, boxShadow: 'none' }}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, background: '#f5f7fa', py: 1.5 }}>Name</TableCell>
                                    <TableCell sx={{ fontWeight: 600, background: '#f5f7fa', py: 1.5 }}>Account ID</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600, background: '#f5f7fa', py: 1.5 }}>Balance</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600, background: '#f5f7fa', py: 1.5 }}>Total Value</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {accounts.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center">
                                            <Typography variant="body2" color="text.secondary">No accounts found.</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                                {accounts.map(acc => {
                                    const isCurrent = accountInfo && acc.account_id === accountInfo.clientId;
                                    return (
                                        <TableRow
                                            key={acc.id}
                                            sx={isCurrent
                                                ? { borderLeft: '4px solid #1976d2', background: '#f8fafc' }
                                                : {}}
                                        >
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Avatar sx={{ width: 28, height: 28, bgcolor: isCurrent ? 'primary.main' : 'grey.300', fontSize: 14 }}>
                                                        {acc.account_member_name?.[0] || '?'}
                                                    </Avatar>
                                                    <Typography fontWeight={isCurrent ? 600 : 500} color={isCurrent ? 'primary.main' : 'text.primary'}>
                                                        {acc.account_member_name}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Typography fontWeight={isCurrent ? 600 : 400} color={isCurrent ? 'primary.main' : 'text.secondary'}>
                                                    {acc.account_id}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right" sx={{ py: 1.5 }}>
                                                <Typography fontWeight={600} color={isCurrent ? 'primary.main' : 'success.main'}>
                                                    ₹{formatCurrency(acc.equity_account_balance)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right" sx={{ py: 1.5 }}>
                                                <Typography fontWeight={600} color={isCurrent ? 'primary.main' : 'info.main'}>
                                                    ₹{formatCurrency(acc.total_account_value)}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            </Modal>
        </>
    );
};

export default PortfolioDashboardWidget; 