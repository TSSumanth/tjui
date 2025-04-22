import React, { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Checkbox,
    Button,
    TableSortLabel,
    Box,
    Typography
} from "@mui/material";
import { AssignTradesToStrategy } from '../Strategies/AssignTradesPopup';

const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
        return format(parseISO(dateString), "yyyy-MM-dd HH:mm");
    } catch (error) {
        console.error("Invalid date:", dateString);
        return "-";
    }
};

function TradesTable({ data, includeColumns = [], columnAliases = {}, updateTrade }) {
    const [sortedData, setSortedData] = useState(data);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
    const [selectedTrades, setSelectedTrades] = useState([]);
    const [showAssignTradesPopup, setShowAssignTradesPopup] = useState(false);

    const handleTradeSelection = (trade) => {
        setSelectedTrades((prev) =>
            prev.includes(trade)
                ? prev.filter((currenttrade) => currenttrade.tradeid !== trade.tradeid)
                : [...prev, trade]
        );
    };

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

    const assignToStrategy = () => {
        setShowAssignTradesPopup(true);
    };

    return (
        <Box sx={{ width: '100%', mb: 4 }}>
            <Button
                variant="contained"
                color="primary"
                onClick={assignToStrategy}
                disabled={selectedTrades.length === 0}
                sx={{ mb: 2 }}
            >
                Assign to Strategy
            </Button>
            <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
                <Table sx={{ minWidth: 650 }} aria-label="trades table">
                    <TableHead>
                        <TableRow>
                            <TableCell padding="checkbox">
                                <Typography variant="subtitle2">Select</Typography>
                            </TableCell>
                            {columns.map((col) => (
                                <TableCell key={col}>
                                    <TableSortLabel
                                        active={sortConfig.key === col}
                                        direction={sortConfig.key === col ? sortConfig.direction : 'asc'}
                                        onClick={() => handleSort(col)}
                                    >
                                        <Typography variant="subtitle2">
                                            {columnAliases[col] || col.toUpperCase()}
                                        </Typography>
                                    </TableSortLabel>
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sortedData.map((row, rowIndex) => (
                            <TableRow
                                key={rowIndex}
                                hover
                                onClick={() => updateTrade(row)}
                                sx={{ cursor: 'pointer' }}
                            >
                                <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                                    <Checkbox
                                        checked={selectedTrades.includes(row)}
                                        onChange={(e) => {
                                            e.stopPropagation();
                                            handleTradeSelection(row);
                                        }}
                                    />
                                </TableCell>
                                {columns.map((col) => (
                                    <TableCell key={col}>
                                        {col === "entrydate" || col === "exitdate" || col === 'lastmodifieddate'
                                            ? formatDate(row[col])
                                            : row[col]}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            {showAssignTradesPopup && (
                <AssignTradesToStrategy
                    title="Link Trades to Strategy"
                    tradeDetails={selectedTrades}
                    onSubmit={() => setShowAssignTradesPopup(false)}
                />
            )}
        </Box>
    );
}

export default TradesTable;