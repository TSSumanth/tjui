import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Tabs, Tab, Grid, TextField, MenuItem, Alert } from '@mui/material';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { expectationOptions, quillModules, initialForm } from './shared';

export default function CreateAnalysisDialog({ open, onClose, onCreate }) {
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