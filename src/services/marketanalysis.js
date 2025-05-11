import axios from "axios";
import { API_URLS } from '../config/api';

export const getAllMarketAnalysis = async ({ page = 1, limit = 10, startDate, endDate, searchText, premarketexpectation, marketmovement } = {}) => {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (searchText) params.append('searchText', searchText);
    if (premarketexpectation) params.append('premarketexpectation', premarketexpectation);
    if (marketmovement) params.append('marketmovement', marketmovement);
    const response = await axios.get(API_URLS.MARKET_ANALYSIS + `?${params.toString()}`);
    return response.data;
};

export const getMarketAnalysisById = async (id) => {
    const response = await axios.get(API_URLS.MARKET_ANALYSIS + "/" + id);
    return response.data;
};

export const createMarketAnalysis = async (analysis) => {
    const analysisdata = {
        date: analysis.date,
        eventday: analysis.eventday,
        premarketanalysis: analysis.premarketanalysis,
        postmarketanalysis: analysis.postmarketanalysis,
        eventdescription: analysis.eventdescription,
        premarketexpectation: analysis.premarketexpectation,
        marketmovement: analysis.marketmovement
    };
    const response = await axios.post(API_URLS.MARKET_ANALYSIS, analysisdata);
    return response.data;
};

export const updateMarketAnalysis = async (id, updatedData) => {
    const response = await axios.patch(`${API_URLS.MARKET_ANALYSIS}/${id}`, updatedData);
    return response.data;
};

export const deleteMarketAnalysis = async (id) => {
    const response = await axios.delete(`${API_URLS.MARKET_ANALYSIS}/${id}`);
    return response.data;
};
