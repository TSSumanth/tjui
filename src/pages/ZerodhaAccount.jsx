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
import { getLoginUrl } from '../services/zerodha/authentication';
import RefreshIcon from '@mui/icons-material/Refresh';
import LinkIcon from '@mui/icons-material/Link';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import { formatCurrency } from '../utils/formatters';
import ZerodhaSubHeader from '../components/zerodha/ZerodhaSubHeader';

const ZerodhaAccount = () => {
    const { isAuth, sessionActive, accountInfo, fetchData } = useZerodha();
    const [loading, setLoading] = useState(false);
    const theme = useTheme();

    useEffect(() => {
        if (sessionActive) {
            fetchData(true);
        }
    }, [sessionActive, fetchData]);

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

    if (!isAuth) {
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

    if (!sessionActive) {
        return (
            <>
                {subHeader}
                <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
                    <Container maxWidth="lg">
                        <Box sx={{
                            mt: 8,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}>
                            <CircularProgress />
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
                            <Typography variant="h4">Zerodha Account</Typography>
                        </Box>
                        <Stack direction="row" spacing={2}>
                            <Button
                                variant="outlined"
                                startIcon={<RefreshIcon />}
                                onClick={() => fetchData(true)}
                            >
                                Refresh
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                component={Link}
                                to="/zerodha/portfolio"
                            >
                                View Portfolio
                            </Button>
                        </Stack>
                    </Box>

                    {/* Main Content */}
                    {accountInfo && (
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

                            {/* Mutual Funds */}
                            {accountInfo.mutualFunds && accountInfo.mutualFunds.length > 0 && (
                                <Grid item xs={12}>
                                    <Paper sx={{ p: 3 }}>
                                        <Typography variant="h6" gutterBottom>
                                            Mutual Fund Holdings
                                        </Typography>
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
                    )}
                </Container>
            </Box>
        </>
    );
};

export default ZerodhaAccount; 