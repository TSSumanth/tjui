import React, { useState } from "react";
import { useReactTable, getCoreRowModel, getPaginationRowModel, flexRender } from "@tanstack/react-table";
import {
    Box,
    Button,
    Table,
    TableContainer,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    Paper,
    Checkbox,
    Typography,
    Stack
} from "@mui/material";
import { ConfirmPopup } from "../Generic/Popup.jsx";
import  ProfitLossForm from "./ProfitLossModelPopup.jsx";

const PagenationTable = ({ columns, initialdata, DeleteRequest, UpdateRequest, CreateRequest }) => {
    const [data, setData] = useState(initialdata || []);
    const [selectedRows, setSelectedRows] = useState({});
    const [deleting, setDeleting] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [recordToEdit, setRecordToEdit] = useState(null);
    const [showAddModal, setAddShowModal] = useState(false);
    const [adding, setAdding] = useState(false);

    const {
        getHeaderGroups,
        getRowModel,
        getCanPreviousPage,
        getCanNextPage,
        previousPage,
        nextPage,
        getState,
        getPageCount,
    } = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: {
            pagination: {
                pageIndex: 0,
                pageSize: 5,
            },
        },
    });

    const handleRowSelection = (rowId) => {
        setSelectedRows((prev) => ({
            ...prev,
            [rowId]: !prev[rowId],
        }));
    };

    const openAddEntryPopup = () => setAddShowModal(true);
    const closeAddEntryPopup = () => setAddShowModal(false);
    const openDeleteConfirmation = () => setShowModal(true);
    const closeDeleteConfirmation = () => setShowModal(false);

    const handleDelete = async () => {
        setShowModal(false);
        setDeleting(true);

        const selectedIndexes = Object.keys(selectedRows)
            .filter((index) => selectedRows[index])
            .map((index) => parseInt(index));

        if (selectedIndexes.length === 0) {
            setDeleting(false);
            return;
        }

        const deletionResults = await Promise.all(
            selectedIndexes.map(async (index) => {
                let entryToDelete = data[index];
                const success = await DeleteRequest(entryToDelete.date);
                return { index, name: entryToDelete.date, success };
            })
        );

        const failedDeletions = deletionResults.filter(result => !result.success);

        if (failedDeletions.length > 0) {
            const failedNames = failedDeletions.map(result => result.name).join(", ");
            alert(`Failed to delete the following records: ${failedNames}. Please try again.`);
        }

        setData((prevData) =>
            prevData.filter((_, index) => !selectedIndexes.includes(index))
        );

        setSelectedRows({});
        setDeleting(false);
    };

    const handleEditClick = (record) => {
        setRecordToEdit(record);
        setIsEditModalOpen(true);
    };

    const handleUpdateRecord = async (updatedRecord) => {
        const success = await UpdateRequest(updatedRecord);
        if (success) {
            setData((prevData) =>
                prevData.map((record) =>
                    record.date === updatedRecord.date ? updatedRecord : record
                )
            );
            setIsEditModalOpen(false);
        }
    };

    const handleCreateRecord = async (newRecord) => {
        setAdding(true);

        if (Array.isArray(data)) {
            const isDuplicate = data.some((item) => item.date === newRecord.date);

            if (isDuplicate) {
                alert("Duplicate entry detected! Please enter a unique item.");
                setAdding(false);
                return;
            }
        }

        const success = await CreateRequest(newRecord);
        if (success) {
            setData([newRecord, ...data]);
            setAddShowModal(false);
        }
        setAdding(false);
    };

    return (
        <Box p={3} component={Paper} elevation={3} sx={{ borderRadius: 2 }}>
            {/* Header & Buttons */}
            <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                <Button
                    variant="contained"
                    color="error"
                    onClick={openDeleteConfirmation}
                    disabled={Object.values(selectedRows).every((val) => !val)}
                >
                    {deleting ? "Deleting..." : "Delete Selected"}
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={openAddEntryPopup}
                    disabled={adding}
                >
                    {adding ? "Adding..." : "Add New Entry"}
                </Button>
            </Stack>

            {/* Table */}
            <TableContainer component={Paper} elevation={1} sx={{ borderRadius: 2 }}>
                <Table>
                    <TableHead sx={{ backgroundColor: "lightblue" }}>
                        {getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                <TableCell>Select</TableCell>
                                {headerGroup.headers.map((header) => (
                                    <TableCell key={header.id}>
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableCell>
                                ))}
                                <TableCell>Update Details</TableCell>
                            </TableRow>
                        ))}
                    </TableHead>
                    <TableBody>
                        {getRowModel().rows.map((row, index) => (
                            <TableRow key={`${row.original.date}_${index}`}>
                                <TableCell sx={{
                                    backgroundColor: index % 2 === 0 ? "#f5f5f5" : "#e0e0e0", // Alternating colors
                                }}>
                                    <Checkbox
                                        checked={selectedRows[index] || false}
                                        onChange={() => handleRowSelection(index)}
                                    />
                                </TableCell>
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id} sx={{
                                        backgroundColor: index % 2 === 0 ? "#f5f5f5" : "#e0e0e0", // Alternating colors
                                    }}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                                <TableCell sx={{
                                    backgroundColor: index % 2 === 0 ? "#f5f5f5" : "#e0e0e0", // Alternating colors
                                }}>
                                    <Button
                                        variant="outlined"
                                        color="secondary"
                                        onClick={() => handleEditClick(row.original)}
                                    >
                                        Edit
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Pagination Controls */}
            <Stack direction="row" justifyContent="space-between" mt={3}>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={previousPage}
                    disabled={!getCanPreviousPage()}
                >
                    Previous
                </Button>
                <Typography>
                    Page {getState().pagination.pageIndex + 1} of {getPageCount()}
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={nextPage}
                    disabled={!getCanNextPage()}
                >
                    Next
                </Button>
            </Stack>

            {/* Confirmation Modal */}
            {showModal && (
                <ConfirmPopup trigger={showModal} message="Do you want to delete the selected records?" onCancel={closeDeleteConfirmation} onConfirm={handleDelete} />
            )}

            {/* Edit Entry Modal */}
            {isEditModalOpen && (
                <ProfitLossForm
                    isOpen={isEditModalOpen}
                    record={recordToEdit}
                    onClose={() => setIsEditModalOpen(false)}
                    onSave={handleUpdateRecord}
                    isUpdate={isEditModalOpen}
                />
            )}

            {/* Add Entry Modal */}
            {showAddModal && (
                <ProfitLossForm isOpen={showAddModal} onClose={closeAddEntryPopup} onSave={handleCreateRecord} />
            )}
        </Box>
    );
};

export default PagenationTable;