import React from 'react';
import { Button } from '@chakra-ui/react';

interface ErrorMessageProps {
  error: string | null;
  onDismiss: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ error, onDismiss }) => {
  if (!error) return null;

  return (
    <div className="error-container">
      <p className="error-message">{error}</p>
      <Button onClick={onDismiss} variant="surface">
        Dismiss
      </Button>
    </div>
  );
};

export default ErrorMessage;
