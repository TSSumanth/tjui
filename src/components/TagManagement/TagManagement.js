import { getTags, deleteTag, addTag , updateTag} from "../../services/tagmanagement";
import PagenationTable from './TagManagementTable'
import React, { useState, useEffect } from "react";

const reportColumns = [
    { accessorKey: "id", header: "Tag id" },
    { accessorKey: "name", header: "Tag Name" },
    { accessorKey: "description", header: "Tag Description" }
];


function TagsSection() {
    const [TagData, setTagData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [tagSearch, setTagSearch] = useState(""); // Default: 30 days ago
    const [endDate, setEndDate] = useState(new Date()); // Default: Today


    const fetchReport = async () => {
        setTagData({});
        setLoading(true);
        setError(null);
        try {
            const data = await getTags(tagSearch);
            setTagData(data);
        }
        catch (err) {
            console.error("Error fetching data:", err);
            setError("Failed to load report data.");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { value } = e.target;
        console.log("value is: "+value)
        if (value !== tagSearch) {
            setTagSearch(value);
        }
        else if(value === "")
            setTagSearch("")
        
    };

    // Trigger fetch when component mounts to load the last 30 days of data
    useEffect(() => {
        fetchReport(); // Automatically fetch data when the page loads
    }, []); // Empty dependency array means this runs once when the component mounts

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Tag Management Report</h1>

            {/* Date Filters & Get Report Button */}
            <section id="search-section">

                <legend>SEARCH Tags</legend>

                <div className="input-field first-wrap">
                    <div>
                        <label id="search-section-label">Tag Name: </label>
                        <input name="tagsearch" value={tagSearch} onChange={handleChange} placeholdertext="Enter Tag Name" />
                    </div>
                    <button onClick={fetchReport} id="multi-button" disabled={loading} >
                        <span id="multi-button-contained-primary">
                            {loading ? "Loading..." : "Get Tags"}
                        </span>
                    </button>
                </div>

            </section>
            {/* Error Message */}
            {error && <p className="text-red-500 mb-4">{error}</p>}

            {TagData.length > 0 ? (
                <PagenationTable columns={reportColumns} initialdata={TagData} DeleteRequest={deleteTag} CreateRequest={addTag} UpdateRequest={updateTag}/>
            ) : (
                !loading && (
                    <>
                        <p className="text-gray-500">No data available. Click "Get tags" with new search input to load data.</p>
                        <PagenationTable columns={reportColumns} initialdata={TagData} DeleteRequest={deleteTag} CreateRequest={addTag} UpdateRequest={updateTag}/>
                    </>
                )

            )}
        </div>
    );
}

export default TagsSection;