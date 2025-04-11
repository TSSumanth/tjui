import axios from "axios";
import { API_URLS } from '../config/api';

export const getmarketanalysis = async () => {
    const response = await axios.get(API_URLS.MARKET_ANALYSIS);
    return response.data;
};

export const getmarketanalysisbyid = async (id) => {
    const response = await axios.get(API_URLS.MARKET_ANALYSIS + "/" + id);
    return response.data[0];
};

export const addmarketanalysis = async (analysis) => {
    const analysisdata = {
        date: analysis.date,
        eventday: analysis.event_day,
        // Include optional fields only if they exist
        ...(analysis.premarketanalysis && { premarketanalysis: analysis.premarketanalysis }),
        ...(analysis.postmarketanalysis && { premarketanalysis: analysis.premarketanalysis }),
        ...(analysis.eventdescription && { eventdescription: analysis.eventdescription }),
        ...(analysis.premarketexpectation && { premarketexpectation: analysis.premarketexpectation }),
        ...(analysis.marketmovement && { marketmovement: analysis.marketmovement })
    };
    const response = await axios.post(API_URLS.MARKET_ANALYSIS, analysisdata);
    return response.data;
};

export const updateMarketAnalysis = async (id, updatedData) => {
    try {
        const response = await fetch(`${API_URLS.MARKET_ANALYSIS}/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData),
        });

        if (!response.ok) {
            throw new Error('Failed to update analysis');
        }
        alert('Analysis updated successfully');
    } catch (error) {
        console.error('Error updating analaysis:', error);
    }
};
