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
import { useLocation, useParams } from "react-router-dom";
import UpdateStrategy from '../components/Strategies/UpdateStrategy';

const UpdateStrategyPage = () => {
    const { id } = useParams();
    const location = useLocation();
    const strategy = location.state?.strategy;
    console.log("Details: " + strategy)
    return (
        <div>
            <UpdateStrategy id={id} />
        </div>);
};

export default UpdateStrategyPage;