import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Grid, Paper, Button, Stack, CircularProgress } from '@mui/material';
import { Link } from 'react-router-dom';
import { getActionItems } from '../services/actionitems';
import { useZerodha } from '../context/ZerodhaContext';
import { formatCurrency } from '../utils/formatters';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PsychologyIcon from '@mui/icons-material/Psychology';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ListAltIcon from '@mui/icons-material/ListAlt';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import StrategyHeader from '../components/Strategies/StrategiesHeader'
import StrategyCards from '../components/Strategies/StrategyCard'

const StrategyPage = () => {
    return (
        <Stack sx={{ width: '100%' }}>
            <Box sx={{
                bgcolor: 'background.paper',
                py: 3,
                borderBottom: '1px solid',
                borderColor: 'divider',
                width: '100%'
            }}>
                <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <StrategyHeader />
                    </Box>
                </Container>
            </Box>
            <Box sx={{ width: '100%', bgcolor: 'background.default' }}>
                <Container maxWidth={false} sx={{ py: 4, px: { xs: 2, sm: 3, md: 4 } }}>
                    <StrategyCards />
                </Container>
            </Box>
        </Stack>
    );
};

export default StrategyPage;