import React from 'react';
import { Box, Container, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import { useZerodha } from '../context/ZerodhaContext';
import Header from '../components/Header/Header';

const ZerodhaAccount = () => {
    const { isAuth } = useZerodha();

    if (!isAuth) {
        return (
            <Box>
                <Header />
                <Container>
                    <Typography variant="h6" sx={{ mt: 4 }}>
                        Please authenticate with Zerodha to view your account details.
                    </Typography>
                </Container>
            </Box>
        );
    }

    return (
        <Box>
            <Header />
            <Container>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                    <Typography variant="h4">Zerodha Account</Typography>
                    <Button
                        component={Link}
                        to="/portfolio"
                        variant="contained"
                        color="primary"
                    >
                        View Portfolio
                    </Button>
                </Box>
            </Container>
        </Box>
    );
};

export default ZerodhaAccount; 