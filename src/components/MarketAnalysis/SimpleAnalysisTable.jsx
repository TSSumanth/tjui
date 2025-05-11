import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import AnalysisViewDialog from './AnalysisViewDialog';

export default function SimpleAnalysisTable({ rows, loading, error, onEdit, onDelete, textCellStyle, smallTextCellStyle, viewButtonCellStyle }) {
    const [viewDialog, setViewDialog] = useState({ open: false, title: '', content: '' });
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