import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';
import './styles/globals.scss';
import { Provider } from '@/components/ui/provider';
import { EventRealtimeSyncProvider } from '@/contexts/EventRealtimeSyncContext';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <EventRealtimeSyncProvider>
          <App />
        </EventRealtimeSyncProvider>
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>
);
