import { Alert, Snackbar, type AlertColor } from '@mui/material';

type ToastProps = {
    open: boolean;
    message: string;
    severity?: AlertColor;
    onClose: () => void;
};

const Toast = ({ open, message, severity = 'success', onClose }: ToastProps) => {
    return (
        <Snackbar
            open={open}
            autoHideDuration={3000}
            onClose={(_, reason) => {
                if (reason === 'clickaway') return; // jangan tutup kalau user klik di luar
                onClose();
            }}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
            <Alert onClose={onClose} severity={severity} variant="filled" sx={{ width: '100%' }}>
                {message}
            </Alert>
        </Snackbar>
    );
};

export default Toast;
