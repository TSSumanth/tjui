import React from 'react';
import { Container, Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import FNOInstrumentsComponent from '../components/zerodha/FNOInstruments';
import Header from '../components/Header/Header';

const FNOInstrumentsPage = () => {
    const navigate = useNavigate();

    return (
        <div>
            <Header />
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
                    <Button
                        variant="outlined"
                        onClick={() => navigate('/zerodha/accountdetails')}
                    >
                        ← Back to Account
                    </Button>
                </Box>
                <FNOInstrumentsComponent />
            </Container>
        </div>
    );
};

export default FNOInstrumentsPage; 