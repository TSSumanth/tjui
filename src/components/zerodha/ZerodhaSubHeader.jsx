import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    AppBar,
    Toolbar,
    Box,
    Button,
    Typography,
    IconButton,
    Tooltip
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import PsychologyIcon from '@mui/icons-material/Psychology';
import LinkOffIcon from '@mui/icons-material/LinkOff';
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
            elevation={1}
            sx={{
                bgcolor: '#1a237e',
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
                    minHeight: '40px',
                    padding: '0 24px',
                    width: '100%',
                    maxWidth: '100%',
                    margin: 0
                }}
            >
                {/* Left section - Navigation */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        component={Link}
                        to="/zerodha/account"
                        startIcon={<AccountBalanceIcon />}
                        sx={{
                            color: isActive('/zerodha/account') ? 'white' : 'rgba(255, 255, 255, 0.7)',
                            fontWeight: isActive('/zerodha/account') ? 600 : 400,
                            '& .MuiSvgIcon-root': {
                                color: isActive('/zerodha/account') ? 'white' : 'rgba(255, 255, 255, 0.7)'
                            }
                        }}
                    >
                        Account
                    </Button>
                    <Button
                        component={Link}
                        to="/zerodha/portfolio"
                        startIcon={<AccountBalanceWalletIcon />}
                        sx={{
                            color: isActive('/zerodha/portfolio') ? 'white' : 'rgba(255, 255, 255, 0.7)',
                            fontWeight: isActive('/zerodha/portfolio') ? 600 : 400,
                            '& .MuiSvgIcon-root': {
                                color: isActive('/zerodha/portfolio') ? 'white' : 'rgba(255, 255, 255, 0.7)'
                            }
                        }}
                    >
                        Portfolio
                    </Button>
                    <Button
                        component={Link}
                        to="/zerodha/trading-instruments"
                        startIcon={<ShowChartIcon />}
                        sx={{
                            color: isActive('/zerodha/trading-instruments') ? 'white' : 'rgba(255, 255, 255, 0.7)',
                            fontWeight: isActive('/zerodha/trading-instruments') ? 600 : 400,
                            '& .MuiSvgIcon-root': {
                                color: isActive('/zerodha/trading-instruments') ? 'white' : 'rgba(255, 255, 255, 0.7)'
                            }
                        }}
                    >
                        Trading Instruments
                    </Button>
                    <Button
                        component={Link}
                        to="/zerodha/algo-strategies"
                        startIcon={<PsychologyIcon />}
                        sx={{
                            color: isActive('/zerodha/algo-strategies') ? 'white' : 'rgba(255, 255, 255, 0.7)',
                            fontWeight: isActive('/zerodha/algo-strategies') ? 600 : 400,
                            '& .MuiSvgIcon-root': {
                                color: isActive('/zerodha/algo-strategies') ? 'white' : 'rgba(255, 255, 255, 0.7)'
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
                            color="inherit"
                            size="small"
                            sx={{
                                color: '#ff4444',
                                backgroundColor: 'rgba(255, 68, 68, 0.1)',
                                borderRadius: '8px',
                                padding: '6px',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 68, 68, 0.2)',
                                    color: '#ff0000',
                                    transform: 'translateY(-1px)'
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