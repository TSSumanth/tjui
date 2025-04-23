import React from 'react';
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { ZerodhaProvider } from './context/ZerodhaContext';
import Home from './pages/Home';
import ZerodhaAccount from './pages/ZerodhaAccount';
import Portfolio from './pages/Portfolio';
import MarketAnalysis from './pages/MarketAnalysis';
import Trades from './pages/Trades';
import Report from './pages/ProfitLossReport';
import StrategyPage from './pages/MyStrategies';
import UpdateStrategyPage from './pages/UpdateStrategy';
import FNOInstrumentsPage from './pages/FNOInstruments';
import ActionItemsPage from './pages/ActionItems';
import MyAlgoStrategiesPage from './pages/MyAlgoStrategies';
import Dashboard from './pages/DashBoardManagement';
import TagManagement from './pages/TagManagement';

function App() {
    console.log('App component rendering');
    return (
        <ZerodhaProvider>
            <HashRouter>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/zerodha" element={<Navigate to="/zerodha/account" replace />} />
                    <Route path="/zerodha/login" element={<ZerodhaAccount />} />
                    <Route path="/zerodha/account" element={<ZerodhaAccount />} />
                    <Route path="/zerodha/portfolio" element={<Portfolio />} />
                    <Route path="/zerodha/fno-instruments" element={<FNOInstrumentsPage />} />
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
            </HashRouter>
        </ZerodhaProvider>
    );
}

export default App; 