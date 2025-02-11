import { useState } from "react";
import { addmarketanalysis } from "../services/api";

const MarketAnalysis = ({ refreshanalysis }) => {
    const [showModal, setShowModal] = useState(false);
    const [analysis, setanalysis] = useState({ date: "", premarket_analysis: "", postmarket_analysis: "", event_day: "", event_description: "", premarket_expectation: "" });

    const handleChange = (e) => {
        setanalysis({ ...analysis, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await addmarketanalysis(analysis);
        setanalysis({ date: "", premarket_analysis: "", postmarket_analysis: "", event_day: "", event_description: "", premarket_expectation: "", market_movement: "" });
        refreshanalysis();
        setShowModal(false);
    };

    return (
        <div>
            {/* 🔥 "Add Trade" Button */}
            <button onClick={() => setShowModal(true)} style={{ fontSize: "24px", cursor: "pointer" }}>
                Add New Analysis➕
            </button>

            {/* 🔥 Modal (Popup) */}
            {showModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h2>Enter New Market Analysis</h2>
                        <form onSubmit={handleSubmit}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Analysis Date</label>
                                <input type="date" name="date" value={analysis.date} onChange={handleChange} required style={styles.input} />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label} >Do we Have any Event Today</label>
                                <select name="event_day" value={analysis.event_day} onChange={handleChange} required style={styles.input}>
                                    <option value="">Select</option>
                                    <option value="1">Yes</option>
                                    <option value="0">No</option>
                                </select>
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Event Description</label>
                                <textarea type="textarea" name="event_description" placeholder="Event Description" value={analysis.event_description} onChange={handleChange} style={styles.textarea} />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Pre-Market Analysis</label>
                                <textarea type="textarea" name="premarket_analysis" placeholder="Pre Market Analysis" value={analysis.premarket_analysis} onChange={handleChange} style={styles.textarea} />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Pre-Market Expectations</label>
                                <textarea type="textarea" name="premarket_expectation" placeholder="Pre Market Expectation" value={analysis.premarket_expectation} onChange={handleChange} style={styles.textarea} />
                            </div>


                            <div style={styles.formGroup}>
                                <label style={styles.label}>Post-Market Analysis</label>
                                <textarea type="textarea" name="postmarket_analysis" placeholder="Post Market Analysis" value={analysis.postmarket_analysis} onChange={handleChange} style={styles.textarea} />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Market Movement</label>
                                <input type="text" name="market_movement" placeholder="Market Movement" value={analysis.market_movement} onChange={handleChange} style={styles.input} />
                            </div>
                            <div style={styles.buttonContainer}>
                                <button type="submit">Save Analysis</button>
                                <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
// 🔥 Styles for the popup modal
const styles = {
    addButton: {
        fontSize: "16px",
        padding: "10px 20px",
        cursor: "pointer",
        backgroundColor: "#007bff",
        color: "white",
        border: "none",
        borderRadius: "5px",
    },
    modalOverlay: {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflow: "auto",
    },
    modalContent: {
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "8px",
        width: "1500px",
        maxWidth: "90%",
        textAlign: "left",
        boxShadow: "0px 0px 10px rgba(0,0,0,0.3)",
        maxHeight: "80vh", // ⬅️ Limits height to 80% of viewport height
        overflowY: "auto", // ⬅️ Enables vertical scrolling if needed
    },
    form: {
        display: "flex",
        flexDirection: "column",
    },
    formGroup: {
        display: "flex",
        alignItems: "center", // Align items in the center vertically
        justifyContent: "flex-start", // Align items to the left
        width: "100%",
        marginBottom: "15px",
    },
    label: {
        fontWeight: "bold",
        marginRight: "10px",
        minWidth: "100px", // Ensures labels align properly
        textAlign: "left",
    },
    input: {
        flex: "1",
        padding: "8px",
        borderRadius: "5px",
        border: "1px solid #ccc",
    },
    buttonContainer: {
        display: "flex",
        justifyContent: "space-between",
        marginTop: "10px",
    },
    saveButton: {
        backgroundColor: "#28a745",
        color: "white",
        border: "none",
        padding: "10px",
        borderRadius: "5px",
        cursor: "pointer",
    },
    cancelButton: {
        backgroundColor: "#dc3545",
        color: "white",
        border: "none",
        padding: "10px",
        borderRadius: "5px",
        cursor: "pointer",
    },
    textarea: {
        flex: "1",
        padding: "8px",
        borderRadius: "5px",
        border: "1px solid #ccc",
        minHeight: "80px", // Ensures multi-line input space
        resize: "vertical", // Allows user to resize vertically if needed
    }
};


export default MarketAnalysis;