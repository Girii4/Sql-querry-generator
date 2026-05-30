# ⚡ SQLQuery.AI - AI SQL Query Generator & Local Execution Engine
An advanced, premium, schema-aware AI SQL Query Generator built with **Node.js, Express, Vanilla JS**, and the official **Google Gemini SDK**. It features a modern **glassmorphic dark-theme UI**, an **in-memory local SQL database engine (AlaSQL)**, and a **dynamic CSV/JSON dataset uploader with automatic schema inference**.
Translate your plain English questions into highly optimized, dialect-specific SQL queries, and **execute them immediately on your actual CSV datasets** directly in your browser!
---
## 🚀 Key Features
*   🧠 **Schema-Aware AI Generation**: Leverages advanced Gemini models (`gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-1.5-pro`) to write syntactically correct, optimized queries that strictly align with your tables and columns.
*   💾 **Local SQL Database Engine (AlaSQL)**: Runs a complete, in-memory SQL compiler in your browser to execute the generated query locally on your real dataset!
*   📂 **CSV & JSON Uploader**: Drag & drop or click to upload CSV files or paste JSON arrays.
*   ⚡ **Auto-Schema Inference**: Automatically detects columns and maps data types (`INT`, `DECIMAL`, `VARCHAR`, `BOOLEAN`, `TIMESTAMP`) from your loaded files, instantly auto-populating the **Schema Designer** sidebar.
*   🎨 **Premium Glassmorphic UI**: Futured-styled dark theme loaded with dynamic micro-interactions, responsive sidebars, custom-designed input prompts, and glowing indicator badges.
*   📝 **Dynamic SQL Viewer**: Code containers featuring custom syntax styling, tables utilized list badges, and one-click copy actions.
*   🏁 **Technical Breakdown Accordion**: Returns a structured, step-by-step plain English explanation of how the query works (JOINs, WHERE filters, GROUP BY grouping, HAVING limits).
*   📊 **Real Results Simulator Table**: Compiles and renders your actual data query outputs dynamically in a tabular preview with loading indicators, empty states, and row counts.
*   🌐 **Multi-Dialect Support**: Select and target five leading database flavors: **PostgreSQL**, **MySQL**, **SQLite**, **MS SQL Server**, and **Oracle**.
---
## 🛠️ Tech Stack
*   **Frontend**: Vanilla HTML5, Custom HSL Variables (CSS3), Vanilla ES6 JavaScript
*   **Backend**: Node.js, Express.js
*   **AI Integration**: Official `@google/generative-ai` SDK
*   **Parsing & In-Memory SQL**: PapaParse (CSV Parser), AlaSQL (In-Memory database)



1. Clone the Repository
```bash
git clone https://github.com/Girii4/Sql-querry-generator.git
cd Sql-querry-generator

2. Install Dependencies
'''bash
npm install


3. Setup Your API Credentials
Create a .env file in the root directory (you can rename the provided .env.example file):
'''bash
cp .env.example .env




4. Start the Application
Run the startup script:
'''bash
npm start
