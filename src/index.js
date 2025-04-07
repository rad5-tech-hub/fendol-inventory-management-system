import React from 'react';
import ReactDOM from 'react-dom/client';
import RouterSwitch from './components/router';
import * as serviceWorkerRegistration from './serviceWorkerRegistration'; // Use CRA service worker



const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(   
    <RouterSwitch/>    
);

serviceWorkerRegistration.register(); // Call the function to enable PWA
