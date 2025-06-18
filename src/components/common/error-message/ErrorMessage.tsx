import React from 'react';

interface ErrorMessageProps {
    error: string | null;
    onDismiss: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ error, onDismiss }) => {
    if (!error) return null;

    return (
        <div className="error-container">
            <p className="error-message">{error}</p>
            <button className="error-dismiss" onClick={onDismiss}>
                Dismiss
            </button>
        </div>
    );
};

export default ErrorMessage;