import React, { useEffect, useRef } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const HolidayForm = ({ open, onClose, onSubmit, initialData }) => {
    const [formData, setFormData] = React.useState({
        date: new Date(),
        name: '',
        description: ''
    });

    const firstInputRef = useRef(null);

    useEffect(() => {
        if (open && firstInputRef.current) {
            // Small delay to ensure the dialog is fully mounted
            setTimeout(() => {
                firstInputRef.current.focus();
            }, 100);
        }
    }, [open]);

    useEffect(() => {
        if (initialData) {
            setFormData({
                date: new Date(initialData.date),
                name: initialData.name || '',
                description: initialData.description || ''
            });
        } else {
            setFormData({
                date: new Date(),
                name: '',
                description: ''
            });
        }
    }, [initialData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            disableEnforceFocus // Add this to prevent focus trapping
            keepMounted={false} // Add this to properly unmount the dialog
        >
            <form onSubmit={handleSubmit}>
                <DialogTitle>
                    {initialData ? 'Edit Holiday' : 'Add New Holiday'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DatePicker
                                label="Date"
                                value={formData.date}
                                onChange={(newDate) => setFormData(prev => ({ ...prev, date: newDate }))}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        required: true,
                                        inputRef: firstInputRef
                                    }
                                }}
                            />
                        </LocalizationProvider>
                        <TextField
                            label="Name"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            fullWidth
                            required
                        />
                        <TextField
                            label="Description"
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            fullWidth
                            multiline
                            rows={3}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button type="submit" variant="contained" color="primary">
                        {initialData ? 'Update' : 'Add'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default HolidayForm; 