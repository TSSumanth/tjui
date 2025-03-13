import React, { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import './Table.css'
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
    return (
        <div className="trades-table-container">
            <table className="trades-table">
                <thead className="trades-header">
                    <tr>
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
                            {columns.map((col) => (
                                <td key={col}>
                                    {col === "entrydate" || col === "exitdate" || col === 'lastmodifieddate' ? formatDate(row[col]) : row[col]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default TradesTable;