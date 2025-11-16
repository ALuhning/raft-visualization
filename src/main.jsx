import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// Entry point for the React application. It mounts the App component into
// the root div defined in index.html. React.StrictMode is used to help
// highlight potential problems in an application.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);