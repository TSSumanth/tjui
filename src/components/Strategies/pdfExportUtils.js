import jsPDF from 'jspdf';

/**
 * PDF Export Utilities for Strategy
 * Contains all PDF generation logic separated from the main component
 */

/**
 * Helper function to add text with word wrapping
 */
const addText = (doc, text, x, y, options = {}) => {
    const { fontSize = 12, fontStyle = 'normal', color = '#000000', align = 'left' } = options;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    // Clean the text to remove any encoding issues
    const cleanText = String(text)
        .replace(/[^\u0020-\u007F]/g, '') // Remove non-ASCII characters
        .replace(/¹/g, '') // Remove superscript 1
        .replace(/[^\u0020-\u007E]/g, '') // Keep only printable ASCII characters
        .trim();
    
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', fontStyle);
    doc.setTextColor(color);
    
    const lines = doc.splitTextToSize(cleanText, contentWidth - x);
    doc.text(lines, x, y, { align });
    return y + (lines.length * (fontSize * 0.4)) + 5;
};

/**
 * Helper function to add a section header
 */
const addSectionHeader = (doc, title, y) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    
    y = addText(doc, title, margin, y, { fontSize: 14, fontStyle: 'bold', color: '#1976d2' });
    // Add moderate space between text and divider line
    y += 6;
    doc.setDrawColor(25, 118, 210);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    return y + 12; // Moderate spacing after divider
};

/**
 * Helper function to add a table row
 */
const addTableRow = (doc, label, value, y, options = {}) => {
    const { labelStyle = 'normal', valueStyle = 'bold', labelColor = '#666', valueColor = '#000' } = options;
    const margin = 20;
    
    // Clean both label and value
    const cleanLabel = String(label)
        .replace(/[^\u0020-\u007F]/g, '') // Remove non-ASCII characters
        .replace(/¹/g, '') // Remove superscript 1
        .replace(/[^\u0020-\u007E]/g, '') // Keep only printable ASCII characters
        .trim();
    const cleanValue = String(value)
        .replace(/[^\u0020-\u007F]/g, '') // Remove non-ASCII characters
        .replace(/¹/g, '') // Remove superscript 1
        .replace(/[^\u0020-\u007E]/g, '') // Keep only printable ASCII characters
        .trim();
    
    // Write label and value on the same line for proper alignment
    const labelY = y;
    const valueY = y;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', labelStyle);
    doc.setTextColor(labelColor);
    doc.text(cleanLabel, margin, labelY);
    
    doc.setFont('helvetica', valueStyle);
    doc.setTextColor(valueColor);
    doc.text(cleanValue, margin + 80, valueY);
    
    return y + 12; // Increased spacing between rows
};

/**
 * Add strategy details section to PDF
 */
const addStrategyDetails = (doc, strategy, yPosition) => {
    yPosition = addSectionHeader(doc, 'STRATEGY DETAILS', yPosition);
    yPosition = addTableRow(doc, 'Strategy Name:', strategy?.name || 'N/A', yPosition);
    yPosition = addTableRow(doc, 'Symbol:', strategy?.symbol || 'N/A', yPosition);
    yPosition = addTableRow(doc, 'Expenses:', `Rs. ${strategy?.expenses || 0}`, yPosition);
    yPosition = addTableRow(doc, 'Status:', strategy?.status || 'N/A', yPosition);
    yPosition = addTableRow(doc, 'Symbol LTP:', strategy?.symbol_ltp ? `Rs. ${strategy.symbol_ltp}` : 'Not Available', yPosition);
    return yPosition;
};

/**
 * Add P/L summary section to PDF
 */
const addPLSummary = (doc, plSummary, yPosition) => {
    yPosition = addSectionHeader(doc, 'P/L SUMMARY', yPosition);
    
    // Safe access with fallback values
    const realizedPL = plSummary?.realizedPL ?? 0;
    const unrealizedPL = plSummary?.unrealizedPL ?? 0;
    const expenses = plSummary?.expenses ?? 0;
    
    // Calculate total P/L: realized + unrealized - expenses
    const totalPL = realizedPL + unrealizedPL - expenses;
    
    yPosition = addTableRow(doc, 'Realized P/L:', `Rs. ${realizedPL.toFixed(2)}`, yPosition);
    yPosition = addTableRow(doc, 'Unrealized P/L:', `Rs. ${unrealizedPL.toFixed(2)}`, yPosition);
    yPosition = addTableRow(doc, 'Expenses:', `Rs. ${expenses.toFixed(2)}`, yPosition);
    yPosition = addTableRow(doc, 'Total P/L (with expenses):', `Rs. ${totalPL.toFixed(2)}`, yPosition);
    return yPosition;
};

