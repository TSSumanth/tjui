import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    CircularProgress,
    Alert,
} from '@mui/material';
import { getStrategyNotes } from '../../services/strategies';
import NotesTable from "./NotesTable";

function StrategyNotes({ strategyId }) {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchNotes = useCallback(async () => {
        try {
            setLoading(true);
            if (!strategyId) {
                setError('Strategy ID is required');
                return;
            }
            const data = await getStrategyNotes(strategyId);
            setNotes(data);
            setError(null);
        } catch (err) {
            setError('Failed to fetch notes');
            console.error('Error fetching notes:', err);
        } finally {
            setLoading(false);
        }
    }, [strategyId]);

    useEffect(() => {
        fetchNotes();
    }, [fetchNotes]);

    return (
        <Box p={4}>
            {/* Title */}
            <Typography variant="h6" fontWeight="bold" gutterBottom>
                Strategy Notes
            </Typography>

            {/* Search Section */}
            <Paper sx={{ p: 1, mb: 1 }}>
                <Typography variant="h6" fontWeight="bold" mb={1}>
                    Search Notes
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => fetchNotes()}
                    disabled={loading}
                    sx={{ minWidth: "150px" }}
                >
                    {loading ? <CircularProgress size={24} /> : "Get Notes"}
                </Button>
            </Paper>
            {/* Error Handling */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Notes Table */}
            {notes.length > 0 ? (
                <NotesTable
                    key={JSON.stringify(notes)}
                    columns={[
                        { accessorKey: "id", header: "Note ID" },
                        { accessorKey: "content", header: "Content" },
                        { accessorKey: "created_at", header: "Created At" },
                        { accessorKey: "updated_at", header: "Updated At" }
                    ]}
                    initialdata={notes}
                />
            ) : (
                !loading && (
                    <Typography variant="body1" color="textSecondary" align="center">
                        No data available. Click &quot;Get Notes&quot; to load data.
                    </Typography>
                )
            )}
        </Box>
    );
}

export default StrategyNotes; 