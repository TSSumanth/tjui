import React, { useEffect, useState } from 'react';
import zerodhaService from '../../services/zerodhaService';

const MutualFunds = () => {
    const [mutualFunds, setMutualFunds] = useState([]);
    const [recordDate, setRecordDate] = useState('');

    const processFundData = (funds) => {
        console.log('Raw funds data:', funds); // Debug log
        const processed = funds.map(fund => {
            const processedFund = {
                ...fund,
                units: Number(fund.units),
                average_cost: Number(fund.average_cost),
                current_nav: Number(fund.current_nav),
                pnl: Number(fund.pnl),
                pnl_percentage: Number(fund.pnl_percentage)
            };
            console.log('Processed fund:', processedFund); // Debug log
            return processedFund;
        });
        console.log('All processed funds:', processed); // Debug log
        return processed;
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await zerodhaService.getMutualFunds();
                if (response.success) {
                    const processedData = processFundData(response.data);
                    console.log('Setting state with:', processedData); // Debug log
                    setMutualFunds(processedData);
                    setRecordDate(response.record_date);
                }
            } catch (error) {
                console.error('Error fetching mutual funds:', error);
            }
        };
        fetchData();
    }, []);

    // Add a debug render to see the data
    console.log('Current mutualFunds state:', mutualFunds);

    return (
        <div>
            <h2>Mutual Funds</h2>
            <div>
                {mutualFunds.map((fund, index) => (
                    <div key={index}>
                        <p>Scheme: {fund.scheme_name}</p>
                        <p>Units: {typeof fund.units === 'number' ? fund.units.toFixed(4) : 'Invalid'}</p>
                        <p>Average Cost: {typeof fund.average_cost === 'number' ? fund.average_cost.toFixed(6) : 'Invalid'}</p>
                        <p>Current NAV: {typeof fund.current_nav === 'number' ? fund.current_nav.toFixed(6) : 'Invalid'}</p>
                        <p>P&L: {typeof fund.pnl === 'number' ? fund.pnl.toFixed(2) : 'Invalid'}</p>
                        <p>P&L %: {typeof fund.pnl_percentage === 'number' ? fund.pnl_percentage.toFixed(2) : 'Invalid'}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MutualFunds; 