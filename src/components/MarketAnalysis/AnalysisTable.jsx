import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Tooltip, Box, Typography } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import AnalysisViewDialog from './AnalysisViewDialog';

export default function AnalysisTable({ rows, loading, error, onEdit, onDelete, textCellStyle, smallTextCellStyle, viewButtonCellStyle }) {
    const [viewDialog, setViewDialog] = useState({ open: false, title: '', content: '' });
    const handleViewAnalysis = (title, content) => {
        setViewDialog({ open: true, title, content });
    };
    const handleRowClick = (row, event) => {
        if (event.target.closest('button')) return;
        onEdit(row);
    };
    // Helper for tooltips on truncated text
    const renderCellWithTooltip = (value, style, maxLen = 30) => {
        if (!value) return '-';
        const isTruncated = value.length > maxLen;
        return (
            <Tooltip title={isTruncated ? value : ''} arrow placement="top">
                <span style={{ ...style, display: 'inline-block', maxWidth: style.maxWidth, overflow: 'hidden', textOverflow: 'ellipsis', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>{value}</span>
            </Tooltip>
        );
    };
    // Empty state
    if (!loading && (!rows || rows.length === 0)) {
        return (
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" sx={{ mt: 6, mb: 6 }}>
                <InfoOutlinedIcon color="disabled" sx={{ fontSize: 60, mb: 1 }} />
                <Typography variant="h6" color="text.secondary">No analysis data found.</Typography>
            </Box>
        );
    }
    return (
        <>
            <TableContainer
                component={Paper}
                sx={{
                    mt: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    borderRadius: '16px',
                    overflow: 'auto',
                    maxWidth: '100vw',
                }}
            >
                <Table sx={{ minWidth: 900 }} aria-label="market analysis table">
                    <TableHead>
                        <TableRow
                            sx={{
                                background: 'linear-gradient(90deg, #1976d2 60%, #1565c0 100%)',
                                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.18)',
                                height: 64,
                                borderTopLeftRadius: '16px',
                                borderTopRightRadius: '16px',
                                position: 'sticky',
                                top: 0,
                                zIndex: 2
                            }}
                        >
                            <TableCell sx={{ ...smallTextCellStyle, color: 'white', fontWeight: 'bold', fontSize: '1.1rem', letterSpacing: 1, position: 'sticky', left: 0, background: 'inherit', zIndex: 3 }}>Date</TableCell>
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
                                    backgroundColor: idx % 2 === 0 ? 'action.hover' : '#f5f7fa',
                                    borderBottom: '1.5px solid #e3e6ee',
                                    '&:hover': {
                                        backgroundColor: 'action.selected',
                                        boxShadow: '0 2px 8px rgba(25, 118, 210, 0.10)',
                                        transform: 'scale(1.01)',
                                        transition: 'all 0.15s',
                                    },
                                    cursor: 'pointer',
                                }}
                                onClick={e => handleRowClick(row, e)}
                            >
                                <TableCell sx={{ ...smallTextCellStyle, position: 'sticky', left: 0, background: '#fff', zIndex: 2 }}>
                                    {row.date}
                                </TableCell>
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
                                <TableCell sx={textCellStyle}>
                                    {renderCellWithTooltip(row.premarket_expectation, textCellStyle)}
                                </TableCell>
                                <TableCell sx={viewButtonCellStyle}>
                                    <IconButton
                                        size="small"
                                        onClick={(e) => { e.stopPropagation(); handleViewAnalysis('Pre-Market Analysis', row.premarket_analysis); }}
                                        color="primary"
                                    >
                                        <VisibilityIcon />
                                    </IconButton>
                                </TableCell>
                                <TableCell sx={textCellStyle}>
                                    {renderCellWithTooltip(row.market_movement, textCellStyle)}
                                </TableCell>
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