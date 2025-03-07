import React, { useState } from "react";
import { subDays, format } from "date-fns";
import { useReactTable, getCoreRowModel, getPaginationRowModel, flexRender } from "@tanstack/react-table";
import { ConfirmPopup, InfoPopup } from '../Generic/Popup.jsx'
import { UpdateTag } from '../Generic/TagsModelPopup.jsx'
import { CreateTag } from '../Generic/TagsModelPopup.jsx'
import DOMPurify from 'dompurify';
const PagenationTable = ({ columns, initialdata, DeleteRequest, UpdateRequest, CreateRequest }) => {
    const [data, setData] = useState(initialdata || []);
    const [selectedRows, setSelectedRows] = useState({});
    const [deleting, setDeleting] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [recordToEdit, setRecordToEdit] = useState(null);
    const [showAddModal, setAddShowModal] = useState(false);
    const [adding, setAdding] = useState(false);
    const [showInfoPopup, setShowInfoPopup] = useState(false);
    const [popupContent, setPopupContent] = useState("");
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
                pageSize: 25,
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

        if (selectedIndexes.length === 0) {
            setDeleting(false);
            return;
        }

        // Wait for all deletions to complete using Promise.all
        const deletionResults = await Promise.all(
            selectedIndexes.map(async (index) => {
                let entryToDelete = data[index];
                const success = await DeleteRequest(entryToDelete.name);
                return { index, name: entryToDelete.name, success };
            })
        );

        // Filter out failed deletions
        const failedDeletions = deletionResults.filter(result => !result.success);

        if (failedDeletions.length > 0) {
            const failedNames = failedDeletions.map(result => result.name).join(", ");
            alert(`Failed to delete the following records: ${failedNames}. Please try again.`);
        }

        // Remove the deleted items from the data
        setData((prevData) =>
            prevData.filter((_, index) => !selectedIndexes.includes(index))
        );

        // Reset selected rows
        setSelectedRows({});

        setDeleting(false);
    };

    const handleEditClick = (record) => {
        setRecordToEdit(record);
        setIsEditModalOpen(true);
    };

    const handleUpdateRecord = async (updatedRecord) => {
        if (recordToEdit.name !== updatedRecord.name) {
            const isDuplicate = data.some(
                (item) => item.name === updatedRecord.name
            );

            if (isDuplicate) {
                alert(`Duplicate entry detected! Please enter a unique tag name. Tag Name ${updatedRecord.name} is already present`);
                setIsEditModalOpen(false)
                return;
            }
            updatedRecord.id = recordToEdit.id;
        }
        else {
            updatedRecord.id = recordToEdit.id;
        }
        const success = await UpdateRequest(recordToEdit.name, updatedRecord);
        if (success) {
            setData((prevData) =>
                prevData.map((record) =>
                    record.name === recordToEdit.name ? updatedRecord : record
                )
            );
            setIsEditModalOpen(false);
        }
    };

    const handleCreateRecord = async (newRecord) => {
        setAdding(true)
        if (Array.isArray(data)) {
            console.log(data)
            const isDuplicate = data.some(
                (item) => item.name === newRecord.name
            );

            if (isDuplicate) {
                alert(`Duplicate entry detected! Please enter a unique tag name. Tag Name ${newRecord.name} is already present`);
                setAdding(false)
                return;
            }
        }

        const success = await CreateRequest(newRecord);
        if (success) {
            if (Array.isArray(data)) {
                setData([newRecord, ...data])
            } else {
                setData([newRecord])
            }

            setAddShowModal(false);
        }
        setAdding(false)
    };

    const sanitizeAndRenderHTML = (htmlString) => {
        const sanitizedHtml = DOMPurify.sanitize(htmlString);
        return <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
    };

    const handleViewClick = (content) => {
        setPopupContent(content);
        setShowInfoPopup(true);
    };

    const closeInfoPopup = () => {
        setShowInfoPopup(false);
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
                        <tr key={`${row.original.id}`} className="border">
                            <td className="border p-2 text-center">
                                <input
                                    type="checkbox"
                                    checked={selectedRows[index] || false}
                                    onChange={() => handleRowSelection(index)}
                                />
                            </td>
                            {row.getVisibleCells().map((cell) => (
                                <td key={cell.id} className="border p-2">
                                    {cell.column.id === 'description' // Check if it's the description cell
                                        ? (
                                            <button
                                                onClick={() => handleViewClick(cell.getValue())}
                                                className="px-3 py-1 bg-blue-500 text-white rounded"
                                            >
                                                View
                                            </button>)
                                        : flexRender(cell.column.columnDef.cell, cell.getContext())}
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
                <UpdateTag
                    isOpen={isEditModalOpen}
                    record={recordToEdit}
                    onClose={() => setIsEditModalOpen(false)}
                    onSave={handleUpdateRecord}
                />
            )}

            {/* Add Entry Model */}
            {
                showAddModal && (
                    <CreateTag isOpen={showAddModal} onClose={() => setAddShowModal(false)} onSave={handleCreateRecord} />
                )
            }

            {/* Popup */}
            {showInfoPopup && (
                <InfoPopup trigger = {showInfoPopup} onClose = {closeInfoPopup}>
                    <div>
                        {sanitizeAndRenderHTML(popupContent)}
                    </div>
                </InfoPopup>
            )}
        </div>
    );
};

export default PagenationTable;