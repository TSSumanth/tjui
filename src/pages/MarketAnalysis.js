import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert, Pagination, Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, Grid, TextField, MenuItem, Tabs, Tab, IconButton, Typography } from '@mui/material';
import { getAllMarketAnalysis, createMarketAnalysis, updateMarketAnalysis, deleteMarketAnalysis } from '../services/marketanalysis';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';

function AnalysisViewDialog({ open, onClose, title, content }) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <Box sx={{
                    p: 2,
                    backgroundColor: 'background.paper',
                    borderRadius: 1,
                    '& .ql-editor': {
                        padding: 0,
                        '& p': { margin: '0.5em 0' }
                    }
                }}>
                    <div dangerouslySetInnerHTML={{ __html: content }} />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
}

function SimpleAnalysisTable({ rows, loading, error, onEdit, onDelete }) {
    const [viewDialog, setViewDialog] = useState({ open: false, title: '', content: '' });
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
    if (loading) return <CircularProgress sx={{ m: 2 }} />;
    if (error) return <Alert severity="error">{error}</Alert>;
    if (!rows.length) return <Alert severity="info">No analysis data found.</Alert>;
    const handleViewAnalysis = (title, content) => {
        setViewDialog({ open: true, title, content });
    };
    const handleRowClick = (row, event) => {
        if (event.target.closest('button')) return;
        onEdit(row);
    };
    return (
        <>
            <TableContainer
                component={Paper}
                sx={{
                    mt: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    borderRadius: '16px',
                    overflow: 'hidden'
                }}
            >
                <Table sx={{ minWidth: 900 }} aria-label="market analysis table">
                    <TableHead>
                        <TableRow
                            sx={{
                                background: 'linear-gradient(90deg, #1976d2 60%, #1565c0 100%)',
                                boxShadow: '0 2px 8px rgba(25, 118, 210, 0.15)',
                                height: 64,
                                borderTopLeftRadius: '16px',
                                borderTopRightRadius: '16px',
                                position: 'sticky',
                                top: 0,
                                zIndex: 2
                            }}
                        >
                            <TableCell sx={{ ...smallTextCellStyle, color: 'white', fontWeight: 'bold', fontSize: '1.1rem', letterSpacing: 1 }}>Date</TableCell>
                            <TableCell sx={{ ...smallTextCellStyle, color: 'white', fontWeight: 'bold', fontSize: '1.1rem', letterSpacing: 1 }}>Event Day</TableCell>
                            <TableCell sx={{ ...viewButtonCellStyle, color: 'white', fontWeight: 'bold', fontSize: '1.1rem', letterSpacing: 1 }}>Event Description</TableCell>
                            <TableCell sx={{ ...textCellStyle, color: 'white', fontWeight: 'bold', fontSize: '1.1rem', letterSpacing: 1 }}>Pre-Market Expectation</TableCell>
                            <TableCell sx={{ ...viewButtonCellStyle, color: 'white', fontWeight: 'bold', fontSize: '1.1rem', letterSpacing: 1 }}>Pre-Market Analysis</TableCell>
                            <TableCell sx={{ ...textCellStyle, color: 'white', fontWeight: 'bold', fontSize: '1.1rem', letterSpacing: 1 }}>Actual Market Movement</TableCell>
                            <TableCell sx={{ ...viewButtonCellStyle, color: 'white', fontWeight: 'bold', fontSize: '1.1rem', letterSpacing: 1 }}>Post-Market Analysis</TableCell>
                            <TableCell sx={{ ...viewButtonCellStyle, color: 'white', fontWeight: 'bold', fontSize: '1.1rem', letterSpacing: 1 }}>Delete</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.map((row, idx) => (
                            <TableRow
                                key={row.id || idx}
                                sx={{
                                    '&:nth-of-type(odd)': { backgroundColor: 'action.hover' },
                                    '&:hover': { backgroundColor: 'action.selected', cursor: 'pointer' }
                                }}
                                onClick={e => handleRowClick(row, e)}
                            >
                                <TableCell sx={smallTextCellStyle}>{row.date}</TableCell>
                                <TableCell sx={smallTextCellStyle}>{(row.event_day === 1 || row.event_day === '1') ? 'Yes' : 'No'}</TableCell>
                                <TableCell sx={viewButtonCellStyle}>
                                    {row.event_description ? (
                                        <IconButton
                                            size="small"
                                            onClick={(e) => { e.stopPropagation(); handleViewAnalysis('Event Description', row.event_description); }}
                                            color="primary"
                                        >
                                            <VisibilityIcon />
                                        </IconButton>
                                    ) : '-'}
                                </TableCell>
                                <TableCell sx={textCellStyle}>{row.premarket_expectation}</TableCell>
                                <TableCell sx={viewButtonCellStyle}>
                                    <IconButton
                                        size="small"
                                        onClick={(e) => { e.stopPropagation(); handleViewAnalysis('Pre-Market Analysis', row.premarket_analysis); }}
                                        color="primary"
                                    >
                                        <VisibilityIcon />
                                    </IconButton>
                                </TableCell>
                                <TableCell sx={textCellStyle}>{row.market_movement}</TableCell>
                                <TableCell sx={viewButtonCellStyle}>
                                    <IconButton
                                        size="small"
                                        onClick={(e) => { e.stopPropagation(); handleViewAnalysis('Post-Market Analysis', row.postmarket_analysis); }}
                                        color="primary"
                                    >
                                        <VisibilityIcon />
                                    </IconButton>
                                </TableCell>
                                <TableCell sx={viewButtonCellStyle}>
                                    <IconButton
                                        size="small"
                                        color="error"
                                        onClick={e => { e.stopPropagation(); onDelete(row); }}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <AnalysisViewDialog
                open={viewDialog.open}
                onClose={() => setViewDialog({ ...viewDialog, open: false })}
                title={viewDialog.title}
                content={viewDialog.content}
            />
        </>
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

function EditAnalysisDialog({ open, onClose, onUpdate, initialData }) {
    const [form, setForm] = useState(initialData || initialForm);
    const [error, setError] = useState(null);
    const [tab, setTab] = useState(0);
    useEffect(() => {
        if (open) {
            setForm(initialData || initialForm);
            setError(null);
            setTab(0);
        }
    }, [open, initialData]);
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
        await onUpdate(form);
    };
    const handleClose = () => {
        setError(null);
        onClose();
    };
    return (
        <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
            <DialogTitle>Edit Market Analysis</DialogTitle>
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
                    Update
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
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editRow, setEditRow] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteRow, setDeleteRow] = useState(null);
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

    return (
        <div>
            <Box display="flex" justifyContent="flex-end" mb={2}>
                <Button variant="contained" color="primary" onClick={() => setDialogOpen(true)}>
                    Add Analysis
                </Button>
            </Box>
            <SimpleAnalysisTable rows={rows} loading={loading} error={error} onEdit={handleEdit} onDelete={handleDelete} />
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
