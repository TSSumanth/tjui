import React, { useState } from "react";
import { Button, Container, Box, Typography, Stack, MenuItem, TextField } from "@mui/material";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { CreateStrategy } from './CreateStrategyPopup'
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import Close from "@mui/icons-material/Close";
import dayjs from "dayjs";
import { getStrategies } from '../../services/strategies'

const StrategyHeader = () => {
    const [showCreateStrategy, setShowCreateStrategy] = useState(false);
    const [viewSearchFilter, setViewSearchFilter] = useState(false)
    const [strategies, setStrategies] = useState([]);
    const [searchData, setSearchData] = useState({
        name: "",
        status: "",
        createdafter: null,
        createdbefore: null,
    });

    const handleClear = () => {
        setSearchData({
            name: "",
            status: "",
            createdafter: null,
            createdbefore: null,
        });
    };

    const handleCloseTable = () => {
        setStrategies([]);
    };
    const handleDateChange = (newDate) => {
        setSearchData((prev) => ({ ...prev, created_at: newDate }));
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setSearchData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSearch = async () => {
        console.log("Searching with: ", searchData);
        let response = await getStrategies(searchData)
        setStrategies(response)
    };

    const handleCreateStrategy = () => {
        setShowCreateStrategy(true);
    };
    const handleViewStrategies = () => setViewSearchFilter(true);
    const handleCloseSearchFilter = () => setViewSearchFilter(false);

    return (
        <Stack>
            <Container sx={{
                padding: 1,
                margin: 1,
                width: "fit-content",
            }}>
                <Box display="flex" flexDirection="row" gap={2}  >
                    <Button variant="contained" color="primary" onClick={handleCreateStrategy} sx={{
                        backgroundColor: "blue",
                    }}>
                        Create Strategy
                    </Button>
                    <Button variant="contained" color="primary" onClick={handleViewStrategies} sx={{
                        backgroundColor: "blue",
                    }}>
                        View Strategies
                    </Button>
                </Box>
            </Container>
            {viewSearchFilter && <Container maxWidth={false} sx={{
                backgroundColor: "#fafbfb",
                padding: "3",
                margin: "5" ,
                width: "100%",
                border: "1px solid grey", // Correct border syntax
                borderRadius: "8px",
                
            }}>
                <Typography sx={{
                    padding: 2,
                    margin: 1,
                    width: "fit-content",
                    color: "black"
                }}>Use these fields to search for Strategies.</Typography>
                <Stack spacing={2}>
                    <Stack direction="row" spacing={2}>
                        <TextField label="Name" name="name" fullWidth value={searchData.name} onChange={handleChange} />
                        <TextField
                            select
                            label="Status"
                            name="status"
                            fullWidth
                            value={searchData.status}
                            onChange={handleChange}
                        >
                            <MenuItem key={"open"} value={"OPEN"}>{"OPEN"}</MenuItem>
                            <MenuItem key={"close"} value={"CLOSE"}>{"CLOSE"}</MenuItem>
                        </TextField>
                        <LocalizationProvider dateAdapter={AdapterDayjs} >
                            <DatePicker
                                label="Created Before"
                                value={searchData.createdbefore}
                                onChange={handleDateChange}
                                renderInput={(params) => <TextField fullWidth {...params} />}
                                sx={{ width: "700px" }}
                            />
                            <DatePicker
                                label="Created After"
                                value={searchData.createdafter}
                                onChange={handleDateChange}
                                renderInput={(params) => <TextField fullWidth {...params} />}
                                sx={{ width: "700px" }}
                            />
                        </LocalizationProvider>
                    </Stack>
                    <Box gap={2} sx={{
                        padding: 2,
                        margin: 1,
                        justifyContent: "flex-end",
                        display: "flex"
                    }}>
                        <Button variant="outlined" startIcon={<Close />} onClick={handleCloseSearchFilter}>
                            Close
                        </Button>
                        <Button variant="outlined" startIcon={<ClearIcon />} onClick={handleClear}>
                            Clear
                        </Button>
                        <Button variant="contained" startIcon={<SearchIcon />} onClick={handleSearch}>
                            Search
                        </Button>
                    </Box>
                </Stack>
            </Container>}
            {
                strategies.length > 0 &&
                <TableContainer component={Paper} sx={{
                    maxWidth: "100%", margin: "auto", marginTop: 2, backgroundColor: "white", border: "1px solid grey", // Correct border syntax
                    borderRadius: "8px"
                }}>
                    <Box sx={{ marginBottom: 2, display: "flex", justifyContent: "flex-end" }}>
                        <Button
                            onClick={handleCloseTable}
                            variant="contained"
                            color="secondary"
                        >
                            Close
                        </Button>
                    </Box>
                    <Table sx={{ backgroundColor: "white" }}> {/* Ensures white background */}
                        <TableHead>
                            <TableRow >
                                <TableCell sx={{ color: "black" }}><b>ID</b></TableCell>
                                <TableCell sx={{ color: "black" }}><b>Name</b></TableCell>
                                <TableCell sx={{ color: "black" }}><b>Description</b></TableCell>
                                <TableCell sx={{ color: "black" }}><b>Status</b></TableCell>
                                <TableCell sx={{ color: "black" }}><b>Created Date</b></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {strategies.map((strategy, index) => (
                                <TableRow key={strategy.id + index} sx={{ backgroundColor: index % 2 === 0 ? "#ffffff !important" : "#f9f9f9 !important" }}>
                                    <TableCell sx={{ backgroundColor: index % 2 === 0 ? "#ffffff !important" : "#f9f9f9 !important", color: "black" }}>{strategy.id}</TableCell>
                                    <TableCell sx={{ backgroundColor: index % 2 === 0 ? "#ffffff !important" : "#f9f9f9 !important", color: "black" }}>{strategy.name}</TableCell>
                                    <TableCell sx={{ backgroundColor: index % 2 === 0 ? "#ffffff !important" : "#f9f9f9 !important", color: "black" }}>{strategy.description}</TableCell>
                                    <TableCell sx={{ backgroundColor: index % 2 === 0 ? "#ffffff !important" : "#f9f9f9 !important", color: "black" }}>{strategy.status}</TableCell>
                                    <TableCell sx={{ backgroundColor: index % 2 === 0 ? "#ffffff !important" : "#f9f9f9 !important", color: "black" }}>{strategy.created_at}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            }
            {showCreateStrategy && <CreateStrategy title="Create Strategy" onSubmit={() => setShowCreateStrategy(false)} onCancel={() => setShowCreateStrategy(false)} />}
        </Stack>
    );
};

export default StrategyHeader;