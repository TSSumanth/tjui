import React, { useState, useEffect } from "react";
import { getTags, deleteTag, addTag, updateTag } from "../../services/tagmanagement";
import TagsTable from "./TagManagementTable";
import { TextField, Button, Typography, Paper, Box, CircularProgress } from "@mui/material";

const reportColumns = [
    { accessorKey: "id", header: "Tag ID" },
    { accessorKey: "name", header: "Tag Name" },
    { accessorKey: "description", header: "Tag Description" }
];

function TagsSection() {
    const [tagData, setTagData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [tagSearch, setTagSearch] = useState("");

    const fetchTags = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getTags(tagSearch);
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

    const handleSearchChange = (e) => {
        setTagSearch(e.target.value);
    };

    const handleSearchClick = async () => {
        await fetchTags();
    };

    return (
        <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
            <Typography variant="h5" fontWeight="bold" mb={2}>Tag Management</Typography>

            {/* Search Section */}
            <Box display="flex" gap={2} alignItems="center" mb={3}>
                <TextField
                    label="Search Tag Name"
                    variant="outlined"
                    size="small"
                    value={tagSearch}
                    onChange={handleSearchChange}
                    sx={{ flex: 1 }}
                />
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSearchClick}
                    disabled={loading}
                >
                    {loading ? <CircularProgress size={20} color="inherit" /> : "Get Tags"}
                </Button>
            </Box>

            {/* Error Message */}
            {error && <Typography color="error" mb={2}>{error}</Typography>}

            {/* Tags Table */}
            {tagData.length > 0 ? (
                <TagsTable
                    columns={reportColumns}
                    initialdata={tagData}
                    DeleteRequest={deleteTag}
                    CreateRequest={addTag}
                    UpdateRequest={updateTag}
                />
            ) : (
                !loading && (
                    <Typography color="textSecondary">No data available. Click "Get Tags" to load data.</Typography>
                )
            )}
        </Paper>
    );
}

export default TagsSection;