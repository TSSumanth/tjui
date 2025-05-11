import React, { useEffect, useState } from 'react';
import { Pagination, Box, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { getAllMarketAnalysis, createMarketAnalysis, updateMarketAnalysis, deleteMarketAnalysis } from '../services/marketanalysis';
import SimpleAnalysisTable from '../components/MarketAnalysis/SimpleAnalysisTable';
import CreateAnalysisDialog from '../components/MarketAnalysis/CreateAnalysisDialog';
import EditAnalysisDialog from '../components/MarketAnalysis/EditAnalysisDialog';
import { initialForm } from '../components/MarketAnalysis/shared';

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
