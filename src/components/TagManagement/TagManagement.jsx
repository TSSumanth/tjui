import React, { useState, useEffect } from "react";
import { getTags, deleteTag, addTag, updateTag } from "../../services/tagmanagement";
import TagsTable from "./TagManagementTable";
import { Button, Typography, Paper, Box, CircularProgress, Alert, Divider } from "@mui/material";

const reportColumns = [
    { accessorKey: "id", header: "Tag ID" },
    { accessorKey: "name", header: "Tag Name" },
    { accessorKey: "description", header: "Tag Description" }
];

function TagManagement() {
    const [tagData, setTagData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchTags = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getTags();
            setTagData(data);
        } catch (err) {
            console.error("Error fetching data:", err);
            setError("Failed to load tag data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTags();
    }, []);

    return (
        <Box p={4}>
            {/* Title */}
            <Typography variant="h6" fontWeight="bold" gutterBottom>
                Tag Management
            </Typography>

            {/* Search Section */}
            <Paper sx={{ p: 1, mb: 1 }}>
                <Typography variant="h6" fontWeight="bold" mb={1}>
                    Search Tags
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => fetchTags()}
                    disabled={loading}
                    sx={{ minWidth: "150px" }}
                >
                    {loading ? <CircularProgress size={24} /> : "Get Tags"}
                </Button>
            </Paper>
            <Divider sx={{ borderBottomWidth: 1, borderColor: "black", margin: "10px" }} />
            {/* Error Handling */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Tags Table */}
            {tagData.length > 0 ? (
                <TagsTable
                    key={JSON.stringify(tagData)}
                    columns={reportColumns}
                    initialdata={tagData}
                    DeleteRequest={deleteTag}
                    CreateRequest={addTag}
                    UpdateRequest={updateTag}
                />
            ) : (
                !loading && (
                    <Typography variant="body1" color="textSecondary" align="center">
                        No data available. Click &quot;Get Tags&quot; to load data.
                    </Typography>
                )
            )}
            <Divider sx={{ borderBottomWidth: 1, borderColor: "black", marginTop: "10px" }} />
        </Box>
    );
}

export default TagManagement;