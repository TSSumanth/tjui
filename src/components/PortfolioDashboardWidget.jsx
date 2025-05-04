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
    width: 800,
    bgcolor: '#232946',
    borderRadius: 12,
    boxShadow: '0 8px 32px rgba(20,30,60,0.38)',
    p: 0,
    outline: 'none',
    zIndex: 1300,
    color: '#fff'
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
                        gap: 2,
                        px: 3,
                        py: 2,
                        background: '#232946',
                        borderTopLeftRadius: 12,
                        borderTopRightRadius: 12,
                        borderBottom: '2.5px solid #232946'
                    }}>
                        <AccountBalanceWalletIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="h6" fontWeight={600} color="#fff" sx={{ flex: 1 }}>
                            Portfolio Dashboard
                        </Typography>
                        <IconButton onClick={handleClose} size="small"><CloseIcon /></IconButton>
                    </Box>
                    <TableContainer component={Paper} elevation={0} sx={{ maxHeight: 600, borderRadius: 0, boxShadow: 'none', background: 'transparent' }}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell
                                        sx={{
                                            fontWeight: 700,
                                            background: '#232946',
                                            color: '#fff',
                                            py: 1.5,
                                            borderBottom: '2px solid #2c3142'
                                        }}
                                    >
                                        Name
                                    </TableCell>
                                    <TableCell
                                        sx={{
                                            fontWeight: 700,
                                            background: '#232946',
                                            color: '#fff',
                                            py: 1.5,
                                            borderBottom: '2px solid #2c3142'
                                        }}
                                    >
                                        Account ID
                                    </TableCell>
                                    <TableCell
                                        align="right"
                                        sx={{
                                            fontWeight: 700,
                                            background: '#232946',
                                            color: '#fff',
                                            py: 1.5,
                                            borderBottom: '2px solid #2c3142'
                                        }}
                                    >
                                        Balance
                                    </TableCell>
                                    <TableCell
                                        align="right"
                                        sx={{
                                            fontWeight: 700,
                                            background: '#232946',
                                            color: '#fff',
                                            py: 1.5,
                                            borderBottom: '2px solid #2c3142'
                                        }}
                                    >
                                        Equity Value
                                    </TableCell>
                                    <TableCell
                                        align="right"
                                        sx={{
                                            fontWeight: 700,
                                            background: '#232946',
                                            color: '#fff',
                                            py: 1.5,
                                            borderBottom: '2px solid #2c3142'
                                        }}
                                    >
                                        Positions Value
                                    </TableCell>
                                    <TableCell
                                        align="right"
                                        sx={{
                                            fontWeight: 700,
                                            background: '#232946',
                                            color: '#fff',
                                            py: 1.5,
                                            borderBottom: '2px solid #2c3142'
                                        }}
                                    >
                                        Total Value
                                    </TableCell>
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
                                {accounts.map((acc, index) => {
                                    const isCurrent = accountInfo && acc.account_id === accountInfo.clientId;
                                    return (
                                        <TableRow
                                            key={acc.id}
                                            sx={{
                                                background: isCurrent ? '#20243a' : '#181c2a',
                                                borderLeft: isCurrent ? '4px solid #90caf9' : 'none',
                                                '&:hover': { background: '#232946', cursor: 'pointer' },
                                                borderBottom: '1.5px solid #232946'
                                            }}
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
                                                <Typography fontWeight={600} color={isCurrent ? 'primary.main' : '#fff'}>
                                                    ₹{formatCurrency(acc.equity_account_balance)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right" sx={{ py: 1.5 }}>
                                                <Typography fontWeight={600} color={isCurrent ? 'primary.main' : 'info.main'}>
                                                    ₹{formatCurrency(acc.equity_holdings_value)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right" sx={{ py: 1.5 }}>
                                                <Typography fontWeight={600} color={isCurrent ? 'primary.main' : 'warning.main'}>
                                                    ₹{formatCurrency(acc.equity_positions_value)}
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