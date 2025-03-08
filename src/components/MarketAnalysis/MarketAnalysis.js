import { getmarketanalysis, getmarketanalysisbyid, updateMarketAnalysis, addmarketanalysis } from "../../services/marketanalysis.js";
import React, { useState, useEffect } from "react";
import PagenationTable from './AnalysisTable.js'
import { subDays, format } from "date-fns";
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
    const [stringSearch, setStringSearch] = useState("");
    const [startDate, setStartDate] = useState(subDays(new Date(), 90)); // Default: 30 days ago
    const [endDate, setEndDate] = useState(new Date()); // Default: Today

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

    // const handleChange = (e) => {
    //     const { value } = e.target;
    //     console.log("value is: "+value)
    //     if (value !== tagSearch) {
    //         setTagSearch(value);
    //     }
    //     else if(value === "")
    //         setTagSearch("")

    // };

    // Trigger fetch when component mounts to load the last 30 days of data
    useEffect(() => {
        fetchReport(); // Automatically fetch data when the page loads
    }, []); // Empty dependency array means this runs once when the component mounts

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Daily Market Analysis</h1>

            {/* Date Filters & Get Report Button */}
            <section id="search-section">

                <legend>SEARCH Analysis</legend>

                <div className="input-field first-wrap">
                    {/* <div>
                        <label id="search-section-label">Tag Name: </label>
                        <input name="tagsearch" value={tagSearch} onChange={handleChange} placeholdertext="Enter Tag Name" />
                    </div> */}
                    {/* <button onClick={fetchReport} id="multi-button" disabled={loading} >
                        <span id="multi-button-contained-primary">
                            {loading ? "Loading..." : "Get Tags"}
                        </span>
                    </button> */}
                </div>

            </section>
            {/* Error Message */}
            {error && <p className="text-red-500 mb-4">{error}</p>}

            {tableData.length > 0 ? (
                <PagenationTable columns={tableComuns} initialdata={tableData} />
                // <PagenationTable columns={tableComuns} initialdata={tableData} DeleteRequest={deleteTag} CreateRequest={addTag} UpdateRequest={updateTag}/>
            ) : (
                !loading && (
                    <>
                        <p className="text-gray-500">No data available. Click "Get Analysis" with new search input to load data.</p>
                        <PagenationTable columns={tableComuns} initialdata={tableData} />
                    </>
                )

            )}
        </div>
    );
}

export default MarketAnalysisSection;