/**
 * Add trades section to PDF
 */
const addTradesSection = (doc, stockTrades, optionTrades, yPosition) => {
    const margin = 20;
    yPosition = addSectionHeader(doc, 'TRADES', yPosition);
    
    // Ensure arrays are defined and filter out invalid trades
    const safeStockTrades = Array.isArray(stockTrades) ? stockTrades.filter(trade => trade && trade.entrydate) : [];
    const safeOptionTrades = Array.isArray(optionTrades) ? optionTrades.filter(trade => trade && trade.entrydate) : [];
    
    const allTrades = [...safeStockTrades, ...safeOptionTrades];
    const openTrades = allTrades.filter(trade => trade.status === 'OPEN').sort((a, b) => new Date(a.entrydate) - new Date(b.entrydate));
    const closedTrades = allTrades.filter(trade => trade.status === 'CLOSED').sort((a, b) => new Date(a.entrydate) - new Date(b.entrydate));
    
    yPosition = addText(doc, `Total Trades: ${allTrades.length}`, margin, yPosition, { fontSize: 11, fontStyle: 'bold' });
    yPosition += 8;

    // If no trades at all, show message and return
    if (allTrades.length === 0) {
        yPosition = addText(doc, 'No trades available for this strategy', margin + 10, yPosition, { fontSize: 10, fontStyle: 'italic', color: '#666' });
        return yPosition;
    }

    // Open Trades
    yPosition = addText(doc, 'Open Trades:', margin, yPosition, { fontSize: 12, fontStyle: 'bold' });
    yPosition += 8;
    
    if (openTrades.length > 0) {
        openTrades.forEach((trade, index) => {
            if (yPosition > 250) {
                doc.addPage();
                yPosition = 20;
            }
            
            const tradeType = trade.strikeprize ? 'Option' : 'Stock';
            const tradeDetails = `${tradeType} - ${trade.asset || 'Unknown'}${trade.strikeprize ? ` (${trade.strikeprize})` : ''}`;
            const entryDate = trade.entrydate ? new Date(trade.entrydate).toLocaleDateString('en-GB') : 'N/A';
            const quantity = trade.quantity || 'N/A';
            const entryPrice = trade.entryprice || 'N/A';
            const ltp = trade.ltp || 'N/A';
            
            yPosition = addText(doc, `${index + 1}. ${tradeDetails}`, margin + 10, yPosition, { fontSize: 10, fontStyle: 'bold' });
            yPosition = addText(doc, `   Entry Date: ${entryDate}`, margin + 20, yPosition, { fontSize: 9 });
            yPosition = addText(doc, `   Quantity: ${quantity}`, margin + 20, yPosition, { fontSize: 9 });
            yPosition = addText(doc, `   Entry Price: ${entryPrice !== 'N/A' ? 'Rs. ' + entryPrice : entryPrice}`, margin + 20, yPosition, { fontSize: 9 });
            yPosition = addText(doc, `   LTP: ${ltp !== 'N/A' ? 'Rs. ' + ltp : ltp}`, margin + 20, yPosition, { fontSize: 9 });
            yPosition += 6;
        });
    } else {
        yPosition = addText(doc, 'No open trades', margin + 10, yPosition, { fontSize: 10, fontStyle: 'italic', color: '#666' });
    }

    // Closed Trades
    yPosition = addText(doc, 'Closed Trades:', margin, yPosition, { fontSize: 12, fontStyle: 'bold' });
    yPosition += 8;
    
    if (closedTrades.length > 0) {
        closedTrades.forEach((trade, index) => {
            if (yPosition > 250) {
                doc.addPage();
                yPosition = 20;
            }
            
            const tradeType = trade.strikeprize ? 'Option' : 'Stock';
            const tradeDetails = `${tradeType} - ${trade.asset || 'Unknown'}${trade.strikeprize ? ` (${trade.strikeprize})` : ''}`;
            const entryDate = trade.entrydate ? new Date(trade.entrydate).toLocaleDateString('en-GB') : 'N/A';
            const exitDate = trade.exitdate ? new Date(trade.exitdate).toLocaleDateString('en-GB') : 'N/A';
            const quantity = trade.quantity || 'N/A';
            const entryPrice = trade.entryprice || 'N/A';
            // Use exitaverageprice instead of exitprice (matches UpdateStrategy.jsx)
            const exitPrice = trade.exitaverageprice || 'N/A';
            // Use overallreturn instead of pnl (matches UpdateStrategy.jsx)
            const pnl = trade.overallreturn !== undefined && trade.overallreturn !== null ? trade.overallreturn : 'N/A';
            
            yPosition = addText(doc, `${index + 1}. ${tradeDetails}`, margin + 10, yPosition, { fontSize: 10, fontStyle: 'bold' });
            yPosition = addText(doc, `   Entry Date: ${entryDate}`, margin + 20, yPosition, { fontSize: 9 });
            yPosition = addText(doc, `   Exit Date: ${exitDate}`, margin + 20, yPosition, { fontSize: 9 });
            yPosition = addText(doc, `   Quantity: ${quantity}`, margin + 20, yPosition, { fontSize: 9 });
            yPosition = addText(doc, `   Entry Price: ${entryPrice !== 'N/A' ? 'Rs. ' + entryPrice : entryPrice}`, margin + 20, yPosition, { fontSize: 9 });
            yPosition = addText(doc, `   Exit Price: ${exitPrice !== 'N/A' ? 'Rs. ' + exitPrice : exitPrice}`, margin + 20, yPosition, { fontSize: 9 });
            // Format P/L with + sign for positive values and consistent currency format
            const formattedPnl = pnl !== 'N/A' ? 
                'Rs. ' + (parseFloat(pnl) >= 0 ? '+' : '') + pnl : 
                pnl;
            yPosition = addText(doc, `   P/L: ${formattedPnl}`, margin + 20, yPosition, { fontSize: 9 });
            yPosition += 6;
        });
    } else {
        yPosition = addText(doc, 'No closed trades', margin + 10, yPosition, { fontSize: 10, fontStyle: 'italic', color: '#666' });
    }

    return yPosition;
};

