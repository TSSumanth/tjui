import React from "react";
import { Stack } from "@mui/material";
import Header from '../components/Header/Header'
import StrategyHeader from '../components/Strategies/StrategiesHeader'
import StrategyCards from '../components/Strategies/StrategyCard'

const StrategyPage = () => {
    return (
        <Stack>
            <Header />
            <StrategyHeader />
            <StrategyCards />
        </Stack>
    );
};

export default StrategyPage;