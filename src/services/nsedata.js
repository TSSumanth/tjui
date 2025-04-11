import axios from "axios";
import { API_URLS } from '../config/api';

export const getStockLivePrice = async (symbol) => {
    if (!symbol)
        return {};
    try {
        const response = await axios.get(`${API_URLS.LIVE_DATA}/equity-stock`, {
            params: {
                "symbol": symbol
            }
        });
        if (response.status === 200) {
            console.log(response.data)
            return response.data
        }
        return {};
    } catch (e) {
        alert("Unable to get live price for " + symbol)
    }
};

// export const getEquityOptionChain = async (symbol) => {
//     if (!symbol)
//         return {};
//     try {
//         const response = await axios.get(API_URL + "/option-stock", {
//             params: {
//                 "symbol": symbol
//             }
//         });
//         if (response.status === 200) {
//             console.log(response.data)
//             return response.data
//         }
//         return {};
//     } catch (e) {
//         alert("Unable to get live price for " + symbol)
//     }
// };