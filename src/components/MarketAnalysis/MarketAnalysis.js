import React, { useState, useEffect } from 'react';
import { getmarketanalysis } from '../../services/marketanalysis.js';
import PagenationTable from './AnalysisTable.js'

const tableComuns = [
    { accessorKey: "id", header: "Id" },
    { accessorKey: "date", header: "Analysis Date" },
    { accessorKey: "premarket_analysis", header: "Pre Market Analysis" },
    { accessorKey: "event_day", header: "Event Day ?" },
    { accessorKey: "event_description", header: "Event Description" },
    { accessorKey: "premarket_expectation", header: "Pre Market Expectation" },
    { accessorKey: "market_movement", header: "Market Movement" },
    { accessorKey: "postmarket_analysis", header: "Post Market Analysis" }
];

function MarketAnalysisSection() {
    const [tableData, setTableData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchReport = async () => {
        setTableData({});
        setLoading(true);
        setError(null);
        try {
            const data = await getmarketanalysis();
            setTableData(data);
        }
        catch (err) {
            console.error("Error fetching data:", err);
            setError("Failed to load report data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, []);

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Daily Market Analysis</h1>

            <section id="search-section">
                <legend>SEARCH Analysis</legend>
                <div className="input-field first-wrap">
                </div>
            </section>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            {tableData.length > 0 ? (
                <PagenationTable columns={tableComuns} initialdata={tableData} />
            ) : (
                !loading && (
                    <>
                        <p className="text-gray-500">No data available. Click &quot;Get Analysis&quot; with new search input to load data.</p>
                        <PagenationTable columns={tableComuns} initialdata={tableData} />
                    </>
                )
            )}
        </div>
    );
}

export default MarketAnalysisSection;