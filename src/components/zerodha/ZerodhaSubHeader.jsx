import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    AppBar,
    Toolbar,
    Box,
    Button,
    Typography,
    IconButton,
    Tooltip,
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import PsychologyIcon from '@mui/icons-material/Psychology';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import ListAltIcon from '@mui/icons-material/ListAlt';
import { useZerodha } from '../../context/ZerodhaContext';

const ZerodhaSubHeader = () => {
    const location = useLocation();
    const { sessionActive, handleLogout } = useZerodha();

    console.log('ZerodhaSubHeader Debug:', {
        pathname: location.pathname,
        sessionActive,
        shouldRender: sessionActive
    });

    // Only render if we have an active session
    if (!sessionActive) {
        console.log('ZerodhaSubHeader not rendering due to inactive session');
        return null;
    }

    const isActive = (path) => {
        return location.pathname === path;
    };

    const handleDisconnect = () => {
        handleLogout();
        window.location.href = '/';
    };

    return (
        <AppBar
            position="static"
            color="default"
            elevation={0}
            sx={{
                backgroundColor: "#1a237e",
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                width: '100%',
                display: 'block',
                visibility: 'visible',
                opacity: 1,
                m: 0,
                p: 0
            }}
        >
            <Toolbar
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    minHeight: '48px',
                    padding: '0 32px',
                    width: '100%',
                    maxWidth: '100%',
                    margin: 0,
                    gap: 4
                }}
            >
                {/* Left section - Navigation */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        component={Link}
                        to="/zerodha/account"
                        startIcon={<AccountBalanceIcon />}
                        variant={isActive('/zerodha/account') ? 'contained' : 'text'}
                        color="primary"
                        size="small"
                        sx={{
                            textTransform: 'none',
                            fontWeight: 500,
                            color: 'white',
                            fontSize: '1rem',
                            '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            },
                            '&.MuiButton-contained': {
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                                }
                            }
                        }}
                    >
                        Account
                    </Button>
                    <Button
                        component={Link}
                        to="/zerodha/portfolio"
                        startIcon={<AccountBalanceWalletIcon />}
                        variant={isActive('/zerodha/portfolio') ? 'contained' : 'text'}
                        color="primary"
                        size="small"
                        sx={{
                            textTransform: 'none',
                            fontWeight: 500,
                            color: 'white',
                            fontSize: '1rem',
                            '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            },
                            '&.MuiButton-contained': {
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                                }
                            }
                        }}
                    >
                        Portfolio
                    </Button>
                    <Button
                        component={Link}
                        to="/zerodha/orders"
                        startIcon={<ListAltIcon />}
                        variant={isActive('/zerodha/orders') ? 'contained' : 'text'}
                        color="primary"
                        size="small"
                        sx={{
                            textTransform: 'none',
                            fontWeight: 500,
                            color: 'white',
                            fontSize: '1rem',
                            '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            },
                            '&.MuiButton-contained': {
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                                }
                            }
                        }}
                    >
                        Orders
                    </Button>
                    <Button
                        component={Link}
                        to="/zerodha/trading-instruments"
                        startIcon={<ShowChartIcon />}
                        variant={isActive('/zerodha/trading-instruments') ? 'contained' : 'text'}
                        color="primary"
                        size="small"
                        sx={{
                            textTransform: 'none',
                            fontWeight: 500,
                            color: 'white',
                            fontSize: '1rem',
                            '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            },
                            '&.MuiButton-contained': {
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                                }
                            }
                        }}
                    >
                        Trading Instruments
                    </Button>
                    <Button
                        component={Link}
                        to="/zerodha/algo-strategies"
                        startIcon={<PsychologyIcon />}
                        variant={isActive('/zerodha/algo-strategies') ? 'contained' : 'text'}
                        color="primary"
                        size="small"
                        sx={{
                            textTransform: 'none',
                            fontWeight: 500,
                            color: 'white',
                            fontSize: '1rem',
                            '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            },
                            '&.MuiButton-contained': {
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                                }
                            }
                        }}
                    >
                        Algo Strategies
                    </Button>
                </Box>

                {/* Right section - Session status and disconnect */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        Connected to Zerodha
                    </Typography>
                    <Tooltip title="Disconnect from Zerodha">
                        <IconButton
                            onClick={handleDisconnect}
                            size="small"
                            sx={{
                                color: 'error.main',
                                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                borderRadius: '50%',
                                p: 1.2,
                                transition: 'all 0.2s',
                                '&:hover': {
                                    backgroundColor: 'rgba(211, 47, 47, 0.15)',
                                    color: 'error.light',
                                    transform: 'translateY(-2px)'
                                }
                            }}
                        >
                            <LinkOffIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default ZerodhaSubHeader; 