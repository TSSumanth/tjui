import React, { useState, useEffect } from "react";
import {
    Box,
    Button,
    Typography,
    Paper,
    CircularProgress,
    Alert,
} from "@mui/material";
import { getStrategies, updateStrategy } from "../../services/strategies";
import StrategyForm from "./StrategyForm";

function UpdateStrategy() {
    const [strategy, setStrategy] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchStrategy = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getStrategies();
            setStrategy(data[0]);
        } catch (err) {
            console.error("Error fetching data:", err);
            setError("Failed to load strategy data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStrategy();
    }, []);

    return (
        <Box p={4}>
            {/* Title */}
            <Typography variant="h6" fontWeight="bold" gutterBottom>
                Update Strategy
            </Typography>

            {/* Search Section */}
            <Paper sx={{ p: 1, mb: 1 }}>
                <Typography variant="h6" fontWeight="bold" mb={1}>
                    Search Strategy
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => fetchStrategy()}
                    disabled={loading}
                    sx={{ minWidth: "150px" }}
                >
                    {loading ? <CircularProgress size={24} /> : "Get Strategy"}
                </Button>
            </Paper>
            {/* Error Handling */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Strategy Form */}
            {strategy && (
                <StrategyForm
                    key={JSON.stringify(strategy)}
                    initialData={strategy}
                    onSubmit={updateStrategy}
                />
            )}
        </Box>
    );
}

export default UpdateStrategy;