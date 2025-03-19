import React from "react";
import { Header } from '../components/Header/Header'
import { Button, Container, Box, Typography, Stack } from "@mui/material";
import StrategyHeader from '../components/Strategies/StrategiesHeader'

const StrategyPage = () => {
    const handleCreateStrategy = () => alert("Create Strategy Clicked");
    const handleViewStrategies = () => alert("View Strategies Clicked");
    const handleAddStockTrade = () => alert("Add Stock Trade Clicked");
    const handleAddOptionTrade = () => alert("Add Option Trade Clicked");

    return (
        <Stack>
            <Header />
            <StrategyHeader />
        </Stack>
    );
};

export default StrategyPage;