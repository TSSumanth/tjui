import React, { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import './Table.css'
import { AssignTradesToStrategy } from '../Strategies/AssignTradesPopup'

const formatDate = (dateString) => {
    if (!dateString) return ""; // Handle empty or undefined values
    try {
        return format(parseISO(dateString), "yyyy-MM-dd HH:mm"); // Converts to "YYYY-MM-DD HH:MM"
    } catch (error) {
        console.error("Invalid date:", dateString);
        return "Invalid Date"; // Fallback value
    }
};

function TradesTable({ data, includeColumns = [], columnAliases = {}, updateTrade }) {
    const [sortedData, setSortedData] = useState(data);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
    const [selectedTrades, setSelectedTrades] = useState([]);
    const [showAssignTradesPopup, setShowAssignTradesPopup] = useState(false);

    // Handle selection toggle
    const handleTradeSelection = (trade) => {
        setSelectedTrades((prev) =>
            prev.includes(trade)
                ? prev.filter((currenttrade) => currenttrade.tradeid !== trade.tradeid) // Remove if already selected
                : [...prev, trade] // Add if not selected
        );
    };

    // Whenever 'data' changes, update tableData
    useEffect(() => {
        if (data) {
            setSortedData(data); // Reset with new data
        }
    }, [data]); // ✅ Runs only when 'data' changes

    // Extract column headers dynamically
    const columns = data.length > 0 ? Object.keys(data[0]).filter(col => includeColumns.includes(col)) : [];

    // Sorting logic
    const handleSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        const sorted = [...sortedData].sort((a, b) => {
            if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
            if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
            return 0;
        });
        setSortedData(sorted);
        setSortConfig({ key, direction });
    };

    const assignToStrategy = async () => {
        setShowAssignTradesPopup(true)
    }

    return (
        <div className="trades-table-container">
            <button
                onClick={() => assignToStrategy(selectedTrades)}
                disabled={selectedTrades.length === 0}
            >
                Assign to Strategy
            </button>
            <table className="trades-table">
                <thead className="trades-header">
                    <tr>
                        <th>Select</th>
                        {columns.map((col) => (
                            <th key={col} onClick={() => handleSort(col)} style={{ cursor: "pointer" }} >
                                {columnAliases[col] || col.toUpperCase()}  {sortConfig.key === col ? (sortConfig.direction === "asc" ? "🔼" : "🔽") : ""}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {sortedData.map((row, rowIndex) => (
                        <tr key={rowIndex} className='table-rows' id='traderows' onClick={() => updateTrade(row)}>
                            <td onClick={(e) => e.stopPropagation()}>
                                <input
                                    type="checkbox"
                                    checked={selectedTrades.includes(row)}
                                    onChange={(e) => {
                                        e.stopPropagation(); // Prevents triggering row click
                                        handleTradeSelection(row);
                                    }}
                                />
                            </td>
                            {columns.map((col) => (
                                <td key={col}>
                                    {col === "entrydate" || col === "exitdate" || col === 'lastmodifieddate' ? formatDate(row[col]) : row[col]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            {showAssignTradesPopup && <AssignTradesToStrategy title = {"Link Trades to Strategy"} tradeDetails = {selectedTrades} onSubmit={() =>setShowAssignTradesPopup(false)}/>}
        </div>
    )
}

export default TradesTable;