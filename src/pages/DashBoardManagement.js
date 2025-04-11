import { useEffect, useState } from "react";
import Header from '../components/Header/Header'
import LineChartMUI from '../components/Dashboard/LineChart'
import { getReportByDateRange } from "../services/profitlossreport";

// Utility function to get financial year range
const getFinancialYearRange = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;

    const startYear = month >= 4 ? year : year - 1;
    const endYear = month >= 4 ? year + 1 : year;

    return {
        startDate: `${startYear}-04-01`,
        endDate: `${endYear}-03-31`
    };
};

// Constants for data processing
const SELECTED_FIELDS = ["date", "stock_pl", "fo_pl", "total_pl"];

function Dashboard() {
    const [profitLossData, setProfitLossData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const processProfitLossData = (data) => {
        if (!Array.isArray(data)) {
            return [];
        }

        return data
            .map(item => Object.fromEntries(
                SELECTED_FIELDS.map(field => [field, item[field]])
            ))
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    };

    const fetchProfitLossReport = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const dateRange = getFinancialYearRange();
            const rawData = await getReportByDateRange(dateRange.startDate, dateRange.endDate);

            const processedData = processProfitLossData(rawData);
            setProfitLossData(processedData);
        } catch (err) {
            setError("Failed to fetch profit loss data");
            console.error("Error fetching profit loss report:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProfitLossReport();
    }, []);

    if (isLoading) {
        return (
            <div>
                <Header />
                <div>Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div>
                <Header />
                <div className="error-message">{error}</div>
            </div>
        );
    }

    return (
        <div>
            <Header />
            <LineChartMUI
                data={profitLossData}
                title="Profit Loss Report for Current Financial Year"
            />
        </div>
    );
}

export default Dashboard;