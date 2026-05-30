// Application State
let dbSchema = [];
let activeDialect = 'PostgreSQL';
let loadedDatasets = {};

// Preset Schema Templates
const TEMPLATES = {
  ecommerce: [
    {
      name: 'users',
      columns: [
        { name: 'id', type: 'INT' },
        { name: 'name', type: 'VARCHAR' },
        { name: 'email', type: 'VARCHAR' },
        { name: 'created_at', type: 'TIMESTAMP' }
      ]
    },
    {
      name: 'orders',
      columns: [
        { name: 'id', type: 'INT' },
        { name: 'user_id', type: 'INT' },
        { name: 'total_amount', type: 'DECIMAL' },
        { name: 'status', type: 'VARCHAR' },
        { name: 'order_date', type: 'DATE' }
      ]
    },
    {
      name: 'order_items',
      columns: [
        { name: 'id', type: 'INT' },
        { name: 'order_id', type: 'INT' },
        { name: 'product_id', type: 'INT' },
        { name: 'quantity', type: 'INT' },
        { name: 'price', type: 'DECIMAL' }
      ]
    },
    {
      name: 'products',
      columns: [
        { name: 'id', type: 'INT' },
        { name: 'name', type: 'VARCHAR' },
        { name: 'price', type: 'DECIMAL' },
        { name: 'stock', type: 'INT' },
        { name: 'category', type: 'VARCHAR' }
      ]
    }
  ],
  saas: [
    {
      name: 'tenants',
      columns: [
        { name: 'id', type: 'INT' },
        { name: 'name', type: 'VARCHAR' },
        { name: 'tier', type: 'VARCHAR' },
        { name: 'created_at', type: 'TIMESTAMP' }
      ]
    },
    {
      name: 'subscriptions',
      columns: [
        { name: 'id', type: 'INT' },
        { name: 'tenant_id', type: 'INT' },
        { name: 'status', type: 'VARCHAR' },
        { name: 'amount', type: 'DECIMAL' },
        { name: 'renews_at', type: 'DATE' }
      ]
    },
    {
      name: 'usage_logs',
      columns: [
        { name: 'id', type: 'INT' },
        { name: 'tenant_id', type: 'INT' },
        { name: 'event_name', type: 'VARCHAR' },
        { name: 'volume', type: 'INT' },
        { name: 'timestamp', type: 'TIMESTAMP' }
      ]
    }
  ],
  university: [
    {
      name: 'students',
      columns: [
        { name: 'id', type: 'INT' },
        { name: 'name', type: 'VARCHAR' },
        { name: 'email', type: 'VARCHAR' },
        { name: 'major', type: 'VARCHAR' },
        { name: 'enrollment_year', type: 'INT' }
      ]
    },
    {
      name: 'courses',
      columns: [
        { name: 'id', type: 'INT' },
        { name: 'course_code', type: 'VARCHAR' },
        { name: 'title', type: 'VARCHAR' },
        { name: 'credits', type: 'INT' }
      ]
    },
    {
      name: 'enrollments',
      columns: [
        { name: 'id', type: 'INT' },
        { name: 'student_id', type: 'INT' },
        { name: 'course_id', type: 'INT' },
        { name: 'grade', type: 'VARCHAR' },
        { name: 'semester', type: 'VARCHAR' }
      ]
    }
  ],
  blog: [
    {
      name: 'authors',
      columns: [
        { name: 'id', type: 'INT' },
        { name: 'name', type: 'VARCHAR' },
        { name: 'bio', type: 'TEXT' },
        { name: 'joined_date', type: 'DATE' }
      ]
    },
    {
      name: 'posts',
      columns: [
        { name: 'id', type: 'INT' },
        { name: 'author_id', type: 'INT' },
        { name: 'title', type: 'VARCHAR' },
        { name: 'content', type: 'TEXT' },
        { name: 'status', type: 'VARCHAR' },
        { name: 'publish_date', type: 'DATE' }
      ]
    },
    {
      name: 'comments',
      columns: [
        { name: 'id', type: 'INT' },
        { name: 'post_id', type: 'INT' },
        { name: 'author_name', type: 'VARCHAR' },
        { name: 'comment_text', type: 'TEXT' },
        { name: 'created_at', type: 'TIMESTAMP' }
      ]
    }
  ]
};

