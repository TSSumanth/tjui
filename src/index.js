import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import MarketAnalysis from '../src/pages/MarketAnalysis'
import Trades from '../src/pages/Trades'
import Dashboard from './pages/DashBoardManagement'
import TagManagement from './pages/TagManagement'
import Report from '../src/pages/ProfitLossReport'
import Home from './pages/Home'
import reportWebVitals from './reportWebVitals';
import { BrowserRouter, Routes, Route } from "react-router-dom";
export default function MyApp() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="marketanalysis" element={<MarketAnalysis />} />
                <Route path="trades" element={<Trades />} />
                <Route path="profitlossreport" element={<Report />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="tagmanagement" element={<TagManagement />} />
                <Route path="*" element={<Home />} />
            </Routes>
        </BrowserRouter>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<MyApp />);

reportWebVitals();