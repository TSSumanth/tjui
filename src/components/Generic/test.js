import { useState } from "react";

const data = {
    "2025-03-08": {
        title: "Project Kickoff",
        description: "Today marks the beginning of the project...",
        implementation: "The implementation is planned in phases..."
    },
    "2025-03-09": {
        title: "Development Phase 1",
        description: "Started working on the frontend components...",
        implementation: "React components are structured as..."
    }
};

export default function ScheduleViewer() {
    const [selectedDate, setSelectedDate] = useState("2025-03-08");

    return (
        <div className="flex gap-6 p-6">
            {/* Sidebar - Date Selector */}
            <div className="w-1/4">
                {Object.keys(data).map((date) => (
                    <button
                        key={date}
                        className={`block w-full mb-2 px-4 py-2 rounded ${selectedDate === date ? "bg-blue-500 text-white" : "bg-gray-200"
                            }`}
                        onClick={() => setSelectedDate(date)}
                    >
                        {date}
                    </button>
                ))}
            </div>

            {/* Main Content */}
            <div className="w-3/4 bg-white shadow-lg p-6 rounded-lg border">
                <h2 className="text-xl font-bold">{data[selectedDate].title}</h2>
                <p className="mt-2">{data[selectedDate].description}</p>
                <p className="mt-4 text-gray-600">{data[selectedDate].implementation}</p>
            </div>
        </div>
    );
}