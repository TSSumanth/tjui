import React, { useState, useEffect } from "react";
function TradesTable({ data }) {
    console.log(data)
    const [sortedData, setSortedData] = useState(data);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

    // Whenever 'data' changes, update tableData
    useEffect(() => {
        if (data) {
            setSortedData(data); // Reset with new data
        }
    }, [data]); // ✅ Runs only when 'data' changes

    // Extract column headers dynamically
    const columns = data.length > 0 ? Object.keys(data[0]) : [];

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
                            <th key={col} onClick={() => handleSort(col)} style={{ cursor: "pointer" }}>
                                {col.toUpperCase()} {sortConfig.key === col ? (sortConfig.direction === "asc" ? "🔼" : "🔽") : ""}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {sortedData.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            {columns.map((col) => (
                                <td key={col}>{row[col]}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default TradesTable;