import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, Button, CircularProgress, Container, Stack, Chip } from '@mui/material';
import { useZerodha } from '../context/ZerodhaContext';
import Header from '../components/Header/Header';
import { useNavigate } from 'react-router-dom';
import { ShowChart } from '@mui/icons-material';

const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5003';

// Test comment for approval workflow demonstration
const ZerodhaAccount = () => {
    const { isAuth, loading, error, fetchData, setIsAuth, isAutoSync } = useZerodha();
    const [loginUrl, setLoginUrl] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchLoginUrl = async () => {
            try {
                console.log('Fetching login URL...');
                const response = await fetch(`${API_URL}/api/zerodha/login-url`);
                console.log('Response status:', response.status);
                const data = await response.json();
                console.log('Login URL response:', data);
                if (data.success) {
                    setLoginUrl(data.loginUrl);
                } else {
                    console.error('Failed to get login URL:', data.error);
                }
            } catch (error) {
                console.error('Error fetching login URL:', error);
                console.error('Error details:', {
                    message: error.message,
                    stack: error.stack
                });
            }
        };
        fetchLoginUrl();

        // Add message listener for popup window
        const handleMessage = (event) => {
            console.log('Received message:', event.data);
            if (event.data.type === 'ZERODHA_AUTH_SUCCESS') {
                const { access_token, public_token } = event.data.data;
                console.log('Storing tokens:', { access_token, public_token });
                localStorage.setItem('zerodha_access_token', access_token);
                localStorage.setItem('zerodha_public_token', public_token);
                setIsAuth(true);
                fetchData();
            } else if (event.data.type === 'ZERODHA_AUTH_ERROR') {
                console.error('Authentication error:', event.data.error);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [fetchData, setIsAuth]);

    const handleLogin = () => {
        if (loginUrl) {
            const width = 600;
            const height = 600;
            const left = window.screenX + (window.outerWidth - width) / 2;
            const top = window.screenY + (window.outerHeight - height) / 2;
            const popup = window.open(
                loginUrl,
                'Zerodha Login',
                `width=${width},height=${height},left=${left},top=${top}`
            );

            if (!popup) {
                console.error('Popup was blocked by the browser');
            }
        }
    };

    const handleRefresh = () => {
        fetchData();
    };

    const handleFNOClick = () => {
        navigate('/zerodha/fno-instruments');
    };

    const handlePortfolioClick = () => {
        navigate('/zerodha/portfolio');
    };

    if (!isAuth) {
        return (
            <div>
                <Header />
                <Container maxWidth="md" sx={{ mt: 4 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h5" gutterBottom>
                                Zerodha Authentication Required
                            </Typography>
                            <Typography variant="body1" color="textSecondary">
                                Please authenticate with Zerodha to view your account details.
                            </Typography>
                            <Box mt={2}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleLogin}
                                    disabled={!loginUrl}
                                >
                                    Login with Zerodha
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Container>
            </div>
        );
    }

    return (
        <div>
            <Header />
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center" gap={2}>
                        <Typography variant="h4">Zerodha Account</Typography>
                        <Chip
                            label="Connected to Zerodha"
                            color="success"
                            sx={{ height: '24px' }}
                        />
                        <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={() => {
                                localStorage.removeItem('zerodha_access_token');
                                localStorage.removeItem('zerodha_public_token');
                                setIsAuth(false);
                            }}
                        >
                            Disconnect
                        </Button>
                    </Box>
                    <Stack direction="row" spacing={2}>
                        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                            <Button
                                variant="contained"
                                onClick={handleFNOClick}
                                startIcon={<ShowChart />}
                            >
                                F&O Instruments
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handlePortfolioClick}
                            >
                                Portfolio
                            </Button>
                        </Box>
                        <Chip
                            label={isAutoSync ? "Auto-sync ON" : "Auto-sync OFF"}
                            color={isAutoSync ? "success" : "default"}
                            size="small"
                            sx={{ height: '32px' }}
                        />
                        <Button
                            variant="outlined"
                            onClick={handleRefresh}
                            disabled={loading}
                            startIcon={loading && <CircularProgress size={20} />}
                            title={isAutoSync ? "Auto-sync is active during market hours (9:00 AM - 3:30 PM, Mon-Fri)" : "Click to manually sync data"}
                        >
                            {loading ? 'Refreshing...' : 'Sync Data'}
                        </Button>
                    </Stack>
                </Box>

                {error && (
                    <Box mb={3}>
                        <Typography color="error">{error}</Typography>
                    </Box>
                )}
            </Container>
        </div>
    );
};

export default ZerodhaAccount; 