/**
 * Add orders section to PDF
 */
const addOrdersSection = (doc, orders, yPosition) => {
    const margin = 20;
    yPosition = addSectionHeader(doc, 'ORDERS', yPosition);
    
    if (orders && orders.length > 0) {
        // Sort by date field (orders table uses 'date' column, not 'created_at')
        const sortedOrders = [...orders].sort((a, b) => {
            const dateA = new Date(a.date || a.created_at || 0);
            const dateB = new Date(b.date || b.created_at || 0);
            return dateA - dateB;
        });
        
        yPosition = addText(doc, `Total Orders: ${orders.length}`, margin, yPosition, { fontSize: 11, fontStyle: 'bold' });
        yPosition += 5;
        
        sortedOrders.forEach((order, index) => {
            if (yPosition > 250) {
                doc.addPage();
                yPosition = 20;
            }
            
            const orderType = order.type === 'OPTION' ? 'Option' : 'Stock';
            const orderDetails = `${orderType} - ${order.asset || 'Unknown'}${order.strikeprize ? ` (${order.strikeprize})` : ''}`;
            
            // Handle date formatting with fallback
            const orderDateField = order.date || order.created_at;
            const orderDate = orderDateField ? new Date(orderDateField).toLocaleDateString('en-GB') : 'N/A';
            
            const quantity = order.quantity || 'N/A';
            const price = order.price || 'N/A';
            
            yPosition = addText(doc, `${index + 1}. ${orderDetails}`, margin + 10, yPosition, { fontSize: 10, fontStyle: 'bold' });
            yPosition = addText(doc, `   Date: ${orderDate}`, margin + 20, yPosition, { fontSize: 9 });
            yPosition = addText(doc, `   Quantity: ${quantity}`, margin + 20, yPosition, { fontSize: 9 });
            yPosition = addText(doc, `   Price: ${price !== 'N/A' ? 'Rs. ' + price : price}`, margin + 20, yPosition, { fontSize: 9 });
            yPosition += 3;
        });
    } else {
        yPosition = addText(doc, 'No orders available', margin, yPosition, { fontSize: 10, fontStyle: 'italic', color: '#666' });
    }

    return yPosition;
};

/**
 * Add notes section to PDF
 */
