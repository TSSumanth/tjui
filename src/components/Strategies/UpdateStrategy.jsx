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

function UpdateStrategy({ id }) {
    const [strategy, setStrategy] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchStrategy = async () => {
        if (!id) {
            setError("No strategy ID provided");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const data = await getStrategies();
            const foundStrategy = data.find(s => s.id === parseInt(id));
            if (foundStrategy) {
                setStrategy(foundStrategy);
            } else {
                setError("Strategy not found");
            }
        } catch (err) {
            console.error("Error fetching data:", err);
            setError("Failed to load strategy data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStrategy();
    }, [id]); // Add id as a dependency

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box p={4}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    return (
        <Box p={4}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
                Update Strategy
            </Typography>

            {strategy ? (
                <StrategyForm
                    key={JSON.stringify(strategy)}
                    initialData={strategy}
                    onSubmit={updateStrategy}
                />
            ) : (
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography color="text.secondary">
                        No strategy data available
                    </Typography>
                </Paper>
            )}
        </Box>
    );
}

export default UpdateStrategy;