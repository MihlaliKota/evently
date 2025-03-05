// generate-env.js
const fs = require('fs');

// Generate a JavaScript file with the environment variables
fs.writeFileSync(
  './public/env-config.js',
  `window.ENV_CONFIG = ${JSON.stringify({
    API_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000'
  })};`
);