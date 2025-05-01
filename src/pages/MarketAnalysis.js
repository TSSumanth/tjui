import React from 'react';
import AnalysisList from '../components/MarketAnalysis/AnalysisList'
import MarketAnalysisSection from '../components/MarketAnalysis/MarketAnalysis';

function MarketAnalysis() {
    return (
        <div>
            <AnalysisList />
            <MarketAnalysisSection />
        </div>
    );
}

export default MarketAnalysis;