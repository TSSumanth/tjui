import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Box,
    Container,
    Typography,
    Button,
    Paper,
    Grid,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    useTheme,
    alpha,
    CircularProgress,
    Skeleton
} from '@mui/material';
import { Link } from 'react-router-dom';
import { useZerodha } from '../context/ZerodhaContext';
import { getLoginUrl } from '../services/zerodha/authentication';
import { getAllPortfolioValues } from '../services/portfolioValue';
import RefreshIcon from '@mui/icons-material/Refresh';
import LinkIcon from '@mui/icons-material/Link';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import { formatCurrency } from '../utils/formatters';
import ZerodhaSubHeader from '../components/zerodha/ZerodhaSubHeader';
import { FixedSizeList as List } from 'react-window';

// Memoized margin items calculation
const getMarginItems = (accountInfo) => [
    {
        label: 'Days Opening Balance',
        value: accountInfo?.margins?.equity?.available || 0,
        color: 'success'
    },
    {
        label: 'Amount Utilized today',
        value: accountInfo?.margins?.equity?.utilised || 0,
        color: 'warning'
    },
    {
        label: 'Available balance',
        value: accountInfo?.margins?.equity?.net || 0,
        color: 'info'
    },
    {
        label: 'Exposure',
        value: accountInfo?.margins?.equity?.exposure || 0,
        color: 'error'
    },
    {
        label: 'Option Premium',
        value: accountInfo?.margins?.equity?.optionPremium || 0,
        color: 'secondary'
    },
    {
        label: 'Total Account Value',
        value: (accountInfo?.margins?.equity?.net || 0) +
            (accountInfo?.margins?.equity?.utilised || 0) +
            (accountInfo?.margins?.equity?.exposure || 0) +
            (accountInfo?.margins?.equity?.optionPremium || 0),
        color: 'primary'
    }
];

// Memoized Mutual Fund calculations
const getMutualFundStats = (mutualFunds) => {
    if (!mutualFunds?.length) return null;

    const totalInvested = mutualFunds.reduce((sum, fund) => sum + (fund.units * fund.average_cost), 0);
    const currentValue = mutualFunds.reduce((sum, fund) => sum + (fund.units * fund.current_nav), 0);
    const totalPL = currentValue - totalInvested;

    return { totalInvested, currentValue, totalPL };
};

