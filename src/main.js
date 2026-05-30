require('dotenv').config();
const express = require('express');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../'))); // Serve static files from root

// Root endpoint - serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() });
});

// Main API endpoint to generate SQL queries using Gemini
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, dialect, schema } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid input. Please provide a valid prompt string.'
      });
    }

    // Retrieve API key from environment or client header (fallback for convenience)
    const apiKey = process.env.GEMINI_API_KEY || req.headers['x-api-key'];

    if (!apiKey || apiKey.trim() === '' || apiKey.includes('your_gemini_api_key')) {
      return res.status(401).json({
        success: false,
        error: 'Gemini API Key is missing. Please add it to your .env file or provide it in the API Key settings in the UI.'
      });
    }

    // Initialize the Gemini API client
    const genAI = new GoogleGenerativeAI(apiKey);
    const requestedModel = req.body.model || 'gemini-2.0-flash';
    const model = genAI.getGenerativeModel({
      model: requestedModel,
      generationConfig: {
        responseMimeType: 'application/json',
      }
    });

    const dialectStr = dialect || 'PostgreSQL';
    let schemaStr = 'No specific schema provided. Use best-practice intuitive table/column names.';
    
    if (schema && Array.isArray(schema) && schema.length > 0) {
      schemaStr = JSON.stringify(schema, null, 2);
    }

    const systemPrompt = `You are a professional Senior Database Administrator and SQL Query Generator.
Your task is to take a natural language query, a target SQL dialect, and an optional database schema, and generate a valid SQL query, a step-by-step technical explanation, and high-quality mock data rows that simulate the query results.

You MUST respond strictly in the following JSON format:
{
  "sql": "The formatted and syntactically correct SQL query matching the target dialect",
  "explanation": [
    "A list of bullet points explaining what the query does, components like JOINs, WHERE, GROUP BY, and functions used in plain English"
  ],
  "tablesUsed": ["table1", "table2"],
  "mockData": [
    { "col1": "val1", "col2": "val2" }
  ]
}

Instructions:
1. Generate syntactically correct SQL matching the requested dialect (e.g. PostgreSQL, MySQL, SQLite, MSSQL, Oracle).
2. If a schema is provided, strictly use the tables, columns, and relationships defined in the schema. Do not invent tables or columns that do not exist.
3. If no schema is provided, deduce an appropriate, intuitive table structure based on the query description and list the table structures in the explanation.
4. Ensure column names in "mockData" match the projected columns in the SELECT clause of your SQL query.
5. Provide 3 to 6 high-quality rows of simulated realistic mock data in "mockData". Make sure values represent realistic database data (e.g., actual names, prices, dates, categories).
6. Keep the SQL clean, readable, capitalized keywords (SELECT, FROM, JOIN, WHERE, etc.), and properly indented. Do not wrap the SQL string in markdown formatting inside the JSON response.
`;

    const userPrompt = `
Generate SQL Query:
- Dialect: ${dialectStr}
- Plain English Request: "${prompt}"
- Database Schema:
${schemaStr}
`;

    const result = await model.generateContent([
      { text: systemPrompt },
      { text: userPrompt }
    ]);

    const responseText = result.response.text();
    const cleanJson = JSON.parse(responseText.trim());

    res.json({
      success: true,
      data: cleanJson
    });

  } catch (error) {
    console.error('Gemini Generation Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while generating your query'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 SQL Query Generator server running on http://localhost:${PORT}`);
  console.log(`📝 POST /api/generate - AI Query Generator endpoint`);
  console.log(`💚 GET /health - Check server status`);
});
