// index.js — entry point of the React app
// This file mounts your App.js into the HTML page

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';   // imports your App.js

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

