import React, { useState } from "react";
import { subDays, format } from "date-fns";
import { useReactTable, getCoreRowModel, getPaginationRowModel, flexRender } from "@tanstack/react-table";
import { ConfirmPopup } from './Popup.jsx'
import { UpdateProfitLossEntry } from './ProfitLossModelPopup.jsx'
import { CreateProfitLossEntry } from '../Generic/ProfitLossModelPopup.jsx'
import "react-datepicker/dist/react-datepicker.css";

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
        setPageSize,
        getPageCount,
    } = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: {
            pagination: {
                pageIndex: 0,
                pageSize: 10,
            },
        },
    });


    // Handle row selection
    const handleRowSelection = (rowId) => {
        setSelectedRows((prev) => ({
            ...prev,
            [rowId]: !prev[rowId],
        }));
    };

    // Open Add Entry popup
    const openAddEntryPopup = () => {
        setAddShowModal(true);
    };

    // Close Add Entry popup
    const closeAddEntryPopup = () => {
        setAddShowModal(false);
    };
    // Open modal for confirmation
    const openDeleteConfirmation = () => {
        setShowModal(true);
    };

    // Close modal without deleting
    const closeDeleteConfirmation = () => {
        setShowModal(false);
    };

    const handleDelete = async () => {
        setShowModal(false);
        setDeleting(true);
        const selectedIndexes = Object.keys(selectedRows)
            .filter((index) => selectedRows[index])
            .map((index) => parseInt(index));

        if (selectedIndexes.length === 0) return;

        selectedIndexes.map(async (index) => {
            let entryToDelete = data[index];
            const success = await DeleteRequest(entryToDelete.date);
            if (success) {
                // If API call succeeds, update UI
                setData((prevData) =>
                    prevData.filter((_, index) => !selectedRows[index])
                );
                setSelectedRows({});
            } else {
                alert("Failed to delete records. Please try again.");
            }
        });
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
        setAdding(true)
        const isDuplicate = data.some(
            (item) => item.date === newRecord.date
        );

        if (isDuplicate) {
            alert("Duplicate entry detected! Please enter a unique item.");
            setAdding(false)
            return;
        }

        const success = await CreateRequest(newRecord);
        if (success) {
            // setData((prevData) =>
            //     prevData.map((record) =>
            //         record.date === newRecord.date ? newRecord : record
            //     )
            // );
            setData([newRecord, ...data ])
            setAddShowModal(false);
        }
        setAdding(false)
    };

    return (
        <div className="p-4 border rounded-lg shadow-md bg-white relative">
            <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center space-x-4 mb-2">
                    <button
                        onClick={openDeleteConfirmation}
                        disabled={Object.values(selectedRows).every((val) => !val)}
                        className="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50"
                    >
                        {deleting ? "Deleting..." : "Delete Selected"}
                    </button>
                    <button
                        onClick={openAddEntryPopup}
                        disabled={adding}
                        className="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50"
                    >
                        {adding ? "Adding..." : "Add New Entry"}
                    </button>
                </div>
            </div>

            {/* Table */}
            <table className="w-full border-collapse border border-gray-300">
                <thead>
                    {getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id} className="bg-gray-100">
                            <th className="border p-2">Select</th>
                            {headerGroup.headers.map((header) => (
                                <th key={header.id} className="border p-2">
                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                </th>
                            ))}
                            <th className="border p-2">Update Details</th>
                        </tr>
                    ))}
                </thead>
                <tbody>
                    {getRowModel().rows.map((row, index) => (
                        <tr key={`${row.original.date}_${index}`} className="border">
                            <td className="border p-2 text-center">
                                <input
                                    type="checkbox"
                                    checked={selectedRows[index] || false}
                                    onChange={() => handleRowSelection(index)}
                                />
                            </td>
                            {row.getVisibleCells().map((cell) => (
                                <td key={cell.id} className="border p-2">
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                            ))}
                            <td className="border p-2">
                                <button
                                    onClick={() => handleEditClick(row.original)}
                                    className="px-3 py-1 bg-blue-500 text-white rounded"
                                >
                                    Edit
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Pagination Controls */}
            <div className="mt-4 flex justify-between">
                <button
                    onClick={previousPage}
                    disabled={!getCanPreviousPage()}
                    className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
                >
                    Previous
                </button>
                <button
                    onClick={nextPage}
                    disabled={!getCanNextPage()}
                    className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
                >
                    Next
                </button>
            </div>

            {/* Page info */}
            <div className="mt-4 text-sm">
                <p>
                    Page {getState().pagination.pageIndex + 1} of {getPageCount()}
                </p>
                <p>
                    Showing {getRowModel().rows.length} of {data.length} records
                </p>
            </div>

            {/* Confirmation Modal */}
            {showModal && (
                <ConfirmPopup trigger={showModal} message="Do you want to delete the selected records ?" onCancel={closeDeleteConfirmation} onConfirm={handleDelete} />
            )}

            {/* Edit Entry Modal */}
            {isEditModalOpen && (
                <UpdateProfitLossEntry
                    isOpen={isEditModalOpen}
                    record={recordToEdit}
                    onClose={() => setIsEditModalOpen(false)}
                    onSave={handleUpdateRecord}
                />
            )}

            {/* Add Entry Model */}
            {
                showAddModal && (
                    <CreateProfitLossEntry isOpen={showAddModal} onClose={() => setAddShowModal(false)} onSave={handleCreateRecord} />
                )
            }
        </div>
    );
};

export default PagenationTable;