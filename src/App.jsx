import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ZerodhaProvider, useZerodha } from './context/ZerodhaContext';
import Header from './components/Header/Header';
import Home from './pages/Home';
import ZerodhaAccount from './pages/ZerodhaAccount';
import Portfolio from './pages/Portfolio';
import MarketAnalysis from './pages/MarketAnalysis';
import Trades from './pages/Trades';
import Report from './pages/ProfitLossReport';
import StrategyPage from './pages/MyStrategies';
import UpdateStrategyPage from './pages/UpdateStrategy';
import TradingInstrumentsPage from './pages/TradingInstruments';
import ActionItemsPage from './pages/ActionItems';
import MyAlgoStrategiesPage from './pages/MyAlgoStrategies';
import Dashboard from './pages/DashBoardManagement';
import TagManagement from './pages/TagManagement';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const ZerodhaPageWrapper = ({ children }) => {
    const { sessionActive, isAuth } = useZerodha();
    const location = useLocation();
    const isZerodhaPage = location.pathname.startsWith('/zerodha');

    // Only run Zerodha logic on /zerodha pages
    if (!isZerodhaPage) {
        return children;
    }

    // If on Zerodha page but not authenticated, redirect to login
    if (!isAuth && location.pathname !== '/zerodha/login') {
        return <Navigate to="/zerodha/login" replace />;
    }

    return children;
};

const AppContent = () => {
    const theme = useTheme();

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                <Header />
                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        mt: '64px', // Account for main header
                        pt: 2,
                        px: 3,
                        maxWidth: '1400px',
                        margin: '0 auto',
                        width: '100%'
                    }}
                >
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/zerodha" element={<Navigate to="/zerodha/account" replace />} />
                        <Route path="/zerodha/login" element={<ZerodhaAccount />} />
                        <Route path="/zerodha/account" element={<ZerodhaAccount />} />
                        <Route path="/zerodha/portfolio" element={<Portfolio />} />
                        <Route path="/zerodha/trading-instruments" element={<TradingInstrumentsPage />} />
                        <Route path="/zerodha/algo-strategies" element={<MyAlgoStrategiesPage />} />
                        <Route path="/marketanalysis" element={<MarketAnalysis />} />
                        <Route path="/trades" element={<Trades />} />
                        <Route path="/profitlossreport" element={<Report />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/tagmanagement" element={<TagManagement />} />
                        <Route path="/mystrategies" element={<StrategyPage />} />
                        <Route path="/updatestrategy/:id" element={<UpdateStrategyPage />} />
                        <Route path="/actionitems" element={<ActionItemsPage />} />
                        <Route path="*" element={<Home />} />
                    </Routes>
                </Box>
            </Box>
        </ThemeProvider>
    );
};

const App = () => {
    return (
        <BrowserRouter>
            <ZerodhaProvider>
                <ZerodhaPageWrapper>
                    <AppContent />
                </ZerodhaPageWrapper>
            </ZerodhaProvider>
        </BrowserRouter>
    );
};

export default App; 