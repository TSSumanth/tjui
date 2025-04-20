import React, { useState } from "react";
import { Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

function AnalysisTable({ data }) {
    const navigate = useNavigate();
    const page = 0;
    const [rowsPerPage] = useState(10);

    const handleRowClick = (id) => {
        navigate(`/marketanalysis/${id}`);
    };

    if (!data || data.length === 0) {
        return (
            <Typography variant="body1" color="textSecondary" align="center">
                No data available
            </Typography>
        );
    }

    return (
        <div>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Title</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    {data
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((row) => (
                            <tr key={row.id} onClick={() => handleRowClick(row.id)}>
                                <td>{row.id}</td>
                                <td>{row.title}</td>
                                <td>{row.date}</td>
                            </tr>
                        ))}
                </tbody>
            </table>
        </div>
    );
}

export default AnalysisTable;