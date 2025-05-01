import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Grid, Paper, Button, Stack, CircularProgress } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
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
import TradingInstrumentsComponent from '../components/zerodha/TradingInstruments';

const TradingInstrumentsPage = () => {
    const navigate = useNavigate();

    return (
        <div>
            <Container maxWidth={false} sx={{ mt: 4, px: 4 }}>
                <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
                    <Button
                        variant="outlined"
                        onClick={() => navigate('/zerodha/accountdetails')}
                    >
                        ← Back to Account
                    </Button>
                </Box>
                <TradingInstrumentsComponent />
            </Container>
        </div>
    );
};

export default TradingInstrumentsPage; 