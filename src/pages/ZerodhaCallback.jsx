import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ZerodhaCallback = () => {
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const request_token = params.get('request_token');

        if (request_token) {
            // The backend will handle the response and close the window
            // We just need to show a loading message
            return;
        }

        // If we get here, something went wrong
        window.opener.postMessage({
            type: 'ZERODHA_AUTH_ERROR',
            error: 'No request token found'
        }, '*');
        window.close();
    }, [location]);

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            flexDirection: 'column'
        }}>
            <h2>Processing Zerodha Login...</h2>
            <p>Please wait while we complete the authentication process.</p>
        </div>
    );
};

export default ZerodhaCallback; 