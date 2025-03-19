import React, { useState, useMemo, useEffect } from "react";
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Button, Checkbox, Dialog, DialogTitle, DialogContent, DialogActions,
    IconButton, Typography
} from "@mui/material";
import { Delete, Edit, Visibility, Close } from "@mui/icons-material";
import { useReactTable, getCoreRowModel, getPaginationRowModel, flexRender } from "@tanstack/react-table";
import TagModal from "./TagsModelPopup.jsx";
import DOMPurify from "dompurify";

const TagsTable = ({ columns, initialdata, DeleteRequest, UpdateRequest, CreateRequest }) => {
    const [data, setData] = useState(initialdata || []);
    const [selectedRows, setSelectedRows] = useState({});
    const [modalState, setModalState] = useState({ type: null, isOpen: false, record: null });
    const [isProcessing, setIsProcessing] = useState(false);
    const [infoPopupOpen, setInfoPopupOpen] = useState(false);
    const [popupContent, setPopupContent] = useState("");

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: { pagination: { pageIndex: 0, pageSize: 25 } },
    });

    useEffect(() => {
        setData(initialdata || []);
    }, [initialdata]);

    const handleViewClick = (content) => {
        setPopupContent(content);
        setInfoPopupOpen(true);
    };

    const handleClosePopup = () => {
        setInfoPopupOpen(false);
    };

    const selectedIndexes = useMemo(() => Object.keys(selectedRows).filter(id => selectedRows[id]), [selectedRows]);

    const handleModal = (type, record = null) => setModalState({ type, isOpen: !!type, record });

    const handleRowSelection = (index) => setSelectedRows(prev => ({ ...prev, [index]: !prev[index] }));

    const handleDelete = async () => {
        setModalState({ type: null, isOpen: false });
        setIsProcessing(true);

        // Get the names of selected records
        const selectedNames = selectedIndexes.map(index => data[index].name);

        // Delete records asynchronously
        await Promise.all(selectedNames.map(async (name) => {
            await DeleteRequest(name);
        }));

        // Update state by removing deleted records using their names
        setData(prev => prev.filter(record => !selectedNames.includes(record.name)));

        setSelectedRows({});
        setIsProcessing(false);
    };

    const handleSave = async (newRecord, isEdit = false) => {
        setIsProcessing(true);
        if (!isEdit && data.some(item => item.name === newRecord.name)) {
            alert(`Tag Name ${newRecord.name} already exists!`);
            setIsProcessing(false);
            return;
        }

        const success = isEdit ? await UpdateRequest(modalState.record.name, newRecord) : await CreateRequest(newRecord);
        if (success) {
            setData(isEdit ? data.map(item => (item.name === modalState.record.name ? newRecord : item)) : [newRecord, ...data]);
            handleModal(null);
        }
        setIsProcessing(false);
    };

    return (
        <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 3 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                <Button variant="contained" color="error" startIcon={<Delete />} onClick={() => handleModal("delete")} disabled={!selectedIndexes.length}>
                    {isProcessing ? "Deleting..." : "Delete Selected"}
                </Button>
                <Button variant="contained" color="primary" onClick={() => handleModal("create")} disabled={isProcessing}>
                    {isProcessing ? "Adding..." : "Add New Entry"}
                </Button>
            </div>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: "lightblue" }}>
                            <TableCell>Select</TableCell>
                            {table.getHeaderGroups().map(group => (
                                group.headers.map(header => (
                                    <TableCell key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</TableCell>
                                ))
                            ))}
                            <TableCell>Edit</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {table.getRowModel().rows.map((row, index) => (
                            <TableRow key={row.original.id} >
                                <TableCell sx={{
                                    backgroundColor: index % 2 === 0 ? "#f5f5f5" : "#e0e0e0", // Alternating colors
                                }}>
                                    <Checkbox checked={!!selectedRows[index]} onChange={() => handleRowSelection(index)} />
                                </TableCell>
                                {row.getVisibleCells().map(cell => (
                                    <TableCell key={cell.id} sx={{
                                        backgroundColor: index % 2 === 0 ? "#f5f5f5" : "#e0e0e0", // Alternating colors
                                    }}>
                                        {cell.column.id === "description" ? (
                                            <IconButton onClick={() => handleViewClick(cell.getValue())} color="primary">
                                                <Visibility />
                                            </IconButton>
                                        ) : flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                                <TableCell sx={{
                                    backgroundColor: index % 2 === 0 ? "#f5f5f5" : "#e0e0e0", // Alternating colors
                                }}>
                                    <IconButton color="secondary" onClick={() => handleModal("edit", row.original)}>
                                        <Edit />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
                <Button variant="outlined" onClick={table.previousPage} disabled={!table.getCanPreviousPage()}>Previous</Button>
                <Typography variant="body2">Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}</Typography>
                <Button variant="outlined" onClick={table.nextPage} disabled={!table.getCanNextPage()}>Next</Button>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={modalState.type === "delete"} onClose={() => handleModal(null)}>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>Are you sure you want to delete the selected records?</DialogContent>
                <DialogActions>
                    <Button onClick={() => handleModal(null)}>Cancel</Button>
                    <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={infoPopupOpen} onClose={handleClosePopup} fullWidth maxWidth="sm">
                <DialogTitle>
                    Description
                    <IconButton onClick={handleClosePopup} sx={{ position: "absolute", right: 8, top: 8 }}>
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(popupContent) }} />
                </DialogContent>
            </Dialog>

            {/* Edit and Create Modals */}
            {modalState.type === "edit" && <TagModal isOpen record={modalState.record} onClose={() => handleModal(null)} onSave={(data) => handleSave(data, true)} />}
            {modalState.type === "create" && <TagModal isOpen onClose={() => handleModal(null)} onSave={handleSave} />}
        </Paper>
    );
};

export default TagsTable;