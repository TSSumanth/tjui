import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Button,
    Paper,
    Grid,
    Divider,
    CircularProgress,
    Stack,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    useTheme,
    alpha
} from '@mui/material';
import { Link } from 'react-router-dom';
import { useZerodha } from '../context/ZerodhaContext';
import { getAccountInfo } from '../services/zerodha/api';
import Header from '../components/Header/Header';
import RefreshIcon from '@mui/icons-material/Refresh';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import { formatCurrency } from '../utils/formatters';

const ZerodhaAccount = () => {
    const { isAuth, fetchData, disconnect } = useZerodha();
    const [accountInfo, setAccountInfo] = useState(null);
    const [sessionStatus, setSessionStatus] = useState('checking');
    const theme = useTheme();

    useEffect(() => {
        if (isAuth) {
            checkSession();
        }
    }, [isAuth]);

    const checkSession = async () => {
        try {
            setSessionStatus('checking');
            const response = await getAccountInfo();
            if (response.success) {
                setSessionStatus('active');
                setAccountInfo(response.data);
            } else {
                setSessionStatus('inactive');
                setAccountInfo(null);
            }
        } catch (err) {
            setSessionStatus('inactive');
            console.error('Error checking session:', err);
        }
    };

    const handleConnect = async () => {
        try {
            await fetchData();
            await checkSession();
        } catch (err) {
            console.error('Error connecting:', err);
        }
    };

    const handleDisconnect = async () => {
        try {
            await disconnect();
            setSessionStatus('inactive');
            setAccountInfo(null);
        } catch (err) {
            console.error('Error disconnecting:', err);
        }
    };

    if (!isAuth) {
        return (
            <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
                <Header />
                <Container maxWidth="lg">
                    <Box sx={{
                        mt: 8,
                        textAlign: 'center',
                        p: 4,
                        bgcolor: 'background.paper',
                        borderRadius: 2,
                        boxShadow: 1
                    }}>
                        <AccountBalanceWalletIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                        <Typography variant="h5" gutterBottom>
                            Please authenticate with Zerodha
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                            Connect your Zerodha account to view your portfolio and trading information
                        </Typography>
                        <Button
                            variant="contained"
                            color="primary"
                            size="large"
                            startIcon={<LinkIcon />}
                            onClick={handleConnect}
                        >
                            Connect to Zerodha
                        </Button>
                    </Box>
                </Container>
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
            <Header />
            <Container maxWidth="lg" sx={{ py: 4 }}>
                {/* Header Section */}
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <ShowChartIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                        <Typography variant="h4">Zerodha Account</Typography>
                    </Box>
                    <Stack direction="row" spacing={2}>
                        <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={checkSession}
                        >
                            Refresh
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            component={Link}
                            to="/portfolio"
                        >
                            View Portfolio
                        </Button>
                    </Stack>
                </Box>

                {sessionStatus === 'checking' ? (
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: 400
                    }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Stack spacing={3}>
                        {/* Session Status Card */}
                        <Paper sx={{
                            p: 3,
                            borderRadius: 2,
                            boxShadow: theme.shadows[2],
                            background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.primary.main, 0.1)})`
                        }}>
                            <Box sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <AccountBalanceIcon sx={{ color: 'primary.main' }} />
                                    <Box>
                                        <Typography variant="h6" gutterBottom>
                                            Session Status
                                        </Typography>
                                        <Chip
                                            label={sessionStatus === 'active' ? 'Active Session' : 'Session Inactive'}
                                            color={sessionStatus === 'active' ? 'success' : 'error'}
                                            size="small"
                                            sx={{ fontWeight: 500 }}
                                        />
                                    </Box>
                                </Box>
                                <Button
                                    variant="outlined"
                                    color="error"
                                    startIcon={<LinkOffIcon />}
                                    onClick={handleDisconnect}
                                    size="small"
                                >
                                    Disconnect
                                </Button>
                            </Box>
                        </Paper>

                        {/* Main Content */}
                        <Grid container spacing={3}>
                            {accountInfo?.margins?.equity && (
                                <Grid item xs={12}>
                                    <Stack spacing={3}>
                                        {/* Margin Information */}
                                        <Paper sx={{
                                            p: 3,
                                            borderRadius: 2,
                                            boxShadow: theme.shadows[2]
                                        }}>
                                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <AccountBalanceWalletIcon sx={{ color: 'primary.main' }} />
                                                Margin Information
                                            </Typography>
                                            <Divider sx={{ mb: 3 }} />
                                            <Box sx={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                                gap: 2
                                            }}>
                                                {[
                                                    {
                                                        label: 'Available',
                                                        value: accountInfo.margins.equity.available,
                                                        color: 'success'
                                                    },
                                                    {
                                                        label: 'Utilized',
                                                        value: accountInfo.margins.equity.utilised,
                                                        color: 'warning'
                                                    },
                                                    {
                                                        label: 'Net',
                                                        value: accountInfo.margins.equity.net,
                                                        color: 'info'
                                                    },
                                                    {
                                                        label: 'Exposure',
                                                        value: accountInfo.margins.equity.exposure,
                                                        color: 'error'
                                                    },
                                                    {
                                                        label: 'Option Premium',
                                                        value: accountInfo.margins.equity.optionPremium,
                                                        color: 'secondary'
                                                    }
                                                ].map((item, index) => (
                                                    <Paper
                                                        key={index}
                                                        sx={{
                                                            p: 2.5,
                                                            borderRadius: 2,
                                                            background: `linear-gradient(45deg, ${alpha(theme.palette[item.color].main, 0.05)}, ${alpha(theme.palette[item.color].main, 0.1)})`,
                                                            border: `1px solid ${alpha(theme.palette[item.color].main, 0.1)}`
                                                        }}
                                                    >
                                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                            {item.label}
                                                        </Typography>
                                                        <Typography variant="h6" color={`${item.color}.main`} noWrap fontWeight="500">
                                                            ₹{formatCurrency(item.value)}
                                                        </Typography>
                                                    </Paper>
                                                ))}
                                            </Box>
                                        </Paper>

                                        {/* Mutual Fund Holdings */}
                                        <Paper sx={{
                                            p: 3,
                                            borderRadius: 2,
                                            boxShadow: theme.shadows[2]
                                        }}>
                                            <Box sx={{ mb: 3 }}>
                                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <ShowChartIcon sx={{ color: 'primary.main' }} />
                                                    Mutual Fund Holdings
                                                </Typography>
                                                <Divider sx={{ mb: 2 }} />
                                                {accountInfo?.mutualFunds?.length > 0 && (
                                                    <Box sx={{
                                                        display: 'grid',
                                                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                                        gap: 2,
                                                        mb: 3
                                                    }}>
                                                        {(() => {
                                                            const totalInvestment = accountInfo.mutualFunds.reduce(
                                                                (sum, fund) => sum + (fund.average_cost * fund.units), 0
                                                            );
                                                            const currentValue = accountInfo.mutualFunds.reduce(
                                                                (sum, fund) => sum + (fund.current_nav * fund.units), 0
                                                            );
                                                            const totalPnL = currentValue - totalInvestment;
                                                            const totalPnLPercentage = totalInvestment > 0
                                                                ? ((currentValue - totalInvestment) / totalInvestment) * 100
                                                                : 0;

                                                            return (
                                                                <>
                                                                    <Paper
                                                                        sx={{
                                                                            p: 2.5,
                                                                            borderRadius: 2,
                                                                            background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.primary.main, 0.1)})`,
                                                                            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                                                                        }}
                                                                    >
                                                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                            Total Investment
                                                                        </Typography>
                                                                        <Typography variant="h6" color="primary.main" noWrap fontWeight="500">
                                                                            ₹{formatCurrency(totalInvestment)}
                                                                        </Typography>
                                                                    </Paper>
                                                                    <Paper
                                                                        sx={{
                                                                            p: 2.5,
                                                                            borderRadius: 2,
                                                                            background: `linear-gradient(45deg, ${alpha(theme.palette.info.main, 0.05)}, ${alpha(theme.palette.info.main, 0.1)})`,
                                                                            border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`
                                                                        }}
                                                                    >
                                                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                            Current Value
                                                                        </Typography>
                                                                        <Typography variant="h6" color="info.main" noWrap fontWeight="500">
                                                                            ₹{formatCurrency(currentValue)}
                                                                        </Typography>
                                                                    </Paper>
                                                                    <Paper
                                                                        sx={{
                                                                            p: 2.5,
                                                                            borderRadius: 2,
                                                                            background: `linear-gradient(45deg, ${alpha(theme.palette[totalPnL >= 0 ? 'success' : 'error'].main, 0.05)}, ${alpha(theme.palette[totalPnL >= 0 ? 'success' : 'error'].main, 0.1)})`,
                                                                            border: `1px solid ${alpha(theme.palette[totalPnL >= 0 ? 'success' : 'error'].main, 0.1)}`
                                                                        }}
                                                                    >
                                                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                            Total P&L ({totalPnLPercentage.toFixed(2)}%)
                                                                        </Typography>
                                                                        <Typography
                                                                            variant="h6"
                                                                            color={totalPnL >= 0 ? 'success.main' : 'error.main'}
                                                                            noWrap
                                                                            fontWeight="500"
                                                                        >
                                                                            ₹{formatCurrency(totalPnL)}
                                                                        </Typography>
                                                                    </Paper>
                                                                </>
                                                            );
                                                        })()}
                                                    </Box>
                                                )}
                                            </Box>
                                            <TableContainer>
                                                <Table size="small" sx={{
                                                    '& .MuiTableCell-root': {
                                                        py: 1.5,
                                                        fontSize: '0.875rem'
                                                    },
                                                    '& .MuiTableHead-root': {
                                                        bgcolor: alpha(theme.palette.primary.main, 0.05)
                                                    }
                                                }}>
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell sx={{ width: '40%', fontWeight: 600 }}>Scheme Name</TableCell>
                                                            <TableCell align="right" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>Units</TableCell>
                                                            <TableCell align="right" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>Average Cost</TableCell>
                                                            <TableCell align="right" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>Current NAV</TableCell>
                                                            <TableCell align="right" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>P&L</TableCell>
                                                            <TableCell align="right" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>P&L %</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {accountInfo?.mutualFunds?.map((fund, index) => (
                                                            <TableRow
                                                                key={index}
                                                                sx={{
                                                                    '&:nth-of-type(odd)': {
                                                                        bgcolor: alpha(theme.palette.primary.main, 0.02)
                                                                    },
                                                                    '&:hover': {
                                                                        bgcolor: alpha(theme.palette.primary.main, 0.05)
                                                                    }
                                                                }}
                                                            >
                                                                <TableCell sx={{ maxWidth: '40%' }}>
                                                                    <Typography noWrap variant="body2">
                                                                        {fund.scheme_name}
                                                                    </Typography>
                                                                </TableCell>
                                                                <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                                                                    {fund.units.toFixed(3)}
                                                                </TableCell>
                                                                <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                                                                    ₹{formatCurrency(fund.average_cost)}
                                                                </TableCell>
                                                                <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                                                                    ₹{formatCurrency(fund.current_nav)}
                                                                </TableCell>
                                                                <TableCell align="right">
                                                                    <Typography
                                                                        variant="body2"
                                                                        sx={{
                                                                            color: fund.pnl >= 0 ? 'success.main' : 'error.main',
                                                                            fontFamily: 'monospace',
                                                                            fontWeight: 'medium'
                                                                        }}
                                                                    >
                                                                        ₹{formatCurrency(fund.pnl)}
                                                                    </Typography>
                                                                </TableCell>
                                                                <TableCell align="right">
                                                                    <Typography
                                                                        variant="body2"
                                                                        sx={{
                                                                            color: fund.pnl_percentage >= 0 ? 'success.main' : 'error.main',
                                                                            fontFamily: 'monospace',
                                                                            fontWeight: 'medium'
                                                                        }}
                                                                    >
                                                                        {fund.pnl_percentage.toFixed(2)}%
                                                                    </Typography>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        </Paper>
                                    </Stack>
                                </Grid>
                            )}
                        </Grid>
                    </Stack>
                )}
            </Container>
        </Box>
    );
};

export default ZerodhaAccount; 