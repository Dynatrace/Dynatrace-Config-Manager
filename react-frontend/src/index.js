import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <App />
);

/* Removed because it duplicates every hook call in development, which makes it harder to confirm hooks are only called once
  <React.StrictMode>
  </React.StrictMode>
*/

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(consol e.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
