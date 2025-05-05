return (
    <Container maxWidth="xl">
        <Box sx={{ my: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Orders
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
                View and manage your orders here.
            </Typography>
            <OrdersTable />
        </Box>
    </Container>
); 