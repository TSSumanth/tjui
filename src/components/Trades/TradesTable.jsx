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
    TableContainer,
    Typography,
    Box,
    Tooltip,
    IconButton
} from "@mui/material";
import { AssignTradesToStrategy } from "../Strategies/AssignTradesPopup";
import AssignmentIcon from '@mui/icons-material/Assignment';
import InfoIcon from '@mui/icons-material/Info';

// Helper function to format dates consistently
const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
        // First try parsing as ISO string
        const date = parseISO(dateString);
        if (!isNaN(date.getTime())) {
            return format(date, "yyyy-MM-dd HH:mm");
        }

        // If not ISO, try parsing as timestamp
        const timestamp = parseInt(dateString);
        if (!isNaN(timestamp)) {
            const dateFromTimestamp = new Date(timestamp);
            if (!isNaN(dateFromTimestamp.getTime())) {
                return format(dateFromTimestamp, "yyyy-MM-dd HH:mm");
            }
        }

        // If not timestamp, try parsing as date string
        const dateFromString = new Date(dateString);
        if (!isNaN(dateFromString.getTime())) {
            return format(dateFromString, "yyyy-MM-dd HH:mm");
        }

        return "-";
    } catch (error) {
        console.error("Invalid date:", dateString, error);
        return "-";
    }
};

// Constants for table configuration
const TABLE_STYLES = {
    container: {
        padding: 2,
        borderRadius: 2,
        boxShadow: 3
    },
    header: {
        backgroundColor: "primary.light",
        '& th': {
            fontWeight: 'bold',
            color: 'primary.contrastText'
        }
    },
    row: {
        cursor: 'pointer',
        '&:hover': {
            backgroundColor: 'action.hover'
        }
    },
    selectedRow: {
        backgroundColor: 'primary.light',
        '&:hover': {
            backgroundColor: 'primary.light'
        }
    },
    evenRow: {
        backgroundColor: 'background.default'
    },
    oddRow: {
        backgroundColor: 'background.paper'
    }
};

function TradesTable({ data, includeColumns = [], columnAliases = {}, updateTrade }) {
    // State management
    const [sortedData, setSortedData] = useState(data);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
    const [selectedTrades, setSelectedTrades] = useState([]);
    const [showAssignTradesPopup, setShowAssignTradesPopup] = useState(false);

    // Update sorted data when data prop changes
    useEffect(() => {
        if (data) {
            setSortedData(data);
        }
    }, [data]);

    // Get visible columns based on includeColumns prop
    const columns = data.length > 0
        ? Object.keys(data[0]).filter(col => includeColumns.includes(col))
        : [];

    // Handle sorting of table data
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

    // Handle trade selection
    const handleTradeSelection = (trade) => {
        setSelectedTrades((prev) =>
            prev.some((t) => t.tradeid === trade.tradeid)
                ? prev.filter((t) => t.tradeid !== trade.tradeid)
                : [...prev, trade]
        );
    };

    // Get row style based on selection and index
    const getRowStyle = (isSelected, index) => ({
        ...TABLE_STYLES.row,
        ...(isSelected ? TABLE_STYLES.selectedRow : {}),
        ...(index % 2 === 0 ? TABLE_STYLES.evenRow : TABLE_STYLES.oddRow)
    });

    return (
        <TableContainer component={Paper} sx={TABLE_STYLES.container}>
            {/* Header section with action buttons */}
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2
            }}>
                <Typography variant="h6" color="primary">
                    Trades List
                </Typography>
                <Box>
                    <Tooltip title="Assign selected trades to a strategy">
                        <span>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<AssignmentIcon />}
                                onClick={() => setShowAssignTradesPopup(true)}
                                disabled={selectedTrades.length === 0}
                                sx={{ mr: 1 }}
                            >
                                Assign to Strategy
                            </Button>
                        </span>
                    </Tooltip>
                    <Tooltip title="Select trades to assign them to a strategy">
                        <IconButton color="primary">
                            <InfoIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* Main table */}
            <Table>
                <TableHead sx={TABLE_STYLES.header}>
                    <TableRow>
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
                                sx={getRowStyle(isSelected, index)}
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
                                    <TableCell
                                        key={col}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            updateTrade(row)
                                        }}
                                    >
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

            {/* Assign trades popup */}
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