import React, { useState } from "react";
import {
    Button,
    Container,
    Box,
    Typography,
    Stack,
    MenuItem,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Alert,
    CircularProgress,
    IconButton
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import CloseIcon from '@mui/icons-material/Close';
import { CreateStrategy } from './CreateStrategyPopup';
import { getStrategies } from '../../services/strategies';
import { useNavigate } from "react-router-dom";

const SearchForm = ({ searchData, onSearchDataChange, onSearch, onClear, onClose }) => (
    <Container maxWidth={false} sx={{
        backgroundColor: "#fafbfb",
        p: 3,
        m: 2,
        border: "1px solid grey",
        borderRadius: "8px",
        position: 'relative'
    }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ color: "text.primary" }}>
                Search Strategies
            </Typography>
            <IconButton
                onClick={onClose}
                sx={{
                    position: 'absolute',
                    right: 16,
                    top: 16,
                    '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                    }
                }}
            >
                <CloseIcon />
            </IconButton>
        </Box>
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(3, 1fr)',
                    lg: 'repeat(4, 1fr)'
                },
                gap: 3
            }}
        >
            <TextField
                label="Name"
                name="name"
                fullWidth
                value={searchData.name}
                onChange={onSearchDataChange}
                size="small"
            />
            <TextField
                select
                label="Status"
                name="status"
                fullWidth
                value={searchData.status}
                onChange={onSearchDataChange}
                size="small"
            >
                <MenuItem value="OPEN">OPEN</MenuItem>
                <MenuItem value="CLOSE">CLOSE</MenuItem>
            </TextField>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                    label="Created Before"
                    value={searchData.createdbefore}
                    onChange={(date) => onSearchDataChange({ target: { name: "createdbefore", value: date } })}
                    renderInput={(params) => <TextField {...params} size="small" fullWidth />}
                />
                <DatePicker
                    label="Created After"
                    value={searchData.createdafter}
                    onChange={(date) => onSearchDataChange({ target: { name: "createdafter", value: date } })}
                    renderInput={(params) => <TextField {...params} size="small" fullWidth />}
                />
            </LocalizationProvider>
        </Box>
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button variant="outlined" onClick={onClear} size="small">
                Clear
            </Button>
            <Button variant="contained" onClick={onSearch} size="small">
                Search
            </Button>
        </Box>
    </Container>
);

const StrategyTable = ({ strategies, onStrategyClick, onClose }) => (
    <TableContainer component={Paper} sx={{
        maxWidth: "100%",
        margin: "auto",
        mt: 2,
        backgroundColor: "white",
        border: "1px solid grey",
        borderRadius: "8px"
    }}>
        <Box sx={{ mb: 2, display: "flex", justifyContent: "flex-end" }}>
            <Button onClick={onClose} variant="contained" color="secondary" size="small">
                Close
            </Button>
        </Box>
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
                        onClick={() => onStrategyClick(strategy)}
                        sx={{
                            cursor: "pointer",
                            "&:hover": { backgroundColor: "lightgreen !important" },
                            backgroundColor: index % 2 === 0 ? "#ffffff !important" : "#f9f9f9 !important"
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
);

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
        <Stack spacing={3}>
            <Container sx={{ p: 2 }}>
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: 2,
                        alignItems: { xs: 'stretch', sm: 'center' }
                    }}
                >
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => setShowCreateStrategy(true)}
                        sx={{ flex: { xs: 1, sm: 'none' } }}
                    >
                        Create Strategy
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => setViewSearchFilter(true)}
                        sx={{ flex: { xs: 1, sm: 'none' } }}
                    >
                        View Strategies
                    </Button>
                </Box>
            </Container>

            {error && (
                <Alert severity="error" sx={{ mx: 3 }}>
                    {error}
                </Alert>
            )}

            {viewSearchFilter && (
                <SearchForm
                    searchData={searchData}
                    onSearchDataChange={handleSearchDataChange}
                    onSearch={handleSearch}
                    onClear={handleClear}
                    onClose={() => setViewSearchFilter(false)}
                />
            )}

            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", my: 6 }}>
                    <CircularProgress />
                </Box>
            ) : strategies.length > 0 && (
                <StrategyTable
                    strategies={strategies}
                    onStrategyClick={handleStrategyClick}
                    onClose={() => setStrategies([])}
                />
            )}

            {showCreateStrategy && (
                <CreateStrategy
                    title="Create Strategy"
                    onSubmit={() => setShowCreateStrategy(false)}
                    onCancel={() => setShowCreateStrategy(false)}
                />
            )}
        </Stack>
    );
};

export default StrategyHeader;