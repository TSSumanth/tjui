import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Container,
    Typography,
    Button,
    Grid,
    Skeleton
} from '@mui/material';
import { useZerodha } from '../context/ZerodhaContext';
import { getLoginUrl } from '../services/zerodha/authentication';
import { setWebSocketAccessToken } from '../services/zerodha/webhook';
import { getAllPortfolioValues } from '../services/portfolioValue';
import RefreshIcon from '@mui/icons-material/Refresh';
import LinkIcon from '@mui/icons-material/Link';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import ZerodhaSubHeader from '../components/zerodha/ZerodhaSubHeader';
import AccountSummary from '../components/AccountDetails/AccountSummary';
import EquityMargins from '../components/AccountDetails/EquityMargins';
import PortfolioDashboard from '../components/AccountDetails/PortfolioDashboard';
import MutualFunds from '../components/AccountDetails/MutualFunds';

const ZerodhaAccount = () => {
    const { isAuth, sessionActive, accountInfo, fetchData } = useZerodha();
    const [loading, setLoading] = useState(false);
    const [portfolioAccounts, setPortfolioAccounts] = useState([]);
    const [portfolioLoading, setPortfolioLoading] = useState(false);

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
                    const { access_token, public_token } = event.data.data;
                    localStorage.setItem('zerodha_access_token', access_token);
                    localStorage.setItem('zerodha_public_token', public_token);
                    // Set WebSocket access token
                    setWebSocketAccessToken(access_token).catch(error => {
                        console.error('Failed to set WebSocket access token:', error);
                    });
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
                            <AccountSummary accountInfo={accountInfo} />
                            <EquityMargins accountInfo={accountInfo} />
                            <PortfolioDashboard
                                portfolioAccounts={portfolioAccounts}
                                portfolioLoading={portfolioLoading}
                                accountInfo={accountInfo}
                            />
                            {accountInfo.mutualFunds && accountInfo.mutualFunds.length > 0 && (
                                <MutualFunds mutualFunds={accountInfo.mutualFunds} />
                            )}
                        </Grid>
                    ) : null}
                </Container>
            </Box>
        </>
    );
};

// export default React.memo(ZerodhaAccount); 
export default ZerodhaAccount;