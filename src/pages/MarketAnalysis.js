
import  Header  from '../components/Header/Header'
import AnalysisList from '../components/MarketAnalysis/AnalysisList'
import MarketAnalysisSection from '../components/MarketAnalysis/MarketAnalysis';
function MarketAnalysis() {
    return (
        <div>
            <Header />
            <AnalysisList />
            <MarketAnalysisSection />
        </div>
    );
}

export default MarketAnalysis;