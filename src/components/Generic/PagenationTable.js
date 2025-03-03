import React from "react";
import { useReactTable, getCoreRowModel, getPaginationRowModel, flexRender } from "@tanstack/react-table";

const PagenationTable = ({ columns, data }) => {
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
                pageIndex: 0,  // Start on page 0 (1st page)
                pageSize: 10,  // Custom page size (15 records per page)
            },
        },
    });

    const handlePreviousPage = () => {
        if (getCanPreviousPage()) {
            previousPage();
        }
    };

    const handleNextPage = () => {
        console.log("nextbuttonclicked")
        if (getCanNextPage()) {
            console.log("Navigating to next page");
            console.log(getRowModel().rows);
            console.log(getPageCount())
            nextPage();
        }
    };

    return (
        <div className="p-4 border rounded-lg shadow-md bg-white">
            {/* Table */}
            <table className="w-full border-collapse border border-gray-300">
                <thead>
                    {getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id} className="bg-gray-100">
                            {headerGroup.headers.map((header) => (
                                <th key={header.id} className="border p-2">
                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody>
                    {getRowModel().rows.map((row, index) => (
                        <tr key={`${index}`} className="border">
                            {row.getVisibleCells().map((cell) => (
                                <td key={cell.id} className="border p-2">
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Pagination */}
            <div className="mt-4 flex justify-between">
                <button
                    onClick={handlePreviousPage}
                    disabled={!getCanPreviousPage()}
                    className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
                >
                    Previous
                </button>
                <button
                    onClick={handleNextPage}
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
        </div>
    );
};

export default PagenationTable;