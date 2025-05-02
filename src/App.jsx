import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ZerodhaProvider } from './context/ZerodhaContext';
import Header from './components/Header/Header';
import Home from './pages/Home';
import ZerodhaAccount from './pages/ZerodhaAccount';
import Portfolio from './pages/Portfolio';
import ZerodhaOrders from './pages/ZerodhaOrders';
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

function App() {
    return (
        <ZerodhaProvider>
            <BrowserRouter>
                <Header />
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/zerodha" element={<Navigate to="/zerodha/account" replace />} />
                    <Route path="/zerodha/login" element={<ZerodhaAccount />} />
                    <Route path="/zerodha/account" element={<ZerodhaAccount />} />
                    <Route path="/zerodha/portfolio" element={<Portfolio />} />
                    <Route path="/zerodha/orders" element={<ZerodhaOrders />} />
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
            </BrowserRouter>
        </ZerodhaProvider>
    );
}

export default App; 