// Auto loads saved configurations on boot
document.addEventListener('DOMContentLoaded', () => {
  // Load dialect from LocalStorage
  const savedDialect = localStorage.getItem('sql_dialect');
  if (savedDialect) {
    activeDialect = savedDialect;
    document.querySelectorAll('.dialect-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.dialect === activeDialect);
    });
  }

  // Load API Key from LocalStorage
  const savedKey = localStorage.getItem('gemini_api_key');
  if (savedKey) {
    document.getElementById('apiKeyInput').value = savedKey;
    updateKeyBadge(true);
  } else {
    updateKeyBadge(false);
  }

  // Load saved schema or default to ecommerce
  const savedSchema = localStorage.getItem('db_schema');
  if (savedSchema) {
    try {
      dbSchema = JSON.parse(savedSchema);
    } catch (e) {
      dbSchema = [...TEMPLATES.ecommerce];
    }
  } else {
    dbSchema = [...TEMPLATES.ecommerce];
  }
  
  renderSchema();
  setupEventListeners();
});

// Setup DOM Listeners
function setupEventListeners() {
  // Dialect Selector
  document.querySelectorAll('.dialect-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      activeDialect = e.target.dataset.dialect;
      document.querySelectorAll('.dialect-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      localStorage.setItem('sql_dialect', activeDialect);
      showToast(`Switched target dialect to ${activeDialect}`);
    });
  });

  // Schema Template Loader Buttons
  document.querySelectorAll('.btn-template').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const templateName = e.currentTarget.dataset.template;
      if (TEMPLATES[templateName]) {
        dbSchema = JSON.parse(JSON.stringify(TEMPLATES[templateName])); // Deep copy
        saveSchemaToStorage();
        renderSchema();
        showToast(`Loaded ${templateName.toUpperCase()} database template!`);
      }
    });
  });

  // Add Table Button
  document.getElementById('btnAddTable').addEventListener('click', () => {
    const newTableName = prompt('Enter the name for your new table:');
    if (newTableName) {
      const cleanName = newTableName.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (!cleanName) {
        showToast('Invalid table name. Only letters, numbers, and underscores allowed.', 'error');
        return;
      }
      
      if (dbSchema.some(t => t.name === cleanName)) {
        showToast('A table with this name already exists.', 'error');
        return;
      }

      dbSchema.push({
        name: cleanName,
        columns: [{ name: 'id', type: 'INT' }] // Every table starts with id as default
      });
      saveSchemaToStorage();
      renderSchema();
      showToast(`Table "${cleanName}" created!`);
    }
  });

  // API Key Actions
  document.getElementById('btnSaveKey').addEventListener('click', () => {
    const key = document.getElementById('apiKeyInput').value.trim();
    if (key) {
      localStorage.setItem('gemini_api_key', key);
      updateKeyBadge(true);
      showToast('Gemini API Key saved locally!');
    } else {
      localStorage.removeItem('gemini_api_key');
      updateKeyBadge(false);
      showToast('API Key cleared.', 'error');
    }
  });

  // Prompt Ideas Chips
  document.querySelectorAll('.idea-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      document.getElementById('englishPrompt').value = e.target.textContent;
    });
  });

  // Copy SQL Button
  document.getElementById('btnCopySql').addEventListener('click', () => {
    const sqlText = document.getElementById('sqlCode').textContent;
    if (sqlText) {
      navigator.clipboard.writeText(sqlText).then(() => {
        showToast('SQL Query copied to clipboard!');
      }).catch(err => {
        showToast('Failed to copy text.', 'error');
      });
    }
  });

  // Main SQL Query Generation Trigger
  document.getElementById('btnGenerate').addEventListener('click', generateSqlQuery);

  // Custom Dataset File Upload Listener
  document.getElementById('csvFileInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    handleCsvUpload(file);
  });

  // Custom Dataset JSON Paste Listener
  document.getElementById('btnPasteJson').addEventListener('click', handleJsonPaste);
}

