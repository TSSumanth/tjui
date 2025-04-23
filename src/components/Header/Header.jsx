import React, { useState, useEffect } from "react";
import {
    AppBar,
    Toolbar,
    Button,
    Box,
    Menu,
    MenuItem,
    IconButton,
    Badge,
} from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import HomeIcon from '@mui/icons-material/Home';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PsychologyIcon from '@mui/icons-material/Psychology';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ListAltIcon from '@mui/icons-material/ListAlt';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { CreateStrategy } from '../Strategies/CreateStrategyPopup';
import { getActionItems } from '../../services/actionitems';
import SessionStatus from '../zerodha/SessionStatus';
import { useZerodha } from '../../context/ZerodhaContext';
import { getLoginUrl } from '../../services/zerodha/authentication';
import LinkOffIcon from '@mui/icons-material/LinkOff';

const Header = () => {
    const [actionItemsCount, setActionItemsCount] = useState(0);
    const { sessionActive, isAuth, checkSession } = useZerodha();
    const [loading, setLoading] = useState(false);

    // Debug logging for session state
    useEffect(() => {
        console.log('Header session state:', { sessionActive, isAuth });
    }, [sessionActive, isAuth]);

    // Only check session on mount
    useEffect(() => {
        if (isAuth) {
            checkSession();
        }
    }, [isAuth, checkSession]);

    const handleConnect = async () => {
        try {
            setLoading(true);
            console.log('Starting Zerodha connection process...');
            const loginUrl = await getLoginUrl();
            console.log('Received login URL:', loginUrl);

            if (!loginUrl) {
                console.error('No login URL received from server');
                throw new Error('Failed to get login URL from server');
            }

            console.log('Opening Zerodha login window...');
            const authWindow = window.open(
                loginUrl,
                'Zerodha Login',
                'width=800,height=600,status=yes,scrollbars=yes'
            );

            if (!authWindow) {
                console.error('Failed to open popup window');
                throw new Error('Please allow popups for this site to proceed with authentication');
            }

            const handleMessage = async (event) => {
                console.log('Received postMessage event:', event);
                console.log('Event origin:', event.origin);
                console.log('Event data:', event.data);

                if (event.data.type === 'ZERODHA_AUTH_SUCCESS') {
                    console.log('Authentication successful, storing tokens...');
                    localStorage.setItem('zerodha_access_token', event.data.data.access_token);
                    localStorage.setItem('zerodha_public_token', event.data.data.public_token);
                    window.removeEventListener('message', handleMessage);
                    console.log('Checking session after successful login...');
                    await checkSession(true);
                    console.log('Reloading page to update session state...');
                    window.location.reload();
                } else if (event.data.type === 'ZERODHA_AUTH_ERROR') {
                    console.error('Authentication error:', event.data.error);
                    window.removeEventListener('message', handleMessage);
                }
            };

            window.addEventListener('message', handleMessage);

            const checkWindow = setInterval(() => {
                if (authWindow.closed) {
                    console.log('Auth window was closed');
                    clearInterval(checkWindow);
                    window.removeEventListener('message', handleMessage);
                    setLoading(false);
                }
            }, 500);
        } catch (err) {
            console.error('Error in handleConnect:', err);
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchActionItems = async () => {
            try {
                const items = await getActionItems();
                setActionItemsCount(items.length);
            } catch (error) {
                console.error('Error fetching action items:', error);
            }
        };

        fetchActionItems();
        const interval = setInterval(fetchActionItems, 300000);
        return () => clearInterval(interval);
    }, []);

    return (
        <>
            <AppBar
                position="fixed"
                sx={{
                    backgroundColor: "#1976d2",
                    top: 0,
                    margin: 0,
                    padding: 0,
                    boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
                    zIndex: 1000
                }}
            >
                <Toolbar
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        minHeight: "64px",
                        padding: "0 24px",
                        maxWidth: "1400px",
                        margin: "0 auto",
                        width: "100%"
                    }}
                >
                    {/* Left section - Logo and Home */}
                    <Box sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        minWidth: '200px'
                    }}>
                        <Link to="/" style={{ textDecoration: "none" }}>
                            <img
                                src="/logo.png"
                                alt="Logo"
                                style={{ height: 40 }}
                            />
                        </Link>
                        <Button
                            component={Link}
                            to="/"
                            variant="contained"
                            startIcon={<HomeIcon />}
                            sx={{
                                bgcolor: "white",
                                color: "#1976d2",
                                minWidth: "100px",
                                padding: "6px 12px",
                                "&:hover": { bgcolor: "#e3f2fd" }
                            }}
                        >
                            Home
                        </Button>
                    </Box>

                    {/* Center section - Navigation */}
                    <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 2, alignItems: 'center' }}>
                        <ButtonGroup />
                        {!sessionActive && (
                            <Button
                                onClick={handleConnect}
                                variant="contained"
                                disabled={loading}
                                startIcon={<AccountBalanceIcon />}
                                sx={{
                                    bgcolor: "white",
                                    color: "#1976d2",
                                    minWidth: "120px",
                                    padding: "6px 12px",
                                    "&:hover": { bgcolor: "#e3f2fd" }
                                }}
                            >
                                {loading ? "Connecting..." : "Connect Zerodha"}
                            </Button>
                        )}
                    </Box>

                    {/* Right section - Notifications */}
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        minWidth: '200px',
                        justifyContent: 'flex-end'
                    }}>
                        <IconButton
                            component={Link}
                            to="/actionitems"
                            sx={{
                                color: 'white',
                                '&:hover': {
                                    bgcolor: 'rgba(255, 255, 255, 0.08)'
                                }
                            }}
                        >
                            <Badge badgeContent={actionItemsCount} color="error">
                                <NotificationsIcon />
                            </Badge>
                        </IconButton>
                    </Box>
                </Toolbar>
            </AppBar>
            {/* Spacer div to prevent content overlap */}
            <Box sx={{ height: "64px" }} />
        </>
    );
};

