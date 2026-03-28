require('dotenv').config();
const express = require('express');
const { parseQuery } = require('./nlpParser');
const { generateSQL } = require('./queryGenerator');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() });
});

// Main endpoint to generate SQL queries
app.post('/generate-query', (req, res) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        error: 'Invalid input. Please provide a valid query string.'
      });
    }

    // Parse the English query
    const parsedQuery = parseQuery(query);

    // Generate SQL
    const sqlQuery = generateSQL(parsedQuery);

    res.json({
      success: true,
      englishQuery: query,
      sqlQuery: sqlQuery,
      components: parsedQuery
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while processing your query'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 SQL Query Generator server running on http://localhost:${PORT}`);
  console.log(`📝 POST /generate-query - Generate SQL from English`);
  console.log(`💚 GET /health - Check server status`);
});