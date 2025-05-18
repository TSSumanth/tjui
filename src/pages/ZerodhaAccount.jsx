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
import { getAccountInfo } from '../services/zerodha/api';
import { updateAccountSummary, getAccountSummary, getEquityMargins, getMutualFunds, updateMutualFunds, updateEquityMargins } from '../services/accountSummary';
const ZerodhaAccount = () => {
    const { isAuth, sessionActive, handleLoginSuccess } = useZerodha();
    const [loading, setLoading] = useState(true);
    const [accountInfo, setAccountInfo] = useState(null);
    const [equityMargins, setEquityMargins] = useState(null);
    const [mutualFunds, setMutualFunds] = useState([]);
    const [portfolioAccounts, setPortfolioAccounts] = useState([]);
    const [error, setError] = useState(null);
    // const [activeTab, setActiveTab] = useState('overview');
    // const [isRefreshing, setIsRefreshing] = useState(false);
    // const [lastUpdated, setLastUpdated] = useState(null);

    // Handle login success message
    const handleMessage = useCallback((event) => {
        if (event.data.type === 'ZERODHA_AUTH_SUCCESS') {
            handleLoginSuccess(event.data.data);
        } else if (event.data.type === 'ZERODHA_AUTH_ERROR') {
            setError(event.data.error);
        }
    }, [handleLoginSuccess]);

    // Add event listener for login success
    useEffect(() => {
        window.addEventListener('message', handleMessage);
        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, [handleMessage]);

    const fetchDetails = async () => {
        setLoading(true);
        const res = await getAccountSummary();
        if (res.success) {
            setAccountInfo(res.data);
        }
        const res1 = await getEquityMargins();
        if (res1.success) {
            setEquityMargins(res1.data);
        }
        const res2 = await getMutualFunds();
        if (res2.success) {
            setMutualFunds(res2.data);
            setLoading(false);
        }
        const res3 = await getAllPortfolioValues();
        if (res3.success) {
            setPortfolioAccounts(res3.data);
        }
    }

    const handleUpdateAccountDetails = async () => {
        try {
            setLoading(true);
            const res = await getAccountInfo();
            await updateAccountSummary(res.data.clientId, res.data.name, res.data.email);
            await updateEquityMargins(res.data.clientId, res.data.margins.equity);
            await updateMutualFunds(res.data.clientId, res.data.mutualFunds);
            await fetchDetails();
        } catch (error) {
            console.error('Error updating account details:', error);
        } finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        fetchDetails();
    }, []);

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

            const checkWindow = setInterval(() => {
                if (authWindow.closed) {
                    clearInterval(checkWindow);
                    // fetchData(true);
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
                            onClick={handleUpdateAccountDetails}
                            disabled={loading}
                        >
                            {loading ? 'Updating...' : 'Update Account Details'}
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
                            <EquityMargins accountInfo={equityMargins} />
                            <PortfolioDashboard
                                portfolioAccounts={portfolioAccounts}
                                portfolioLoading={loading}
                                accountInfo={accountInfo}
                            />
                            {mutualFunds && mutualFunds.length > 0 && (
                                <MutualFunds mutualFunds={mutualFunds} />
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