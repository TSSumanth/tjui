import axios from "axios";
import { API_URLS } from '../config/api';

export const getReportByDateRange = async (startdate, enddate) => {
    const response = await axios.get(API_URLS.PL_ENTRY, {
        params: {
            startdate: startdate,
            enddate: enddate
        }
    });
    if (!(response.status === 200)) {
        throw new Error("Failed to Get records for selected date range");
    }
    return response.data;
};

export const deleteEntry = async (date) => {
    const response = await axios.delete(API_URLS.PL_ENTRY, {
        params: {
            date: date
        }
    });
    console.log(response.status)
    if (!(response.status === 204)) {
        throw new Error("Failed to delete record");
    }
    return true;
};

export const updateEntry = async (entryobject) => {
    console.log(entryobject)
    const response = await axios.patch(API_URLS.PL_ENTRY, entryobject, {
        params: {
            date: entryobject.date
        }
    });
    console.log(response.status)
    if (!(response.status === 200)) {
        throw new Error("Failed to update record");
    }
    return true;
};

export const addEntry = async (entryobject) => {
    console.log(entryobject)
    const response = await axios.post(API_URLS.PL_ENTRY, entryobject, {});
    console.log(response.status)
    if (!(response.status === 201)) {
        throw new Error("Failed to Create record");
    }
    return true;
};