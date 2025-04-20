import React from 'react';
import {
    Button,
    CircularProgress,
    Alert,
    Box,
    Chip
} from '@mui/material';
import { isAuthenticated, logout, getLoginUrl, handleLoginCallback } from '../../services/zerodha/authentication';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';

const AuthenticationCard = () => {
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState(null);
    const [isLoggedIn, setIsLoggedIn] = React.useState(false);

    React.useEffect(() => {
        setIsLoggedIn(isAuthenticated());

        const handleMessage = async (event) => {
            if (event.data.type === 'ZERODHA_AUTH_SUCCESS') {
                try {
                    const { access_token, public_token } = event.data.data;
                    console.log('Authentication successful:', { access_token, public_token });

                    // Store tokens and update state
                    localStorage.setItem('zerodha_access_token', access_token);
                    localStorage.setItem('zerodha_public_token', public_token);
                    setIsLoggedIn(true);
                    setIsLoading(false);

                    // Handle the login callback
                    await handleLoginCallback({ request_token: access_token });
                } catch (error) {
                    console.error('Error handling authentication:', error);
                    setError('Failed to complete authentication');
                    setIsLoading(false);
                }
            } else if (event.data.type === 'ZERODHA_AUTH_ERROR') {
                console.error('Authentication failed:', event.data.error);
                setError(event.data.error || 'Authentication failed');
                setIsLoading(false);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const handleLogin = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const loginUrl = await getLoginUrl();
            console.log('Opening login URL:', loginUrl);

            const authWindow = window.open(
                loginUrl,
                'Zerodha Login',
                'width=800,height=600,status=yes,scrollbars=yes'
            );

            if (!authWindow) {
                setError('Please allow popups for this site to proceed with authentication');
                setIsLoading(false);
                return;
            }

            const checkWindow = setInterval(() => {
                if (authWindow.closed) {
                    clearInterval(checkWindow);
                    if (!isAuthenticated()) {
                        setError('Authentication window was closed');
                        setIsLoading(false);
                    }
                }
            }, 500);

        } catch (err) {
            setError('Failed to initiate login process');
            console.error('Login error:', err);
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        setIsLoggedIn(false);
    };

    return (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}>
            {error && (
                <Alert severity="error" sx={{ flexGrow: 1 }}>
                    {error}
                </Alert>
            )}

            {isLoggedIn ? (
                <>
                    <Chip
                        label="Connected to Zerodha"
                        color="success"
                        size="small"
                        icon={<LinkIcon />}
                    />
                    <Button
                        variant="outlined"
                        color="error"
                        onClick={handleLogout}
                        disabled={isLoading}
                        size="small"
                        startIcon={<LinkOffIcon />}
                    >
                        Disconnect
                    </Button>
                </>
            ) : (
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleLogin}
                    disabled={isLoading}
                    size="small"
                    startIcon={isLoading ? <CircularProgress size={16} /> : <LinkIcon />}
                >
                    Connect Account
                </Button>
            )}
        </Box>
    );
};

export default AuthenticationCard; 