// Save Schema state to localStorage
function saveSchemaToStorage() {
  localStorage.setItem('db_schema', JSON.stringify(dbSchema));
}

// Render dynamic Visual Schema Builder Cards
function renderSchema() {
  const container = document.getElementById('tableList');
  container.innerHTML = '';

  if (dbSchema.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); padding: 1.5rem; border: 1px dashed var(--panel-border); border-radius: var(--radius-md);">
        No tables in schema. Click "Add Table" below to start.
      </div>
    `;
    return;
  }

  dbSchema.forEach((table, tableIndex) => {
    const card = document.createElement('div');
    card.className = 'table-card';
    
    // Header
    const cardHeader = document.createElement('div');
    cardHeader.className = 'table-card-header';
    
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'table-name-input';
    nameInput.value = table.name;
    nameInput.addEventListener('change', (e) => {
      const cleanVal = e.target.value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (cleanVal && cleanVal !== table.name) {
        if (dbSchema.some((t, idx) => t.name === cleanVal && idx !== tableIndex)) {
          showToast('Another table already has this name.', 'error');
          e.target.value = table.name;
          return;
        }
        table.name = cleanVal;
        saveSchemaToStorage();
        showToast(`Table renamed to ${cleanVal}`);
      } else {
        e.target.value = table.name;
      }
    });

    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn-remove-table';
    removeBtn.title = 'Delete Table';
    removeBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6"/>
      </svg>
    `;
    removeBtn.addEventListener('click', () => {
      if (confirm(`Are you sure you want to delete table "${table.name}"?`)) {
        dbSchema.splice(tableIndex, 1);
        saveSchemaToStorage();
        renderSchema();
        showToast(`Table "${table.name}" deleted.`);
      }
    });

    cardHeader.appendChild(nameInput);
    cardHeader.appendChild(removeBtn);
    card.appendChild(cardHeader);

    // Columns Badge Container
    const badgeContainer = document.createElement('div');
    badgeContainer.className = 'columns-badge-container';

    table.columns.forEach((col, colIndex) => {
      const badge = document.createElement('div');
      badge.className = 'col-badge';
      badge.innerHTML = `
        <span>${col.name}</span>
        <span class="col-type">${col.type}</span>
      `;
      
      const removeColBtn = document.createElement('button');
      removeColBtn.className = 'btn-remove-col';
      removeColBtn.innerHTML = '&times;';
      removeColBtn.addEventListener('click', () => {
        table.columns.splice(colIndex, 1);
        saveSchemaToStorage();
        renderSchema();
      });

      badge.appendChild(removeColBtn);
      badgeContainer.appendChild(badge);
    });

    card.appendChild(badgeContainer);

    // Add Column Form
    const addColForm = document.createElement('div');
    addColForm.className = 'add-col-form';
    addColForm.innerHTML = `
      <input type="text" placeholder="Column name" class="add-col-input" id="colName_${tableIndex}">
      <select class="add-col-select" id="colType_${tableIndex}">
        <option value="INT">INT</option>
        <option value="VARCHAR">VARCHAR</option>
        <option value="DECIMAL">DECIMAL</option>
        <option value="DATE">DATE</option>
        <option value="TIMESTAMP">TIMESTAMP</option>
        <option value="TEXT">TEXT</option>
        <option value="BOOLEAN">BOOLEAN</option>
      </select>
      <button class="btn-add-col" title="Add Column" id="btnAddCol_${tableIndex}">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
    `;

    card.appendChild(addColForm);
    container.appendChild(card);

    // Event listener for adding a column in this table card
    document.getElementById(`btnAddCol_${tableIndex}`).addEventListener('click', () => {
      const colInput = document.getElementById(`colName_${tableIndex}`);
      const typeSelect = document.getElementById(`colType_${tableIndex}`);
      
      const colName = colInput.value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
      const colType = typeSelect.value;

      if (!colName) {
        showToast('Please enter a column name.', 'error');
        return;
      }

      if (table.columns.some(c => c.name === colName)) {
        showToast('Column already exists in this table.', 'error');
        return;
      }

      table.columns.push({ name: colName, type: colType });
      saveSchemaToStorage();
      renderSchema();
      showToast(`Column "${colName}" added to "${table.name}".`);
    });
  });
}