// Memoized Portfolio Row component
const PortfolioRow = React.memo(function PortfolioRow({ data, index, style }) {
    const acc = data.accounts[index];
    const isCurrent = data.accountInfo && acc.account_id === data.accountInfo.clientId;

    return (
        <TableRow
            style={style}
            sx={{
                background: index % 2 === 0 ? '#f9fbfd' : '#fff',
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
});

const ZerodhaAccount = () => {
    const { isAuth, sessionActive, accountInfo, fetchData } = useZerodha();
    const [loading, setLoading] = useState(false);
    const [portfolioAccounts, setPortfolioAccounts] = useState([]);
    const [portfolioLoading, setPortfolioLoading] = useState(false);
    const theme = useTheme();

    // Memoize handlers
    const handleRefresh = useCallback(async () => {
        try {
            setLoading(true);
            setPortfolioLoading(true);
            await fetchData(true);
            const res = await getAllPortfolioValues();
            if (res.success) {
                setPortfolioAccounts(res.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
            setPortfolioLoading(false);
        }
    }, [fetchData]);

    useEffect(() => {
        if (sessionActive) {
            handleRefresh();
        }
    }, [sessionActive, handleRefresh]);

    // Memoize margin items
    const marginItems = useMemo(() => getMarginItems(accountInfo), [accountInfo]);

    // Memoize mutual fund stats
    const mutualFundStats = useMemo(() =>
        getMutualFundStats(accountInfo?.mutualFunds),
        [accountInfo?.mutualFunds]
    );

    const handleConnect = async () => {
        try {
            setLoading(true);
            const loginUrl = await getLoginUrl();
            console.log('Opening login URL:', loginUrl);

            if (!loginUrl) {
                throw new Error('Failed to get login URL from server');
            }

            const authWindow = window.open(
                loginUrl,
                'Zerodha Login',
                'width=800,height=600,status=yes,scrollbars=yes'
            );

            if (!authWindow) {
                throw new Error('Please allow popups for this site to proceed with authentication');
            }

            // Add message listener for login callback
            const handleMessage = (event) => {
                console.log('Received message:', event.data);
                if (event.data.type === 'ZERODHA_AUTH_SUCCESS') {
                    console.log('Auth success, storing tokens');
                    localStorage.setItem('zerodha_access_token', event.data.data.access_token);
                    localStorage.setItem('zerodha_public_token', event.data.data.public_token);
                    window.removeEventListener('message', handleMessage);
                    fetchData(true);
                } else if (event.data.type === 'ZERODHA_AUTH_ERROR') {
                    console.error('Auth error:', event.data.error);
                    window.removeEventListener('message', handleMessage);
                }
            };

            window.addEventListener('message', handleMessage);

            const checkWindow = setInterval(() => {
                if (authWindow.closed) {
                    clearInterval(checkWindow);
                    window.removeEventListener('message', handleMessage);
                    fetchData(true);
                }
            }, 500);
        } catch (err) {
            console.error('Error connecting:', err);
        } finally {
            setLoading(false);
        }
    };

    const subHeader = <ZerodhaSubHeader />;

    if (!isAuth || !sessionActive) {
        return (
            <>
                {subHeader}
                <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
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
                                disabled={loading}
                            >
                                {loading ? 'Connecting...' : 'Connect to Zerodha'}
                            </Button>
                        </Box>
                    </Container>
                </Box>
            </>
        );
    }

    return (
        <>
            {subHeader}
            <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
                <Container maxWidth={false} disableGutters sx={{ py: 2, px: 2 }}>
                    {/* Header Section */}
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 3
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <ShowChartIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                            <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 600 }}>
                                Zerodha Account
                            </Typography>
                        </Box>
                        <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={handleRefresh}
                            disabled={loading}
                        >
                            {loading ? 'Refreshing...' : 'Refresh Account Details'}
                        </Button>
                    </Box>

                    {/* Main Content */}
                    {loading ? (
                        <Grid container spacing={3}>
                            {[1, 2, 3].map((i) => (
                                <Grid item xs={12} key={i}>
                                    <Skeleton variant="rectangular" height={200} />
                                </Grid>
                            ))}
                        </Grid>
                    ) : accountInfo ? (
                        <Grid container spacing={3}>
                            {/* Account Summary */}
                            <Grid item xs={12}>
                                <Paper sx={{ p: 3 }}>
                                    <Typography variant="h6" gutterBottom>
                                        Account Summary
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <Typography variant="subtitle2" color="text.secondary">
                                                Client ID
                                            </Typography>
                                            <Typography variant="body1">
                                                {accountInfo.clientId}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <Typography variant="subtitle2" color="text.secondary">
                                                Name
                                            </Typography>
                                            <Typography variant="body1">
                                                {accountInfo.name}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <Typography variant="subtitle2" color="text.secondary">
                                                Email
                                            </Typography>
                                            <Typography variant="body1">
                                                {accountInfo.email}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </Paper>
                            </Grid>

                            {/* Margins */}
                            <Grid item xs={12}>
                                <Paper sx={{ p: 3 }}>
                                    <Typography variant="h6" gutterBottom>
                                        Equity Margins
                                    </Typography>
                                    <Grid container spacing={2}>
                                        {marginItems.map((item, index) => (
                                            <Grid item xs={12} sm={6} md={4} lg={2.4} key={index}>
                                                <Paper
                                                    sx={{
                                                        p: 2,
                                                        bgcolor: alpha(theme.palette[item.color].main, 0.1),
                                                        border: `1px solid ${alpha(theme.palette[item.color].main, 0.2)}`
                                                    }}
                                                >
                                                    <Typography variant="subtitle2" color="text.secondary">
                                                        {item.label}
                                                    </Typography>
                                                    <Typography variant="h6" color={`${item.color}.main`}>
                                                        ₹{formatCurrency(item.value)}
                                                    </Typography>
                                                </Paper>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Paper>
                            </Grid>

                            {/* Portfolio Dashboard */}
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

                            {/* Mutual Funds */}
                            {accountInfo.mutualFunds && accountInfo.mutualFunds.length > 0 && mutualFundStats && (
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
                                                        ₹{formatCurrency(mutualFundStats.totalInvested)}
                                                    </Typography>
                                                </Paper>
                                                <Paper elevation={2} sx={{ p: 0, flex: '1 1 120px', minWidth: 100, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
                                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mb: 0 }}>
                                                        Current Value
                                                    </Typography>
                                                    <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1 }}>
                                                        ₹{formatCurrency(mutualFundStats.currentValue)}
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
                                                            color: mutualFundStats.totalPL >= 0 ? 'success.main' : 'error.main',
                                                            lineHeight: 1
                                                        }}
                                                    >
                                                        ₹{formatCurrency(mutualFundStats.totalPL)}
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
                                                    {accountInfo.mutualFunds.map((fund, index) => {
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
                            )}
                        </Grid>
                    ) : null}
                </Container>
            </Box>
        </>
    );
};

export default React.memo(ZerodhaAccount); 