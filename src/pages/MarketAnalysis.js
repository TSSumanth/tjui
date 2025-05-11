import React, { useEffect, useState } from 'react';
import { Pagination, Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, Grid, TextField, MenuItem, Paper, InputAdornment, IconButton } from '@mui/material';
import { getAllMarketAnalysis, createMarketAnalysis, updateMarketAnalysis, deleteMarketAnalysis } from '../services/marketanalysis';
import SimpleAnalysisTable from '../components/MarketAnalysis/SimpleAnalysisTable';
import CreateAnalysisDialog from '../components/MarketAnalysis/CreateAnalysisDialog';
import EditAnalysisDialog from '../components/MarketAnalysis/EditAnalysisDialog';
import { initialForm, expectationOptions } from '../components/MarketAnalysis/shared';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import EventIcon from '@mui/icons-material/Event';

function mapRowToForm(row) {
    if (!row) return initialForm;
    return {
        date: row.date || '',
        eventday: row.event_day !== undefined ? String(row.event_day) : '',
        eventdescription: row.event_description || '',
        premarketexpectation: row.premarket_expectation || '',
        premarketanalysis: row.premarket_analysis || '',
        postmarketanalysis: row.postmarket_analysis || '',
        marketmovement: row.market_movement || '',
    };
}

const defaultFilters = { startDate: '', endDate: '', searchText: '', premarketexpectation: '', marketmovement: '' };

export default function MarketAnalysis() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editRow, setEditRow] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteRow, setDeleteRow] = useState(null);
    const [filters, setFilters] = useState(defaultFilters);
    const [filterDraft, setFilterDraft] = useState(defaultFilters);
    const limit = 10;

    // Table cell styles
    const textCellStyle = {
        minWidth: 150,
        maxWidth: 200,
        padding: '12px 8px',
        verticalAlign: 'middle',
        fontSize: '1rem',
        textAlign: 'left',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    };
    const smallTextCellStyle = {
        minWidth: 150,
        maxWidth: 150,
        width: 100,
        padding: '12px 8px',
        verticalAlign: 'middle',
        fontSize: '1rem',
        textAlign: 'left',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    };
    const viewButtonCellStyle = {
        minWidth: 150,
        maxWidth: 150,
        textAlign: 'center',
        padding: '12px 8px',
        verticalAlign: 'middle',
    };

    const fetchData = () => {
        setLoading(true);
        setError(null);
        getAllMarketAnalysis({ page, limit, ...filters })
            .then(res => {
                if (res.success) {
                    setRows(res.data);
                    setTotalPages(res.meta?.totalPages || 1);
                } else {
                    setError(res.message || 'Failed to fetch data');
                }
            })
            .catch(err => setError(err.message || 'Failed to fetch data'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line
    }, [page, filters]);

    const handleCreate = async (form) => {
        await createMarketAnalysis(form);
        setDialogOpen(false);
        fetchData();
    };

    const handleEdit = (row) => {
        setEditRow({ ...row });
        setEditDialogOpen(true);
    };

    const handleUpdate = async (form) => {
        if (!editRow) return;
        await updateMarketAnalysis(editRow.id, form);
        setEditDialogOpen(false);
        setEditRow(null);
        fetchData();
    };

    const handleDelete = (row) => {
        setDeleteRow(row);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteRow) return;
        await deleteMarketAnalysis(deleteRow.id);
        setDeleteDialogOpen(false);
        setDeleteRow(null);
        fetchData();
    };

    // Filter UI handlers
    const handleFilterDraftChange = (e) => {
        const { name, value } = e.target;
        setFilterDraft(f => ({ ...f, [name]: value }));
    };
    const handleSubmitFilters = () => {
        setFilters(filterDraft);
        setPage(1);
    };
    const handleClearFilters = () => {
        setFilterDraft(defaultFilters);
        setFilters(defaultFilters);
        setPage(1);
    };

    return (
        <div>
            <Box display="flex" justifyContent="flex-end" mb={2}>
                <Button variant="contained" color="primary" onClick={() => setDialogOpen(true)}>
                    Add Analysis
                </Button>
            </Box>
            <Paper elevation={3} sx={{ mb: 3, p: 2, borderRadius: 2 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item>
                        <TextField
                            label="Start Date"
                            name="startDate"
                            type="date"
                            value={filterDraft.startDate}
                            onChange={handleFilterDraftChange}
                            InputLabelProps={{ shrink: true }}
                            size="small"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <EventIcon fontSize="small" />
                                    </InputAdornment>
                                )
                            }}
                        />
                    </Grid>
                    <Grid item>
                        <TextField
                            label="End Date"
                            name="endDate"
                            type="date"
                            value={filterDraft.endDate}
                            onChange={handleFilterDraftChange}
                            InputLabelProps={{ shrink: true }}
                            size="small"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <EventIcon fontSize="small" />
                                    </InputAdornment>
                                )
                            }}
                        />
                    </Grid>
                    <Grid item>
                        <TextField
                            label="Search"
                            name="searchText"
                            value={filterDraft.searchText}
                            onChange={handleFilterDraftChange}
                            size="small"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" />
                                    </InputAdornment>
                                ),
                                endAdornment: filterDraft.searchText && (
                                    <InputAdornment position="end">
                                        <IconButton size="small" onClick={() => setFilterDraft(f => ({ ...f, searchText: '' }))}>
                                            <ClearIcon fontSize="small" />
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />
                    </Grid>
                    <Grid item>
                        <TextField
                            select
                            label="Pre-Market Expectation"
                            name="premarketexpectation"
                            value={filterDraft.premarketexpectation}
                            onChange={handleFilterDraftChange}
                            size="small"
                            style={{ minWidth: 180 }}
                        >
                            <MenuItem value="">All</MenuItem>
                            {expectationOptions.map(opt => (
                                <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item>
                        <TextField
                            select
                            label="Actual Market Movement"
                            name="marketmovement"
                            value={filterDraft.marketmovement}
                            onChange={handleFilterDraftChange}
                            size="small"
                            style={{ minWidth: 180 }}
                        >
                            <MenuItem value="">All</MenuItem>
                            {expectationOptions.map(opt => (
                                <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item>
                        <Button variant="contained" color="primary" onClick={handleSubmitFilters} sx={{ mr: 1 }}>
                            Submit
                        </Button>
                        <Button variant="outlined" color="secondary" onClick={handleClearFilters} startIcon={<ClearIcon />}>
                            Clear
                        </Button>
                    </Grid>
                </Grid>
            </Paper>
            <SimpleAnalysisTable
                rows={rows}
                loading={loading}
                error={error}
                onEdit={handleEdit}
                onDelete={handleDelete}
                textCellStyle={textCellStyle}
                smallTextCellStyle={smallTextCellStyle}
                viewButtonCellStyle={viewButtonCellStyle}
            />
            <Box display="flex" justifyContent="center" mt={2}>
                <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(_, value) => setPage(value)}
                    color="primary"
                />
            </Box>
            <CreateAnalysisDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onCreate={handleCreate} />
            <EditAnalysisDialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} onUpdate={handleUpdate} initialData={mapRowToForm(editRow)} />
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Delete Analysis</DialogTitle>
                <DialogContent>
                    Are you sure you want to delete this analysis?
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button color="error" variant="contained" onClick={confirmDelete}>Delete</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}
