import React, { useState } from "react";
import {
    Button,
    Box,
    Typography,
    MenuItem,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    CircularProgress
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import CloseIcon from '@mui/icons-material/Close';
import { CreateStrategy } from './CreateStrategyPopup';
import { getStrategies } from '../../services/strategies';
import { useNavigate } from "react-router-dom";
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';

const StrategyHeader = () => {
    const [showCreateStrategy, setShowCreateStrategy] = useState(false);
    const [viewSearchFilter, setViewSearchFilter] = useState(false);
    const [strategies, setStrategies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchData, setSearchData] = useState({
        name: "",
        status: "",
        createdafter: null,
        createdbefore: null,
    });

    const navigate = useNavigate();

    const handleSearchDataChange = (event) => {
        const { name, value } = event.target;
        setSearchData(prev => ({ ...prev, [name]: value }));
    };

    const handleClear = () => {
        setSearchData({
            name: "",
            status: "",
            createdafter: null,
            createdbefore: null,
        });
    };

    const handleSearch = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getStrategies(searchData);
            setStrategies(response);
        } catch (error) {
            console.error("Error searching strategies:", error);
            setError("Failed to search strategies. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const handleStrategyClick = (strategy) => {
        navigate(`/updatestrategy/${strategy.id}`);
    };

    return (
        <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
                variant="contained"
                color="primary"
                onClick={() => setShowCreateStrategy(true)}
                startIcon={<AddIcon />}
                sx={{
                    minWidth: '160px',
                    textTransform: 'none',
                    fontWeight: 'medium'
                }}
            >
                Create Strategy
            </Button>
            <Button
                variant="outlined"
                color="primary"
                onClick={() => setViewSearchFilter(true)}
                startIcon={<SearchIcon />}
                sx={{
                    minWidth: '160px',
                    textTransform: 'none',
                    fontWeight: 'medium'
                }}
            >
                Search Strategies
            </Button>

            {viewSearchFilter && (
                <Dialog
                    open={viewSearchFilter}
                    onClose={() => {
                        setViewSearchFilter(false);
                        setStrategies([]);
                        setLoading(false);
                        setError(null);
                    }}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6">Search Strategies</Typography>
                            <IconButton onClick={() => {
                                setViewSearchFilter(false);
                                setStrategies([]);
                                setLoading(false);
                                setError(null);
                            }}>
                                <CloseIcon />
                            </IconButton>
                        </Box>
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ mt: 2 }}>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Name"
                                        name="name"
                                        fullWidth
                                        value={searchData.name}
                                        onChange={handleSearchDataChange}
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        select
                                        label="Status"
                                        name="status"
                                        fullWidth
                                        value={searchData.status}
                                        onChange={handleSearchDataChange}
                                        size="small"
                                    >
                                        <MenuItem value="OPEN">OPEN</MenuItem>
                                        <MenuItem value="CLOSE">CLOSE</MenuItem>
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                                        <DatePicker
                                            label="Created After"
                                            value={searchData.createdafter}
                                            onChange={(date) => handleSearchDataChange({ target: { name: "createdafter", value: date } })}
                                            slotProps={{
                                                textField: {
                                                    size: "small",
                                                    fullWidth: true
                                                }
                                            }}
                                        />
                                    </LocalizationProvider>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                                        <DatePicker
                                            label="Created Before"
                                            value={searchData.createdbefore}
                                            onChange={(date) => handleSearchDataChange({ target: { name: "createdbefore", value: date } })}
                                            slotProps={{
                                                textField: {
                                                    size: "small",
                                                    fullWidth: true
                                                }
                                            }}
                                        />
                                    </LocalizationProvider>
                                </Grid>
                            </Grid>
                        </Box>

                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                <CircularProgress />
                            </Box>
                        ) : error ? (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Typography variant="h6" color="error">
                                    {error}
                                </Typography>
                            </Box>
                        ) : strategies.length > 0 ? (
                            <Box sx={{ mt: 4 }}>
                                <Typography variant="h6" gutterBottom>Search Results</Typography>
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell><b>ID</b></TableCell>
                                                <TableCell><b>Name</b></TableCell>
                                                <TableCell><b>Description</b></TableCell>
                                                <TableCell><b>Status</b></TableCell>
                                                <TableCell><b>Created Date</b></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {strategies.map((strategy, index) => (
                                                <TableRow
                                                    key={strategy.id}
                                                    hover
                                                    onClick={() => handleStrategyClick(strategy)}
                                                    sx={{
                                                        cursor: "pointer",
                                                        "&:hover": { backgroundColor: "action.hover" },
                                                        backgroundColor: index % 2 === 0 ? "background.paper" : "background.default"
                                                    }}
                                                >
                                                    <TableCell>{strategy.id}</TableCell>
                                                    <TableCell>{strategy.name}</TableCell>
                                                    <TableCell>{strategy.description}</TableCell>
                                                    <TableCell>{strategy.status}</TableCell>
                                                    <TableCell>{strategy.created_at}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        ) : strategies.length === 0 && !loading && !error ? (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Typography variant="h6" color="textSecondary">
                                    No results found
                                </Typography>
                            </Box>
                        ) : null}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleClear} color="inherit">
                            Clear
                        </Button>
                        <Button onClick={handleSearch} variant="contained" color="primary">
                            Search
                        </Button>
                    </DialogActions>
                </Dialog>
            )}

            {showCreateStrategy && (
                <CreateStrategy
                    title="Create Strategy"
                    onSubmit={() => setShowCreateStrategy(false)}
                    onCancel={() => setShowCreateStrategy(false)}
                />
            )}
        </Box>
    );
};

export default StrategyHeader;