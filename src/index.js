import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import reportWebVitals from './reportWebVitals';
import { ZerodhaProvider } from './context/ZerodhaContext';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
    <React.StrictMode>
        <ZerodhaProvider>
            <App />
        </ZerodhaProvider>
    </React.StrictMode>
);

reportWebVitals();