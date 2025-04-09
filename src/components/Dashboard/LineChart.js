import React from "react";
import { Card, CardContent, Typography } from "@mui/material";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// Sample Data
// const data = [
//     { date: "2025-03-20", value: 100 },
//     { date: "2025-03-21", value: 300 },
//     { date: "2025-03-22", value: 250 },
//     { date: "2025-03-23", value: 400 },
//     { date: "2025-03-24", value: 350 },
// ];

const LineChartMUI = ({ data, title }) => {
    const fieldNames = Object.keys(data[0] || {}).filter((key) => key !== "date");

    return (
        <Card sx={{ width: "100%", height: 450, mt: 2, p: 2, boxShadow: 3 }}>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    📈 {title}
                </Typography>
                {data.length === 0 ? "No Data available to show" :
                    <div style={{ width: "100%", height: "350px" }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                {/* Generate Lines Dynamically */}
                                {fieldNames.map((field, index) => (
                                    <Line
                                        key={field}
                                        type="monotone"
                                        dataKey={field}
                                        stroke={["#1976d2", "#d32f2f", "#388e3c", "#ff9800", "#9c27b0"][index % 5]}
                                        strokeWidth={2}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                }
            </CardContent>
        </Card>
    );
};

export default LineChartMUI;