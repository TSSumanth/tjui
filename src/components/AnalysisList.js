import { useEffect, useState } from "react";
import { getmarketanalysis, getmarketanalysisbyid, updateMarketAnalysis } from "../services/api";

const AnalysisList = () => {
    const [showModal, setShowModal] = useState(false);
    const [filteredAnalysis, setFilteredAnalysis] = useState([]);
    const [analysis, setAnalysis] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState({
        key: 'asset', // Default sorting by 'asset'
        direction: 'asc',
    });
    const [editanalysis, seteditAnalysis] = useState({ id: "", premarket_analysis: "", premarket_expectation: "", event_day: "", event_description: "", postmarket_analysis: "", market_movement: "" });

    const handleSort = (columnKey) => {
        let direction = 'asc';
        if (sortConfig.key === columnKey && sortConfig.direction === 'asc') {
            direction = 'desc'; // Reverse the direction if same column is clicked
        }
        setSortConfig({ key: columnKey, direction });
    };

    const sortedAnalysis = [...analysis].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
            return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
            return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });

    const getSortIndicator = (columnKey) => {
        if (sortConfig.key === columnKey) {
            return sortConfig.direction === 'asc' ? '↑' : '↓';
        }
        return '';
    };

    useEffect(() => {
        fetchTrades();
    }, []);

    const fetchTrades = async () => {
        const data = await getmarketanalysis();
        setAnalysis(data);
    };

    // Handle editing a trade
    const handleEdit = async (id) => {
        const response = await getmarketanalysisbyid(id);
        // const analaysisdata = await response.json();
        seteditAnalysis(response);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await updateMarketAnalysis(editanalysis.id, editanalysis);
        seteditAnalysis({ asset: "", trade_type: "", entry_price: "", exit_price: "" });
        setShowModal(false);
        const data = await getmarketanalysis();
        setAnalysis(data);
        setFilteredAnalysis(data);
    };

    // Filter trades based on the search query
    const filteredTrades = sortedAnalysis.filter(ana => {
        return (
            (ana.id && ana.id.toString().toLowerCase().includes(searchQuery.toLowerCase())) ||
            (ana.date && ana.date.toString().toLowerCase().includes(searchQuery.toLowerCase())) ||
            (ana.premarket_expectation && ana.premarket_expectation.toString().toLowerCase().includes(searchQuery.toLowerCase())) ||
            (ana.event_description && ana.event_description.toString().toLowerCase().includes(searchQuery.toLowerCase())) ||
            (ana.market_movement && ana.market_movement.toString().toLowerCase().includes(searchQuery.toLowerCase())) ||
            (ana.premarket_analysis && ana.premarket_analysis.toString().toLowerCase().includes(searchQuery.toLowerCase())) ||
            (ana.postmarket_analysis && ana.postmarket_analysis.toString().toLowerCase().includes(searchQuery.toLowerCase()))
        );
    });
    // Clear search query when the "Clear" button is clicked
    const clearSearch = () => {
        setSearchQuery('');
    };
    return (
        <div style={styles.tableContainer}>
            {/* Search Input */}
            <input
                type="text"
                placeholder="Search Analysis..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)} // Update search query on input change
                style={{ marginBottom: '10px', padding: '8px', width: '60%' }}
            />

            <button onClick={clearSearch} style={{ marginBottom: '10px', padding: '8px', cursor: 'pointer' }}>
                Clear Search
            </button>
            <br />
            <br />
            <table style={styles.table}>
                <thead>
                    <tr>
                        <th style={styles.numTh} onClick={() => handleSort('id')}>ID {getSortIndicator('id')}</th>
                        <th style={styles.numTh} onClick={() => handleSort('date')}>Date {getSortIndicator('date')}</th>
                        <th style={styles.th}>PreMarket Analysis</th>
                        <th style={styles.th}>PreMarket Expectation</th>
                        <th style={styles.numTh}>Event Day</th>
                        <th style={styles.th}>Event Description</th>
                        <th style={styles.th}>PostMarket Analysis</th>
                        <th style={styles.th}>PreMarket Movement</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredTrades.length > 0 ? (
                        filteredTrades.map((analysis, index) => (
                            <tr key={index}>
                                <td style={styles.numTd}>  <a href="#" onClick={() => handleEdit(analysis.id)}>{analysis.id}</a></td>
                                <td style={styles.numTd}>{analysis.date}</td>
                                <td style={styles.td}>{analysis.premarket_analysis}</td>
                                <td style={styles.td}>{analysis.premarket_expectation}</td>
                                <td style={styles.numTd}>{analysis.event_day}</td>
                                <td style={styles.td}>{analysis.event_description}</td>
                                <td style={styles.td}>{analysis.postmarket_analysis}</td>
                                <td style={styles.td}>{analysis.market_movement}</td>
                            </tr>
                        )))
                        : (
                            <tr>
                                <td colSpan="5" style={styles.noData}>No trades available</td>
                            </tr>
                        )}
                </tbody>
            </table>
        </div>
    );
};

const styles = {
    tableContainer: {
        width: "100%",
        overflowX: "auto", // Allows horizontal scrolling if needed
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
        tableLayout: "fixed",  // ⬅️ Prevents shrinking
    },
    th: {
        backgroundColor: "#f4f4f4",
        padding: "10px",
        textAlign: "left",
        borderBottom: "2px solid #ddd", // Border for column headers
        borderRight: "1px solid #ddd", // Border between columns
        whiteSpace: "nowrap",
    },
    numTh: {
        backgroundColor: "#f4f4f4",
        padding: "10px",
        textAlign: "left", // Align numbers to the right
        borderBottom: "2px solid #ddd",
        borderRight: "1px solid #ddd",
        whiteSpace: "nowrap",
        width: "100px", // Allow numeric columns to take only the space they need
        minWidth: "100px", // Set a minimum width for numeric columns
    },
    td: {
        padding: "10px",
        borderBottom: "1px solid #ddd",
        borderRight: "1px solid #ddd",
        whiteSpace: "normal", // Prevent text from wrapping
        wordWrap: "break-word", // Break long text within the column
        // overflow: "hidden", // Hide overflow text
        minWidth: "150px", // Ensure minimum width for columns
    },
    numTd: {
        padding: "10px",
        borderBottom: "1px solid #ddd",
        borderRight: "1px solid #ddd",
        textAlign: "left", // Align numbers to the right
        whiteSpace: "normal", // Allow wrapping in cells
        wordBreak: "break-word", // Break long words onto next line
        minWidth: "100px", // Set a minimum width for numeric columns
    },
    noData: {
        textAlign: "center",
        padding: "20px",
        fontWeight: "bold",
        color: "#666",
    },
};


export default AnalysisList;