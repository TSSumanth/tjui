import axios from "axios";

const API_URL = "http://localhost:1000/api/plentry";


export const getReportByDateRange = async (startdate, enddate) => {
    const response = await axios.get(API_URL, {
        params: {
            startdate: startdate,
            enddate: enddate
        }
    });
    return response.data;
};

