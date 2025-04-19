import React from "react";
import { AppBar, Toolbar, Button, Box } from "@mui/material";
import { Link } from "react-router-dom";

const Header = () => {
    return (
        <AppBar
            position="static" // Keeps the header fixed at the top
            sx={{ backgroundColor: "#1976d2", top: 0, margin: 0, padding: 0, boxShadow: "none" }}
        >
            <Toolbar sx={{ display: "flex", justifyContent: "space-between", minHeight: "60px", padding: "10px 10px" }}>
                <Box>
                    <Link to="/">
                        <img
                            src="/logo.png"  // Replace with your actual logo path
                            alt="Logo"
                            style={{ height: 50 }}
                        />
                    </Link>
                </Box>

                <Box>
                    <ButtonGroup />
                </Box>
            </Toolbar>
        </AppBar>
    );
};

const ButtonGroup = () => {
    const buttons = [
        { label: "Home", path: "/" },
        { label: "Daily Market Analysis", path: "/marketanalysis" },
        { label: "Trades", path: "/trades" },
        { label: "Profit Loss Report", path: "/profitlossreport" },
        { label: "My Stratagies", path: "/mystrategies" },
        { label: "Dashboard", path: "/dashboard" },
        { label: "Tag Management", path: "/tagmanagement" },
        { label: "Zerodha Account", path: "/zerodha" }
    ];

    return (
        <Box sx={{ display: "flex", gap: 1 }}>
            {buttons.map((btn, index) => (
                <Button
                    key={index}
                    component={Link}
                    to={btn.path}
                    variant="contained"
                    sx={{
                        backgroundColor: "white",
                        color: "#1976d2",
                        minWidth: "100px",
                        padding: "6px 12px",
                        "&:hover": { backgroundColor: "#e3f2fd" }
                    }}
                >
                    {btn.label}
                </Button>
            ))}
        </Box>
    );
};

export default Header;