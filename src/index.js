import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import MarketAnalysis from './pages/MarketAnalysis'
import Trades from './pages/Trades'
import Dashboard from './pages/DashBoardManagement'
import TagManagement from './pages/TagManagement'
import Report from './pages/ProfitLossReport'
import Home from './pages/Home'
import StrategyPage from './pages/MyStrategies'
import UpdateStrategyPage from './pages/UpdateStrategy'
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
                <Route path="mystrategies" element={<StrategyPage />} />
                <Route path="updatestrategy/:id" element={<UpdateStrategyPage />} />
                {/* <Route path="*" element={<Home />} /> */}
            </Routes>
        </BrowserRouter>
    );
}

// export default function MyApp() {
//     return (
//         <BrowserRouter>
//             <Routes>
//                 <Route path="*" element={<StrategyPage />} />
//             </Routes>
//         </BrowserRouter>
//     );
// }



const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<MyApp />);

reportWebVitals();