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
    ListItemIcon,
    ListItemText,
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
import EventIcon from '@mui/icons-material/Event';
import { CreateStrategy } from '../Strategies/CreateStrategyPopup';
import { getActionItems } from '../../services/actionitems';
import { useZerodha } from '../../context/ZerodhaContext';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import MonthlyPerformanceTracker from './MonthlyPerformanceTracker';

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
                        alignItems: "center",
                        minHeight: "64px",
                        padding: "0 32px",
                        width: "100%",
                        gap: 4
                    }}
                >
                    {/* Logo */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 4 }}>
                        <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
                            <img
                                src="/logo.png"
                                alt="Logo"
                                style={{ height: 44 }}
                            />
                        </Link>
                    </Box>

                    {/* Navigation Menu */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                        <ButtonGroup />
                    </Box>

                    {/* Actions: Zerodha button and notifications */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 4 }}>
                        <Button
                            variant="contained"
                            startIcon={<AccountBalanceIcon />}
                            onClick={handleZerodhaClick}
                            sx={{
                                backgroundColor: "white",
                                color: "#1a237e",
                                minWidth: "120px",
                                padding: "8px 24px",
                                textTransform: 'none',
                                fontSize: '1rem',
                                fontWeight: 600,
                                borderRadius: '999px',
                                boxShadow: 'none',
                                letterSpacing: 0.5,
                                transition: 'all 0.2s',
                                ml: 2,
                                "&:hover": {
                                    backgroundColor: "#e3f2fd",
                                    color: "#1a237e",
                                    boxShadow: '0 2px 8px rgba(26,35,126,0.08)'
                                }
                            }}
                        >
                            Zerodha
                        </Button>
                        <IconButton
                            component={Link}
                            to="/actionitems"
                            sx={{
                                color: 'white',
                                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                borderRadius: '50%',
                                p: 1.2,
                                transition: 'all 0.2s',
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.18)',
                                    color: '#90caf9',
                                    transform: 'translateY(-2px)'
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
            
            {/* Monthly Performance Tracker - Available on all pages */}
            <MonthlyPerformanceTracker />
        </>
    );
};

const ButtonGroup = () => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [activeMenu, setActiveMenu] = useState(null);
    const [showCreateStrategy, setShowCreateStrategy] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

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
            items: {
                "Tag Management": { path: "/tags", icon: <LocalOfferIcon /> },
                "Dashboard": { path: "/dashboard", icon: <DashboardIcon /> },
                "Holidays": { path: "/holidays", icon: <EventIcon /> }
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

    return (
        <>
            <Box sx={{
                display: "flex",
                gap: 2,
                '& > button': {
                    position: 'relative',
                    background: 'none',
                    color: 'white',
                    fontWeight: 500,
                    fontSize: '1rem',
                    borderRadius: 0,
                    px: 2,
                    py: 1.5,
                    minWidth: 0,
                    letterSpacing: 0.2,
                    transition: 'color 0.2s',
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        bottom: 0,
                        width: '100%',
                        height: '2.5px',
                        background: 'linear-gradient(90deg, #42a5f5 0%, #1e88e5 100%)',
                        borderRadius: 2,
                        transform: 'scaleX(0)',
                        transition: 'transform 0.25s',
                    },
                    '&:hover, &[data-active="true"]': {
                        color: '#90caf9',
                        background: 'none',
                    },
                    '&:hover::after, &[data-active="true"]::after': {
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
                            data-active={activeMenu === menuName}
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
                                    borderRadius: 2,
                                    overflow: 'hidden',
                                    "& .MuiMenuItem-root": {
                                        padding: "10px 20px",
                                        fontSize: '1rem',
                                        fontWeight: 400,
                                        '&:hover': {
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
                    open={showCreateStrategy}
                    onCancel={() => setShowCreateStrategy(false)}
                    onSubmit={() => setShowCreateStrategy(false)}
                />
            )}
        </>
    );
};

export default Header;