// Utility to notify user
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = 'toast';
  
  if (type === 'error') {
    toast.classList.add('error');
  }
  
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

// Utility to handle visual API Key configured check badge
function updateKeyBadge(isConfigured) {
  const badge = document.getElementById('keyBadge');
  if (isConfigured) {
    badge.className = 'key-badge configured';
    badge.innerHTML = '<span class="key-dot"></span>Active';
  } else {
    badge.className = 'key-badge missing';
    badge.innerHTML = '<span class="key-dot"></span>No Key';
  }
}

// SQL Query Syntax Highlighter
function highlightSQL(sql) {
  if (!sql) return '';
  
  // Format SQL keyword lists
  const keywords = [
    'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 
    'ON', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET', 'AS', 'AND', 
    'OR', 'IN', 'IS', 'NULL', 'NOT', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 
    'SET', 'DELETE', 'ASC', 'DESC', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX'
  ];

  let escaped = sql
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Highlight Strings
  escaped = escaped.replace(/('[^']*')/g, '<span class="sql-string">$1</span>');

  // Highlight Numbers
  escaped = escaped.replace(/\b(\d+)\b/g, '<span class="sql-number">$1</span>');

  // Highlight Keywords
  keywords.forEach(keyword => {
    const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');
    escaped = escaped.replace(regex, (match) => `<span class="sql-keyword">${match.toUpperCase()}</span>`);
  });

  // Highlight SQL aggregate functions specifically
  const functions = ['COUNT', 'SUM', 'AVG', 'MIN', 'MAX'];
  functions.forEach(func => {
    const regex = new RegExp(`\\b(${func})\\(`, 'gi');
    escaped = escaped.replace(regex, (match) => `<span class="sql-function">${match.toUpperCase()}(</span>`);
  });

  return escaped;
}

// Dynamic call to the backend generation route
async function generateSqlQuery() {
  const promptText = document.getElementById('englishPrompt').value.trim();
  
  if (!promptText) {
    showToast('Please type in what SQL query you want to generate.', 'error');
    return;
  }

  const btn = document.getElementById('btnGenerate');
  const apiKey = localStorage.getItem('gemini_api_key') || '';

  // Setup loader state
  btn.classList.add('loading');
  btn.disabled = true;

  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify({
        prompt: promptText,
        dialect: activeDialect,
        schema: dbSchema,
        model: document.getElementById('modelSelector').value
      })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Server error occurred while generating query.');
    }

    renderGenerationResult(result.data);
    showToast('SQL Query generated successfully!');

  } catch (error) {
    console.error('Generation failure:', error);
    showToast(error.message, 'error');
  } finally {
    btn.classList.remove('loading');
    btn.disabled = false;
  }
}

