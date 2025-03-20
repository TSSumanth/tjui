import React, { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import {
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    TableSortLabel,
    Checkbox,
    Button,
    Paper,
    TableContainer
} from "@mui/material";
import { AssignTradesToStrategy } from "../Strategies/AssignTradesPopup";

const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
        return format(parseISO(dateString), "yyyy-MM-dd HH:mm");
    } catch (error) {
        console.error("Invalid date:", dateString);
        return "Invalid Date";
    }
};

function TradesTable({ data, includeColumns = [], columnAliases = {}, updateTrade }) {
    const [sortedData, setSortedData] = useState(data);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
    const [selectedTrades, setSelectedTrades] = useState([]);
    const [showAssignTradesPopup, setShowAssignTradesPopup] = useState(false);

    useEffect(() => {
        if (data) {
            setSortedData(data);
        }
    }, [data]);

    const columns = data.length > 0 ? Object.keys(data[0]).filter(col => includeColumns.includes(col)) : [];

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

    const handleTradeSelection = (trade) => {
        setSelectedTrades((prev) =>
            prev.some((t) => t.tradeid === trade.tradeid)
                ? prev.filter((t) => t.tradeid !== trade.tradeid)
                : [...prev, trade]
        );
    };

    return (
        <TableContainer component={Paper} sx={{ padding: 2 }}>
            <Button
                variant="contained"
                color="primary"
                onClick={() => setShowAssignTradesPopup(true)}
                disabled={selectedTrades.length === 0}
                sx={{ marginBottom: 2 }}
            >
                Assign to Strategy
            </Button>
            <Table>
                <TableHead>
                    <TableRow sx={{ backgroundColor: "lightblue" }}>
                        <TableCell>Select</TableCell>
                        {columns.map((col) => (
                            <TableCell key={col}>
                                <TableSortLabel
                                    active={sortConfig.key === col}
                                    direction={sortConfig.key === col ? sortConfig.direction : "asc"}
                                    onClick={() => handleSort(col)}
                                >
                                    {columnAliases[col] || col.toUpperCase()}
                                </TableSortLabel>
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {sortedData.map((row, index) => {
                        const isSelected = selectedTrades.some((t) => t.tradeid === row.tradeid);
                        return (
                            <TableRow
                                key={row.tradeid}
                                hover
                                onClick={() => handleTradeSelection(row)}
                                sx={{
                                    backgroundColor: isSelected ? "#b3e5fc" : index % 2 === 0 ? "#f5f5f5" : "#e0e0e0",
                                    cursor: "pointer",
                                    "&:hover": {
                                        backgroundColor: "lightgreen !important", // Light blue when hovered
                                    }
                                }}
                            >
                                <TableCell onClick={(e) => e.stopPropagation()}>
                                    <Checkbox
                                        checked={isSelected}
                                        onChange={(e) => {
                                            e.stopPropagation();
                                            handleTradeSelection(row);
                                        }}
                                    />
                                </TableCell>
                                {columns.map((col) => (
                                    <TableCell key={col} onClick={(e) => { e.stopPropagation(); updateTrade(row) }}>
                                        {(col === "entrydate" || col === "exitdate" || col === "lastmodifieddate")
                                            ? formatDate(row[col])
                                            : row[col]}
                                    </TableCell>
                                ))}
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
            {showAssignTradesPopup && (
                <AssignTradesToStrategy
                    title="Assign Trades"
                    tradeDetails={selectedTrades}
                    open={showAssignTradesPopup}
                    onSubmit={() => setShowAssignTradesPopup(false)}
                    onClose={() => setShowAssignTradesPopup(false)}
                />
            )}
        </TableContainer>
    );
}

export default TradesTable;