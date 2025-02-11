import MarketAnalysisForm from "./components/MarketAnalysisForm";
import AnalysisList from "./components/AnalysisList";

function App() {
    return (
        <div>
            <h1>Trading Journal</h1>
            <MarketAnalysisForm refreshanalysis={() => window.location.reload()} />
            <br />
            <AnalysisList />
        </div>
    );
}

export default App;