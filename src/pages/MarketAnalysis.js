import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert, Pagination, Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, Grid, TextField, MenuItem, Tabs, Tab } from '@mui/material';
import { getAllMarketAnalysis, createMarketAnalysis } from '../services/marketanalysis';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

function SimpleAnalysisTable({ rows, loading, error }) {
    if (loading) return <CircularProgress sx={{ m: 2 }} />;
    if (error) return <Alert severity="error">{error}</Alert>;
    if (!rows.length) return <Alert severity="info">No analysis data found.</Alert>;
    return (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Event Day</TableCell>
                        <TableCell>Event Description</TableCell>
                        <TableCell>Pre-Market Expectation</TableCell>
                        <TableCell>Pre-Market Analysis</TableCell>
                        <TableCell>Post-Market Analysis</TableCell>
                        <TableCell>Actual Market Movement</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rows.map((row, idx) => (
                        <TableRow key={row.id || idx}>
                            <TableCell>{row.id}</TableCell>
                            <TableCell>{row.date}</TableCell>
                            <TableCell>{row.event_day}</TableCell>
                            <TableCell>{row.event_description}</TableCell>
                            <TableCell>{row.premarket_expectation}</TableCell>
                            <TableCell>
                                <div dangerouslySetInnerHTML={{ __html: row.premarket_analysis }} />
                            </TableCell>
                            <TableCell>
                                <div dangerouslySetInnerHTML={{ __html: row.postmarket_analysis }} />
                            </TableCell>
                            <TableCell>{row.market_movement}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}

const expectationOptions = [
    'Upwards(Constant Rise)',
    'Downwards(Constant fall)',
    'Sideways(Neutral)',
    'Volatile(Neutral)',
    'Upwards(Volatile)',
    'Downwards(Volatile)'
];

const initialForm = {
    date: new Date().toISOString().slice(0, 10),
    eventday: '0',
    eventdescription: '',
    premarketexpectation: '',
    premarketanalysis: '',
    postmarketanalysis: '',
    marketmovement: ''
};

const quillModules = {
    toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'align': [] }],
        ['clean']
    ]
};

function CreateAnalysisDialog({ open, onClose, onCreate }) {
    const [form, setForm] = useState(initialForm);
    const [error, setError] = useState(null);
    const [tab, setTab] = useState(0);
    useEffect(() => {
        if (open) {
            setForm({ ...initialForm });
            setError(null);
            setTab(0);
        }
    }, [open]);
    const handleChange = (e) => {
        setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    };
    const handleQuillChange = (name, value) => {
        setForm(f => ({ ...f, [name]: value }));
    };
    const handleTabChange = (e, newValue) => {
        setTab(newValue);
    };
    const handleSubmit = async () => {
        if (!form.date) {
            setError('Date is required');
            return;
        }
        setError(null);
        await onCreate(form);
        setForm(initialForm);
    };
    const handleClose = () => {
        setForm(initialForm);
        setError(null);
        onClose();
    };
    return (
        <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
            <DialogTitle>Add Market Analysis</DialogTitle>
            <DialogContent>
                <Tabs value={tab} onChange={handleTabChange} sx={{ mb: 2 }}>
                    <Tab label="General" />
                    <Tab label="Pre-Market" />
                    <Tab label="Post-Market" />
                </Tabs>
                {tab === 0 && (
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Date"
                                name="date"
                                type="date"
                                value={form.date}
                                onChange={handleChange}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                select
                                fullWidth
                                label="Event Day"
                                name="eventday"
                                value={form.eventday}
                                onChange={handleChange}
                            >
                                <MenuItem value="1">Yes</MenuItem>
                                <MenuItem value="0">No</MenuItem>
                            </TextField>
                        </Grid>
                        {form.eventday === '1' && (
                            <Grid item xs={12} sm={12}>
                                <TextField
                                    fullWidth
                                    label="Event Description"
                                    name="eventdescription"
                                    value={form.eventdescription}
                                    onChange={handleChange}
                                    multiline
                                    minRows={2}
                                />
                            </Grid>
                        )}
                    </Grid>
                )}
                {tab === 1 && (
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                select
                                fullWidth
                                label="Pre-Market Expectation"
                                name="premarketexpectation"
                                value={form.premarketexpectation}
                                onChange={handleChange}
                            >
                                {expectationOptions.map(opt => (
                                    <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12}>
                            <ReactQuill
                                theme="snow"
                                value={form.premarketanalysis}
                                onChange={val => handleQuillChange('premarketanalysis', val)}
                                modules={quillModules}
                                style={{ height: 300, marginBottom: 16, background: 'white' }}
                                placeholder="Write your pre-market analysis here. Use paragraphs, bullet points, or highlights as needed."
                            />
                        </Grid>
                    </Grid>
                )}
                {tab === 2 && (
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                select
                                fullWidth
                                label="Actual Market Movement"
                                name="marketmovement"
                                value={form.marketmovement}
                                onChange={handleChange}
                            >
                                {expectationOptions.map(opt => (
                                    <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12}>
                            <ReactQuill
                                theme="snow"
                                value={form.postmarketanalysis}
                                onChange={val => handleQuillChange('postmarketanalysis', val)}
                                modules={quillModules}
                                style={{ height: 300, marginBottom: 16, background: 'white' }}
                                placeholder="Write your post-market analysis here. Use paragraphs, bullet points, or highlights as needed."
                            />
                        </Grid>
                    </Grid>
                )}
                {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <Button variant="contained" color="primary" onClick={handleSubmit}>
                    Add
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default function MarketAnalysis() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [dialogOpen, setDialogOpen] = useState(false);
    const limit = 10;

    const fetchData = () => {
        setLoading(true);
        setError(null);
        getAllMarketAnalysis({ page, limit })
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
    }, [page]);

    const handleCreate = async (form) => {
        await createMarketAnalysis(form);
        setDialogOpen(false);
        fetchData();
    };

    return (
        <div>
            <Box display="flex" justifyContent="flex-end" mb={2}>
                <Button variant="contained" color="primary" onClick={() => setDialogOpen(true)}>
                    Add Analysis
                </Button>
            </Box>
            <SimpleAnalysisTable rows={rows} loading={loading} error={error} />
            <Box display="flex" justifyContent="center" mt={2}>
                <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(_, value) => setPage(value)}
                    color="primary"
                />
            </Box>
            <CreateAnalysisDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onCreate={handleCreate} />
        </div>
    );
}
