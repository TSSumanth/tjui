import { getReportByDateRange } from "../../services/profitlossreport";
import PagenationTable from '../Generic/PagenationTable'
import React, { useState, useEffect } from "react";
import { subDays, format } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
const reportColumns = [
    { accessorKey: "date", header: "Report Date" },
    { accessorKey: "stocks_realised", header: "Stocks Realized (₹)" },
    { accessorKey: "stocks_unrealised", header: "Stocks Unrealized (₹)" },
    { accessorKey: "stock_pl", header: "Stocks P/L (₹)" },
    { accessorKey: "fo_realised", header: "F&O Realized (₹)" },
    { accessorKey: "fo_unrealised", header: "F&O Unrealized (₹)" },
    { accessorKey: "fo_pl", header: "F&O P/L (₹)" },
    { accessorKey: "total_pl", header: "Total P/L (₹)" },
];


function ReportSection() {
    const [currentReportData, setLatestcurrentReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [startDate, setStartDate] = useState(subDays(new Date(), 90)); // Default: 30 days ago
    const [endDate, setEndDate] = useState(new Date()); // Default: Today

    // useEffect(() => {
    const fetchReport = async () => {
        setLoading(true);
        setError(null);
        const formattedStartDate = format(startDate, "yyyy-MM-dd");
        const formattedEndDate = format(endDate, "yyyy-MM-dd");
        try {
            const data = await getReportByDateRange(formattedStartDate, formattedEndDate);
            setLatestcurrentReportData(data);
        }
        catch (err) {
            console.error("Error fetching data:", err);
            setError("Failed to load report data.");
        } finally {
            setLoading(false);
        }
    };

    // Trigger fetch when component mounts to load the last 30 days of data
    useEffect(() => {
        fetchReport(); // Automatically fetch data when the page loads
    }, []); // Empty dependency array means this runs once when the component mounts

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Profit & Loss Report</h1>

            {/* Date Filters & Get Report Button */}
            <section id="search-section">

                <legend>SEARCH REPORT</legend>

                <div className="input-field first-wrap">
                    <div>
                        <label id="search-section-label">Start Date: </label>
                        <DatePicker selected={startDate} onChange={setStartDate} dateFormat="yyyy-MM-dd" id="date-picker" placeholderText="Start Date" />
                    </div>
                    <div>
                        <label id="search-section-label">End Date: </label>
                        <DatePicker selected={endDate} onChange={setEndDate} dateFormat="yyyy-MM-dd" id="date-picker" placeholderText="End Date" />
                    </div>
                    <button onClick={fetchReport} id="multi-button" disabled={loading} >
                        <span id="multi-button-contained-primary">
                            {loading ? "Loading..." : "Get Report"}
                        </span>
                    </button>
                </div>
                {/* <div className="flex items-center space-x-4 mb-4">
                    <div>
                        <label id="search-section-label">Start Date: </label>
                        <DatePicker selected={startDate} onChange={setStartDate} dateFormat="yyyy-MM-dd" id="date-picker" />
                    </div>
                    <div>
                        <label id="search-section-label">End Date: </label>
                        <DatePicker selected={endDate} onChange={setEndDate} dateFormat="yyyy-MM-dd" id="date-picker" />
                    </div>
                    <button onClick={fetchReport} id="multi-button" disabled={loading} >
                        {loading ? "Loading..." : "Get Report"}
                    </button>
                </div> */}
            </section>
            {/* Error Message */}
            {error && <p className="text-red-500 mb-4">{error}</p>}

            {/* Report Table (Only Show if Data is Available) */}
            {currentReportData.length > 0 ? (
                <PagenationTable columns={reportColumns} data={currentReportData} />
            ) : (
                !loading && <p className="text-gray-500">No data available. Click "Get Report" to load data.</p>
            )}
        </div>
    );
}

export default ReportSection;