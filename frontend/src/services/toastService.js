import { toast } from 'react-toastify';

const defaultOptions = {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
};

export const showSuccess = (message) => {
    toast.success(message, defaultOptions);
};

export const showError = (message) => {
    toast.error(message, defaultOptions);
};

export const showInfo = (message) => {
    toast.info(message, defaultOptions);
};

export const showWarning = (message) => {
    toast.warning(message, defaultOptions);
};

export const showLoading = (message = 'Loading...') => {
    return toast.loading(message, {
        ...defaultOptions,
        autoClose: false,
    });
};

export const updateToast = (toastId, type, message) => {
    toast.update(toastId, {
        render: message,
        type: type,
        isLoading: false,
        autoClose: 3000,
    });
};

export const dismissToast = (toastId) => {
    toast.dismiss(toastId);
};