const ButtonGroup = () => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [activeMenu, setActiveMenu] = useState(null);
    const [showCreateStrategy, setShowCreateStrategy] = useState(false);
    const location = useLocation();
    const { isAuth, sessionActive } = useZerodha();

    const menuItems = {
        "Trading": {
            icon: <TrendingUpIcon />,
            items: {
                "Daily Market Analysis": { path: "/marketanalysis", icon: <AssessmentIcon /> },
                "Trades": { path: "/trades", icon: <ListAltIcon /> },
                "Profit Loss Report": { path: "/profitlossreport", icon: <AssessmentIcon /> }
            }
        },
        "Strategies": {
            icon: <PsychologyIcon />,
            items: {
                "My Strategies": { path: "/mystrategies", icon: <ListAltIcon /> },
                "Create Strategy": {
                    path: "#",
                    icon: <PsychologyIcon />,
                    onClick: () => {
                        handleClose();
                        setShowCreateStrategy(true);
                    }
                }
            }
        },
        "Management": {
            icon: <SettingsIcon />,
            items: {
                "Tag Management": { path: "/tagmanagement", icon: <LocalOfferIcon /> },
                "Dashboard": { path: "/dashboard", icon: <DashboardIcon /> }
            }
        },
        "Zerodha": {
            icon: <AccountBalanceIcon />,
            requiresSession: true,
            items: {
                "Portfolio": {
                    path: "/zerodha/portfolio",
                    icon: <AccountBalanceWalletIcon />,
                    requiresSession: true
                },
                "Account": {
                    path: "/zerodha/account",
                    icon: <AccountBalanceIcon />,
                    requiresSession: true
                },
                "Algo Strategies": {
                    path: "/zerodha/algo-strategies",
                    icon: <PsychologyIcon />,
                    requiresSession: true
                },
                "Disconnect": {
                    path: "#",
                    icon: <LinkOffIcon />,
                    requiresSession: true,
                    onClick: () => {
                        handleClose();
                        localStorage.removeItem('zerodha_access_token');
                        localStorage.removeItem('zerodha_public_token');
                        window.location.reload();
                    }
                }
            }
        }
    };

    const handleClick = (event, menuName) => {
        setAnchorEl(event.currentTarget);
        setActiveMenu(menuName);
    };

    const handleClose = () => {
        setAnchorEl(null);
        setActiveMenu(null);
    };

    const isActive = (path) => {
        return location.pathname === path;
    };

    const handleCreateStrategySubmit = () => {
        setShowCreateStrategy(false);
        // Optionally refresh the strategies list or navigate to My Strategies
    };

    return (
        <>
            <Box sx={{ display: "flex", gap: 1 }}>
                {Object.entries(menuItems).map(([menuName, { icon, items, requiresSession }]) => {
                    // Skip Zerodha menu if not authenticated
                    if (menuName === "Zerodha" && !sessionActive) {
                        return null;
                    }

                    return (
                        <React.Fragment key={menuName}>
                            <Button
                                onClick={(e) => handleClick(e, menuName)}
                                variant="contained"
                                startIcon={icon}
                                endIcon={<KeyboardArrowDownIcon />}
                                sx={{
                                    backgroundColor: "white",
                                    color: "#1976d2",
                                    minWidth: "120px",
                                    padding: "6px 12px",
                                    "&:hover": { backgroundColor: "#e3f2fd" }
                                }}
                            >
                                {menuName}
                            </Button>
                            <Menu
                                anchorEl={anchorEl}
                                open={activeMenu === menuName}
                                onClose={handleClose}
                                anchorOrigin={{
                                    vertical: 'bottom',
                                    horizontal: 'left',
                                }}
                                transformOrigin={{
                                    vertical: 'top',
                                    horizontal: 'left',
                                }}
                                PaperProps={{
                                    sx: {
                                        mt: 1,
                                        minWidth: "200px",
                                        boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)",
                                        "& .MuiMenuItem-root": {
                                            padding: "8px 16px",
                                            "&:hover": {
                                                backgroundColor: "#e3f2fd"
                                            }
                                        }
                                    }
                                }}
                            >
                                {Object.entries(items).map(([label, { path, icon, onClick, requiresSession: itemRequiresSession }]) => {
                                    // Skip items that require session when we don't have one
                                    if (itemRequiresSession && !sessionActive) {
                                        return null;
                                    }

                                    return (
                                        <MenuItem
                                            key={path}
                                            component={onClick ? 'button' : Link}
                                            to={onClick ? undefined : path}
                                            onClick={onClick || handleClose}
                                            selected={isActive(path)}
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 1,
                                                color: isActive(path) ? "#1976d2" : "inherit",
                                                fontWeight: isActive(path) ? 600 : 400,
                                                width: "100%",
                                                border: "none",
                                                background: "none",
                                                cursor: "pointer"
                                            }}
                                        >
                                            {icon}
                                            {label}
                                        </MenuItem>
                                    );
                                })}
                            </Menu>
                        </React.Fragment>
                    );
                })}
            </Box>

            {showCreateStrategy && (
                <CreateStrategy
                    title="Create New Strategy"
                    onCancel={() => setShowCreateStrategy(false)}
                    onSubmit={handleCreateStrategySubmit}
                />
            )}
        </>
    );
};

export default Header;