const addNotesSection = (doc, notes, yPosition) => {
    const margin = 20;
    yPosition = addSectionHeader(doc, 'NOTES', yPosition);
    
    if (notes && notes.length > 0) {
        const sortedNotes = [...notes].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        sortedNotes.forEach((note, index) => {
            if (yPosition > 250) {
                doc.addPage();
                yPosition = 20;
            }
            
            // Fix: Use 'content' field instead of 'note' field
            const noteContent = note.content || 'No content';
            // Fix: Proper date formatting
            const noteDate = note.created_at ? new Date(note.created_at).toLocaleDateString('en-GB') : 'N/A';
            
            yPosition = addText(doc, `${index + 1}. ${noteContent}`, margin + 10, yPosition, { fontSize: 10 });
            yPosition = addText(doc, `   Date: ${noteDate}`, margin + 20, yPosition, { fontSize: 9, color: '#666' });
            yPosition += 5;
        });
    } else {
        yPosition = addText(doc, 'No notes available', margin, yPosition, { fontSize: 10, fontStyle: 'italic', color: '#666' });
    }

    return yPosition;
};

/**
 * Add action items section to PDF
 */
const addActionItemsSection = (doc, tradeActionItems, yPosition) => {
    const margin = 20;
    yPosition = addSectionHeader(doc, 'ACTION ITEMS', yPosition);
    
    const allActionItems = Object.values(tradeActionItems).flat();
    if (allActionItems && allActionItems.length > 0) {
        // Sort by ID since there's no reliable date field
        const sortedActionItems = [...allActionItems].sort((a, b) => (a.id || 0) - (b.id || 0));
        sortedActionItems.forEach((item, index) => {
            if (yPosition > 250) {
                doc.addPage();
                yPosition = 20;
            }
            
            const status = item.status || 'TODO';
            const statusColor = status === 'COMPLETED' ? '#4caf50' : '#ff9800';
            const createdBy = item.created_by || 'MANUAL';
            
            yPosition = addText(doc, `${index + 1}. ${item.description}`, margin + 10, yPosition, { fontSize: 10 });
            yPosition = addText(doc, `   Status: ${status}`, margin + 20, yPosition, { fontSize: 9, color: statusColor });
            yPosition = addText(doc, `   Created by: ${createdBy}`, margin + 20, yPosition, { fontSize: 9, color: '#666' });
            if (item.asset) {
                yPosition = addText(doc, `   Asset: ${item.asset}`, margin + 20, yPosition, { fontSize: 9, color: '#666' });
            }
            yPosition += 5;
        });
    } else {
        yPosition = addText(doc, 'No action items available', margin, yPosition, { fontSize: 10, fontStyle: 'italic', color: '#666' });
    }

    return yPosition;
};

/**
 * Main function to generate strategy PDF
 */
export const generateStrategyPDF = (strategy, plSummary, stockTrades, optionTrades, orders, notes, tradeActionItems) => {
    const doc = new jsPDF();
    let yPosition = 20;

    // Check if we need a new page helper
    const checkNewPage = (currentY) => {
        if (currentY > 250) {
            doc.addPage();
            return 20;
        }
        return currentY;
    };

    try {
        // Validate required data
        if (!strategy) {
            throw new Error('Strategy data is required');
        }

        // Ensure arrays are defined
        const safeStockTrades = Array.isArray(stockTrades) ? stockTrades : [];
        const safeOptionTrades = Array.isArray(optionTrades) ? optionTrades : [];
        const safeOrders = Array.isArray(orders) ? orders : [];
        const safeNotes = Array.isArray(notes) ? notes : [];
        const safeTradeActionItems = tradeActionItems || {};
        // 1. Strategy Details
        yPosition = addStrategyDetails(doc, strategy, yPosition);

        // 2. P/L Summary
        yPosition = addPLSummary(doc, plSummary, yPosition);

        // Check if we need a new page
        yPosition = checkNewPage(yPosition);

        // 3. Trades Section
        yPosition = addTradesSection(doc, safeStockTrades, safeOptionTrades, yPosition);

        // Check if we need a new page for orders
        yPosition = checkNewPage(yPosition);

        // 4. Orders Section
        yPosition = addOrdersSection(doc, safeOrders, yPosition);

        // Check if we need a new page for notes
        yPosition = checkNewPage(yPosition);

        // 5. Notes Section
        yPosition = addNotesSection(doc, safeNotes, yPosition);

        // Check if we need a new page for action items
        yPosition = checkNewPage(yPosition);

        // 6. Action Items Section
        addActionItemsSection(doc, safeTradeActionItems, yPosition);

        // Save the PDF
        const fileName = `Strategy_${strategy?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Unknown'}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);

        return { success: true, fileName };

    } catch (error) {
        console.error('Error generating PDF:', error);
        return { success: false, error: error.message };
    }
};

export default {
    generateStrategyPDF,
    addStrategyDetails,
    addPLSummary,
    addTradesSection,
    addOrdersSection,
    addNotesSection,
    addActionItemsSection
};
