import React, { useState, useEffect } from "react";
import { getTags, deleteTag, addTag, updateTag } from "../../services/tagmanagement";
import TagsTable from "./TagManagementTable";
import { Button, Typography, Paper, Box, CircularProgress, Alert, Divider, TextField, InputAdornment } from "@mui/material";
import { Search } from "@mui/icons-material";

const reportColumns = [
    { accessorKey: "id", header: "Tag ID" },
    { accessorKey: "name", header: "Tag Name" },
    { accessorKey: "description", header: "Tag Description" }
];

function TagManagement() {
    const [tagData, setTagData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchTags = async (searchName = "") => {
        setLoading(true);
        setError(null);
        try {
            const data = await getTags(searchName);
            setTagData(data);
        } catch (err) {
            console.error("Error fetching data:", err);
            setError("Failed to load tag data.");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        fetchTags(searchTerm);
    };

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            handleSearch();
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
            <Paper sx={{ p: 2, mb: 1 }}>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                    Search Tags
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <TextField
                        label="Search by tag name"
                        variant="outlined"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        onKeyPress={handleKeyPress}
                        placeholder="Enter tag name to search..."
                        sx={{ minWidth: 300, flexGrow: 1 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSearch}
                        disabled={loading}
                        sx={{ minWidth: "120px" }}
                    >
                        {loading ? <CircularProgress size={24} /> : "Search"}
                    </Button>
                    <Button
                        variant="outlined"
                        color="secondary"
                        onClick={() => {
                            setSearchTerm("");
                            fetchTags();
                        }}
                        disabled={loading}
                        sx={{ minWidth: "120px" }}
                    >
                        Show All
                    </Button>
                </Box>
            </Paper>
            <Divider sx={{ borderBottomWidth: 1, borderColor: "black", margin: "10px" }} />
            {/* Error Handling */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Tags Table */}
            <TagsTable
                key={JSON.stringify(tagData)}
                columns={reportColumns}
                initialdata={tagData}
                DeleteRequest={deleteTag}
                CreateRequest={addTag}
                UpdateRequest={updateTag}
            />
            
            {/* Show message when no data and not loading */}
            {tagData.length === 0 && !loading && (
                <Typography variant="body1" color="textSecondary" align="center" sx={{ mt: 2 }}>
                    No tags configured. Use the &quot;Add New Entry&quot; button above to create your first tag.
                </Typography>
            )}
            <Divider sx={{ borderBottomWidth: 1, borderColor: "black", marginTop: "10px" }} />
        </Box>
    );
}

export default TagManagement;