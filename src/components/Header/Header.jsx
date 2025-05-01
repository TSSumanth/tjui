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
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
import NotificationsIcon from '@mui/icons-material/Notifications';
import { CreateStrategy } from '../Strategies/CreateStrategyPopup';
import { getActionItems } from '../../services/actionitems';
import { useZerodha } from '../../context/ZerodhaContext';

const Header = () => {
    const [actionItemsCount, setActionItemsCount] = useState(0);
    const { sessionActive, isAuth } = useZerodha();
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Debug logging for session state
    useEffect(() => {
        console.log('Header session state:', { sessionActive, isAuth });
    }, [sessionActive, isAuth]);

    const handleZerodhaClick = () => {
        if (sessionActive) {
            navigate('/zerodha/account');
        } else {
            navigate('/zerodha/login');
        }
    };

    useEffect(() => {
        const fetchActionItems = async () => {
            try {
                const items = await getActionItems({ status: "TODO" });
                setActionItemsCount(items.length);
            } catch (error) {
                console.error('Error fetching action items:', error);
            }
        };

        fetchActionItems();
        const interval = setInterval(fetchActionItems, 300000);
        return () => clearInterval(interval);
    }, []);

    const isActive = (path) => {
        return location.pathname === path;
    };

    return (
        <>
            <AppBar
                position="fixed"
                sx={{
                    backgroundColor: "#1a237e",
                    top: 0,
                    margin: 0,
                    padding: 0,
                    boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.2)",
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    zIndex: 1000
                }}
            >
                <Toolbar
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        minHeight: "64px",
                        padding: "0 24px",
                        maxWidth: "1400px",
                        margin: "0 auto",
                        width: "100%"
                    }}
                >
                    {/* Left section - Logo and Menu */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {/* Logo */}
                        <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
                            <img
                                src="/logo.png"
                                alt="Logo"
                                style={{ height: 40 }}
                            />
                        </Link>

                        {/* Menu Items */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <ButtonGroup />
                        </Box>
                    </Box>

                    {/* Right section - Actions */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {/* Zerodha Button */}
                        <Button
                            variant="contained"
                            startIcon={<AccountBalanceIcon />}
                            onClick={handleZerodhaClick}
                            sx={{
                                backgroundColor: "white",
                                color: "#1a237e",
                                minWidth: "120px",
                                padding: "8px 16px",
                                textTransform: 'none',
                                fontSize: '0.9rem',
                                fontWeight: 500,
                                borderRadius: '8px',
                                boxShadow: 'none',
                                transition: 'all 0.2s ease',
                                "&:hover": {
                                    backgroundColor: "#e3f2fd",
                                    transform: 'translateY(-1px)',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }
                            }}
                        >
                            Zerodha
                        </Button>

                        {/* Action Items */}
                        <IconButton
                            component={Link}
                            to="/actionitems"
                            sx={{
                                color: 'white',
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                borderRadius: '8px',
                                padding: '8px',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                    transform: 'translateY(-1px)'
                                }
                            }}
                        >
                            <Badge
                                badgeContent={actionItemsCount}
                                color="error"
                                sx={{
                                    '& .MuiBadge-badge': {
                                        backgroundColor: '#f44336',
                                        color: 'white',
                                        fontSize: '0.7rem',
                                        height: '18px',
                                        minWidth: '18px',
                                        padding: '0 4px'
                                    }
                                }}
                            >
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
    };

    return (
        <>
            <Box sx={{
                display: "flex",
                gap: 4,
                '& > button': {
                    position: 'relative',
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        width: '100%',
                        height: '2px',
                        backgroundColor: 'white',
                        transform: 'scaleX(0)',
                        transition: 'transform 0.3s ease',
                    },
                    '&:hover::after': {
                        transform: 'scaleX(1)',
                    }
                }
            }}>
                {Object.entries(menuItems).map(([menuName, { icon, items }]) => (
                    <React.Fragment key={menuName}>
                        <Button
                            onClick={(e) => handleClick(e, menuName)}
                            startIcon={icon}
                            endIcon={<KeyboardArrowDownIcon />}
                            sx={{
                                color: 'white',
                                textTransform: 'none',
                                fontSize: '1rem',
                                fontWeight: isActive(Object.values(items).find(item => item.path === location.pathname)?.path) ? 600 : 400,
                                "&:hover": {
                                    backgroundColor: "transparent",
                                    color: 'white'
                                },
                                minWidth: 'auto',
                                px: 2,
                                py: 1,
                                '& .MuiSvgIcon-root': {
                                    color: 'white'
                                }
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
                            {Object.entries(items).map(([label, { path, icon, onClick }]) => (
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
                            ))}
                        </Menu>
                    </React.Fragment>
                ))}
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