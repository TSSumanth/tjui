import { useEffect, useState } from "react";
import Header from '../components/Header/Header'
import LineChartMUI from '../components/Dashboard/LineChart'
import { getReportByDateRange } from "../services/profitlossreport";

const getFinancialYearRange = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1; // JavaScript months are 0-based

    let startYear, endYear;

    if (month >= 4) {
        // If current month is April (4) or later, financial year starts this year
        startYear = year;
        endYear = year + 1;
    } else {
        // If before April, financial year started last year
        startYear = year - 1;
        endYear = year;
    }

    const startDate = `${startYear}-04-01`;
    const endDate = `${endYear}-03-31`;

    return { startDate, endDate };
};


function Dashboard() {
    const [profitlossreportdata, setprofitlossreportdata] = useState([]);

    async function getProfitLossReport() {
        let daterange = getFinancialYearRange()
        let data = await getReportByDateRange(daterange.startDate, daterange.endDate)
        const selectedFields = ["date", "stock_pl", "fo_pl", "total_pl"]; // Fields to keep
        console.log(data)
        if (!Array.isArray(data)) {
            setprofitlossreportdata([])
            return
        }
        let filteredData = data
            .map(item => Object.fromEntries(selectedFields.map(field => [field, item[field]])))
            .sort((a, b) => new Date(a.date) - new Date(b.date));
        setprofitlossreportdata(filteredData)
        console.log(filteredData)
    }
    useEffect(() => {
        getProfitLossReport();
    }, []);
    return (
        <div>
            <Header />
            <LineChartMUI data={profitlossreportdata} title={"Profit Loss Report for Current Financial Year"} />
        </div>
    );
}

export default Dashboard;