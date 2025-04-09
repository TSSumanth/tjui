import React, { useState, useEffect, useCallback } from "react";
import { Box, Button, Typography, Paper, CircularProgress, Alert, Stack, Divider } from "@mui/material";
import { getReportByDateRange, deleteEntry, updateEntry, addEntry } from "../../services/profitlossreport";
import PagenationTable from "./ProfitLossTable";
import DateComponent from "../Generic/DateComponent";
import { subDays, format } from "date-fns";

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

const ReportSection = () => {
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [startDate, setStartDate] = useState(subDays(new Date(), 90)); // Default: 90 days ago
    const [endDate, setEndDate] = useState(new Date()); // Default: Today

    // Fetch report data
    async function fetchReport() {
        setLoading(true);
        setError(null);
        const formattedStartDate = format(startDate, "yyyy-MM-dd");
        const formattedEndDate = format(endDate, "yyyy-MM-dd");

        try {
            const data = await getReportByDateRange(formattedStartDate, formattedEndDate);
            setReportData(data);
        } catch (err) {
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
        <Box p={4}>
            {/* Title */}
            <Typography variant="h6" fontWeight="bold" gutterBottom>
                Profit & Loss Report
            </Typography>

            {/* Search Section */}
            <Paper sx={{ p: 1, mb: 1 }}>
                <Typography variant="h6" fontWeight="bold" mb={1}>
                    Search Report
                </Typography>

                {/* Using Stack for layout instead of Grid */}
                <Stack spacing={2} direction={{ xs: "column", sm: "row" }} alignItems="center">
                    <Box>
                        <Typography variant="body1">Start Date:</Typography>
                        <DateComponent initialDate={startDate} onDateSelect={setStartDate} />
                    </Box>
                    <Box>
                        <Typography variant="body1">End Date:</Typography>
                        <DateComponent initialDate={endDate} onDateSelect={setEndDate} />
                    </Box>

                </Stack>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => fetchReport()}
                    disabled={loading}
                    sx={{ minWidth: "150px", marginTop: 1 }}
                >
                    {loading ? <CircularProgress size={24} /> : "Get Report"}
                </Button>
            </Paper>
            <Divider sx={{ borderBottomWidth: 1, borderColor: "black", margin: "10px" }} />
            {/* Error Handling */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Report Table */}
            {reportData.length > 0 ? (
                <PagenationTable
                    key={JSON.stringify(reportData)}
                    columns={reportColumns}
                    initialdata={reportData}
                    DeleteRequest={deleteEntry}
                    UpdateRequest={updateEntry}
                    CreateRequest={addEntry}
                />
            ) : (
                !loading && (
                    <Typography variant="body1" color="textSecondary" align="center">
                        No data available. Click "Get Report" to load data.
                    </Typography>
                )
            )}
            <Divider sx={{ borderBottomWidth: 1, borderColor: "black", marginTop: "10px" }} />
        </Box>
    );
};

export default ReportSection;