// Render query, explanations and simulated mock table data or local execution results
function renderGenerationResult(data) {
  const placeholder = document.getElementById('outputPlaceholder');
  const showcase = document.getElementById('outputShowcase');
  
  // Hide placeholder, display main showcase
  placeholder.style.display = 'none';
  showcase.style.display = 'flex';

  // 1. Render SQL Code Block
  const sqlContainer = document.getElementById('sqlCode');
  sqlContainer.innerHTML = highlightSQL(data.sql);

  // 2. Render Tables Used Badges
  const tablesContainer = document.getElementById('tablesUsedBadges');
  tablesContainer.innerHTML = '';
  
  if (data.tablesUsed && data.tablesUsed.length > 0) {
    data.tablesUsed.forEach(tbl => {
      const badge = document.createElement('span');
      badge.className = 'table-used-badge';
      badge.textContent = tbl;
      tablesContainer.appendChild(badge);
    });
  } else {
    tablesContainer.innerHTML = '<span style="color: var(--text-muted); font-size: 0.8rem;">None detected</span>';
  }

  // 3. Render Technical Explanations
  const explanationContainer = document.getElementById('explanationList');
  explanationContainer.innerHTML = '';
  
  if (data.explanation && data.explanation.length > 0) {
    data.explanation.forEach(point => {
      const li = document.createElement('li');
      li.textContent = point;
      explanationContainer.appendChild(li);
    });
  } else {
    explanationContainer.innerHTML = '<li>Generates a clean structure based on inputs.</li>';
  }

  // Local In-Memory SQL Database execution (using AlaSQL)
  const datasetNames = Object.keys(loadedDatasets);
  let finalRows = data.mockData || [];
  let isLocalMode = false;
  let localExecutionSuccess = false;

  if (datasetNames.length > 0) {
    isLocalMode = true;
    try {
      // 1. Clear older table contexts
      alasql.tables = {};
      
      // 2. Register loaded custom dataset arrays as tables in AlaSQL scope
      datasetNames.forEach(tableName => {
        alasql.exec(`CREATE TABLE ${tableName}`);
        alasql.tables[tableName] = { data: loadedDatasets[tableName] };
      });
      
      // 3. Execute generated SQL locally
      const localResult = alasql(data.sql);
      if (localResult && Array.isArray(localResult)) {
        finalRows = localResult;
        localExecutionSuccess = true;
      }
    } catch (err) {
      console.warn("Local SQL execution failed, falling back to mock preview:", err);
    }
  }

  // 4. Update Execution Status Indicator Badge
  const statusBadge = document.getElementById('executionStatusBadge');
  if (isLocalMode && localExecutionSuccess) {
    statusBadge.style.color = 'var(--success)';
    statusBadge.innerHTML = `
      <span class="key-dot" style="background-color: var(--success); box-shadow: 0 0 8px var(--success);"></span>
      Real local SQL results (${finalRows.length} rows)
    `;
  } else if (isLocalMode && !localExecutionSuccess) {
    statusBadge.style.color = 'var(--warning)';
    statusBadge.innerHTML = `
      <span class="key-dot" style="background-color: var(--warning); box-shadow: 0 0 8px var(--warning);"></span>
      SQL Syntax Error - showing Mock Data
    `;
  } else {
    statusBadge.style.color = 'var(--accent)';
    statusBadge.innerHTML = `
      <span class="key-dot" style="background-color: var(--accent); box-shadow: 0 0 8px var(--accent);"></span>
      Simulated Mock Data Preview
    `;
  }

  // 5. Render dynamic columns and table preview rows
  const tableHeaders = document.getElementById('tableHeaders');
  const tableBody = document.getElementById('tableBody');
  tableHeaders.innerHTML = '';
  tableBody.innerHTML = '';

  if (finalRows && finalRows.length > 0) {
    // Collect unique columns
    const columns = Object.keys(finalRows[0]);

    // Build Headers
    columns.forEach(col => {
      const th = document.createElement('th');
      th.textContent = col;
      tableHeaders.appendChild(th);
    });

    // Build Rows
    finalRows.forEach(row => {
      const tr = document.createElement('tr');
      columns.forEach(col => {
        const td = document.createElement('td');
        
        // Print values nicely
        const val = row[col];
        if (val === null || val === undefined) {
          td.innerHTML = '<span style="color: var(--text-muted); font-style: italic;">null</span>';
        } else {
          td.textContent = typeof val === 'object' ? JSON.stringify(val) : val;
        }
        tr.appendChild(td);
      });
      tableBody.appendChild(tr);
    });
  } else {
    tableHeaders.innerHTML = '<th>No data found</th>';
    tableBody.innerHTML = `
      <tr>
        <td style="color: var(--text-muted); text-align: center; font-style: italic; padding: 2rem;">
          ${isLocalMode && localExecutionSuccess ? "The query executed successfully but returned 0 rows matching criteria." : "No records generated."}
        </td>
      </tr>
    `;
  }
}

// =============================================================
// CUSTOM DATASET MANAGEMENT & PARSING LOGIC
// =============================================================

// Handle CSV File Upload via PapaParse
function handleCsvUpload(file) {
  if (!file) return;
  
  const rawName = file.name.toLowerCase().replace(/\.csv$/, '');
  const tableName = rawName.replace(/[^a-z0-9_]/g, '');

  if (!tableName) {
    showToast('Invalid file name. Please rename the file using letters and numbers.', 'error');
    return;
  }

  showToast(`Parsing CSV file "${file.name}"...`);

  Papa.parse(file, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    complete: function(results) {
      if (results.data && results.data.length > 0) {
        loadDatasetIntoApp(tableName, results.data);
      } else {
        showToast('The CSV file appears to be empty.', 'error');
      }
    },
    error: function(err) {
      console.error(err);
      showToast('Error parsing CSV file: ' + err.message, 'error');
    }
  });
}

// Handle Pasting Custom JSON Array
function handleJsonPaste() {
  const rawJson = prompt('Paste your raw JSON array of objects here:');
  if (!rawJson) return;

  try {
    const parsed = JSON.parse(rawJson);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      showToast('JSON input must be a non-empty array of objects.', 'error');
      return;
    }

    const tableNameInput = prompt('Enter a table name for this JSON dataset:');
    if (!tableNameInput) return;

    const tableName = tableNameInput.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!tableName) {
      showToast('Invalid table name.', 'error');
      return;
    }

    loadDatasetIntoApp(tableName, parsed);
  } catch (e) {
    console.error(e);
    showToast('Invalid JSON format. Please verify it is a valid JSON array of objects.', 'error');
  }
}

// Load Dataset parsed array into memory and infer database schema automatically
function loadDatasetIntoApp(tableName, rows) {
  // 1. Store dataset rows in memory
  loadedDatasets[tableName] = rows;

  // 2. Auto-infer column schemas and datatypes from first row
  const firstRow = rows[0];
  const columns = Object.keys(firstRow).map(key => {
    const val = firstRow[key];
    let inferredType = 'VARCHAR';

    if (typeof val === 'number') {
      inferredType = Number.isInteger(val) ? 'INT' : 'DECIMAL';
    } else if (typeof val === 'boolean') {
      inferredType = 'BOOLEAN';
    } else if (val instanceof Date) {
      inferredType = 'TIMESTAMP';
    }

    return {
      name: key.toLowerCase().replace(/[^a-z0-9_]/g, ''),
      type: inferredType
    };
  });

  // 3. Remove existing table in schema if name overlaps
  dbSchema = dbSchema.filter(t => t.name !== tableName);

  // 4. Register newly inferred table in the main schema designer
  dbSchema.push({
    name: tableName,
    columns: columns
  });

  // 5. Save, render and notify!
  saveSchemaToStorage();
  renderSchema();
  renderLoadedDatasetsList();
}

// Render dynamic loaded datasets list cards with row counts in sidebar
function renderLoadedDatasetsList() {
  const container = document.getElementById('loadedDatasetsList');
  container.innerHTML = '';

  const tableNames = Object.keys(loadedDatasets);
  if (tableNames.length === 0) {
    container.innerHTML = `<span style="font-size: 0.8rem; color: var(--text-muted); font-style: italic; padding: 0.25rem 0.5rem;">No custom datasets active</span>`;
    return;
  }

  tableNames.forEach(tableName => {
    const card = document.createElement('div');
    card.className = 'dataset-item-card';

    card.innerHTML = `
      <span class="dataset-name-label">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--accent);">
          <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
          <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"></path>
        </svg>
        ${tableName}
        <span class="dataset-count-pill">${loadedDatasets[tableName].length} rows</span>
      </span>
    `;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn-remove-dataset';
    removeBtn.title = 'Remove dataset';
    removeBtn.innerHTML = '&times;';
    removeBtn.addEventListener('click', () => {
      delete loadedDatasets[tableName];
      
      // Remove matching visual table from schema builder as well
      dbSchema = dbSchema.filter(t => t.name !== tableName);
      saveSchemaToStorage();
      renderSchema();
      
      renderLoadedDatasetsList();
      showToast(`Removed dataset "${tableName}"`);
    });

    card.appendChild(removeBtn);
    container.appendChild(card);
  });
}
