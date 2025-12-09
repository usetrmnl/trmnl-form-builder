/**
 * TRMNL YML Form Builder Web Component
 * 
 * A standalone, dependency-free Web Component for building TRMNL custom plugin forms.
 * Requires only Tailwind CSS for styling.
 * 
 * Usage:
 *   <trmnl-form-builder></trmnl-form-builder>
 * 
 * Attributes:
 *   - accent-color: Hex color for accent elements (default: #F8654B)
 *   - theme: 'light' or 'dark' (default: 'light')
 */

class TRMLYamlForm extends HTMLElement {
    constructor() {
	  super();
	  this.attachShadow({ mode: 'open' });

	  // State management
	  this.fields = [];
	  this.selectedFieldId = null;
	  this.draggedFieldId = null;
	  this.draggedFromIndex = null;
	  this.nextFieldId = 1;

	  // Configuration
	  this.accentColor = this.getAttribute('accent-color') || '#F8654B';
	  this.theme = this.getAttribute('theme') || 'light';

	  // Categories cache
	  this.categories = [];
	  this.loadCategories();

	  // supported locales (based on trmnl-i18n)
      this.locales = [
	    { code: 'de', label: 'Deutsch' },
	    { code: 'es-ES', label: 'Español' },
	    { code: 'fr', label: 'Français' },
	    { code: 'it', label: 'Italiano' },
	    { code: 'nl', label: 'Nederlands' },
	    { code: 'pt-BR', label: 'Português' },
	    { code: 'uk', label: 'український' }
	  ];
  
	  // --- Property Definitions (How to render each setting) ---
	  this.propertyDefinitions = {
		// Common
		keyname: { label: 'Keyname', type: 'text', help: 'Lowercase alphanumeric + underscores only' },
		name: { label: 'Name', type: 'text', placeholder: 'About This Plugin' },
		description: { label: 'Description', type: 'textarea', placeholder: 'Main description (HTML-friendly)' },
		help_text: { label: 'Help Text', type: 'textarea', placeholder: 'Sub-label / hint (HTML-friendly)' },
		optional: { label: 'Optional field', type: 'checkbox' },
		
		// Inputs
		default: { label: 'Default Value', type: 'text', placeholder: 'Pre-selected value' },
		placeholder: { label: 'Placeholder', type: 'text', placeholder: 'Example value' },
		min: { label: 'Minimum Value', type: 'number', placeholder: '0' },
		max: { label: 'Maximum Value', type: 'number', placeholder: '100' },
		maxlength: { label: 'Maximum Length', type: 'number', placeholder: '12' },
		rows: { label: 'Rows', type: 'number', placeholder: '10' },
		
		// Selection
		options: { label: 'Options (one per line)', type: 'textarea', placeholder: 'Option 1\nOption 2', help: 'Enter one option per line' },
		multiple: { label: 'Allow multiple selection', type: 'checkbox' },
		endpoint: { label: 'Endpoint *', type: 'text', placeholder: 'https://api.example.com/options' },
		http_verb: { 
		  label: 'HTTP Method', 
		  type: 'select', 
		  default: 'GET', 
		  options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS', 'TRACE', 'CONNECT'],
		  placeholder: 'GET'
		},
		
		// Special
		value: { label: 'Value', type: 'text', placeholder: 'sk_live_abc123xyz' },
		
		// Author Bio Specifics
		categories: { label: 'Categories (Max 2)', type: 'custom_categories' },
		github_url: { label: 'GitHub URL', type: 'url', placeholder: 'https://github.com/username' },
		email_address: { label: 'Email Address', type: 'text', placeholder: 'user@example.com' },
		learn_more_url: { label: 'Learn More URL', type: 'url', placeholder: 'https://thesatanictemple.com/' },
		youtube_url: { label: 'YouTube URL', type: 'url', placeholder: 'https://www.youtube.com/@useTRMNL' },
		
		// The Translation Manager
		i18n_descriptions: { label: 'Description Translations', type: 'i18n_map', help: 'Add translated descriptions for specific locales.' },
		
		// Conditional Logic
		conditional_validation: { label: 'Conditional Logic', type: 'conditional_builder', help: 'Hide other fields based on this field\'s value' }
	  };

	  // --- Field Types (Added 'properties' array to each) ---
	  this.fieldTypes = {
		// Text Input
		author_bio: { 
		  category: 'TEXT INPUT', name: 'Author Bio', description: 'Plugin information', 
		  properties: [{ 
			  key: 'name', 
			  default: 'About This Plugin'
			}, 'categories', 'github_url', 'email_address', 'learn_more_url', 'youtube_url'] // Note: Common props are handled automatically
		},
		url: { 
		  category: 'TEXT INPUT', name: 'Url', description: 'URL input', 
		  properties: ['default', 'placeholder', 'optional'] 
		},
		string: { 
		  category: 'TEXT INPUT', name: 'String', description: 'Single-line text', 
		  properties: ['default', 'placeholder', 'maxlength', 'optional', 'conditional_validation'] 
		},
		multi_string: { 
		  category: 'TEXT INPUT', name: 'Multi String', description: 'Comma-separated', 
		  properties: ['default', 'placeholder', 'optional'] 
		},
		text: { 
		  category: 'TEXT INPUT', name: 'Text', description: 'Multi-line textarea', 
		  properties: ['default', 'placeholder', 'rows', 'optional', 'conditional_validation'] 
		},
		code: { 
		  category: 'TEXT INPUT', name: 'Code', description: 'Monospace code', 
		  properties: ['default', 'placeholder', 'rows', 'optional'] 
		},
		password: { 
		  category: 'TEXT INPUT', name: 'Password', description: 'Masked input', 
		  properties: ['default', 'placeholder', 'optional'] 
		},
		
		// Numeric
		number: { 
		  category: 'NUMERIC', name: 'Number', description: 'Numeric input', 
		  properties: ['default', 'placeholder', 'min', 'max', 'optional', 'conditional_validation'] 
		},
		
		// Date & Time
		date: { 
		  category: 'DATE & TIME', name: 'Date', description: 'Date picker', 
		  // We use an object to override the generic 'default' definition
		  properties: [
			{ 
			  key: 'default', // The property key we are targeting
			  placeholder: 'YYYY-MM-DD', 
			  help: 'Can also be set to "today" to use the current date automatically.' 
			},
			'optional'
		  ] 
		},
		time: { category: 'DATE & TIME', name: 'Time', description: 'Time picker', properties: ['default', 'optional'] },
		timezone: { category: 'DATE & TIME', name: 'Time Zone', description: 'Timezone selector', properties: ['default', 'optional'] },
		
		// Selection
		select: { 
		  category: 'SELECTION', name: 'Select', description: 'Dropdown', 
		  properties: ['options', 'default', 'multiple', 'optional', 'conditional_validation'] 
		},
		xhrSelect: { 
		  category: 'SELECTION', name: 'XhrSelect', description: 'Dynamic dropdown', 
		  properties: ['endpoint', 'http_verb', 'multiple', 'optional'] 
		},
		xhrSelectSearch: { 
		  category: 'SELECTION', name: 'XhrSelectSearch', description: 'Searchable dynamic', 
		  properties: ['endpoint', 'http_verb', 'multiple', 'optional'] 
		},
		
		// Special
		copyable: { category: 'SPECIAL', name: 'Copyable', description: 'Click-to-copy', properties: ['value'] },
		copyable_webhook_url: { category: 'SPECIAL', name: 'Copyable Webhook', description: 'Click-to-copy webhook', properties: ['value'] },
	  };
	}

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  async loadCategories() {
    try {
      const response = await fetch('https://usetrmnl.com/api/categories');
      if (response.ok) {
        const data = await response.json();
        // Handle both array and object with data property
        this.categories = Array.isArray(data) ? data : (data.data || this.getFallbackCategories());
        // Extract just the names if they're objects
        if (this.categories.length > 0 && typeof this.categories[0] === 'object') {
          this.categories = this.categories.map(cat => cat.name || cat.title || cat);
        }
      } else {
        this.categories = this.getFallbackCategories();
      }
    } catch (error) {
      console.warn('Failed to load categories from API, using fallback:', error);
      this.categories = this.getFallbackCategories();
    }
  }

  getFallbackCategories() {
    return [
        "analytics",
		"art",
		"calendar",
		"comics",
		"crm",
		"custom",
		"discovery",
		"ecommerce",
		"education",
		"email",
		"entertainment",
		"environment",
		"finance",
		"games",
		"humor",
		"images",
		"kpi",
		"life",
		"marketing",
		"nature",
		"news",
		"personal",
		"productivity",
		"programming",
		"sales",
		"sports",
		"travel"
    ];
  }

  render() {
    const html = `
      <style>
        * {
          box-sizing: border-box;
        }
        
        :host {
          --accent-color: ${this.accentColor};
          --bg-primary: ${this.theme === 'dark' ? '#1a1a1a' : '#ffffff'};
          --bg-secondary: ${this.theme === 'dark' ? '#2a2a2a' : '#f5f5f5'};
		  --bg-primary-inverted: ${this.theme === 'dark' ? '#ffffff' : '#1a1a1a'};
          --text-primary: ${this.theme === 'dark' ? '#e0e0e0' : '#1a1a1a'};
          --text-secondary: ${this.theme === 'dark' ? '#a0a0a0' : '#666666'};
          --text-primary-inverted: ${this.theme === 'dark' ? '#1a1a1a' : '#e0e0e0'};
          --border-color: ${this.theme === 'dark' ? '#404040' : '#e0e0e0'};
          
          display: block;
          /* font-family: 'IBM Plex Sans', system-ui, -apple-system, sans-serif; */
          background: var(--bg-primary);
          color: var(--text-primary);
          height: 100vh;
          overflow: auto;
        }
        
        .container {
          display: grid;
          grid-template-columns: 280px 1fr 1fr;
          grid-template-rows: auto 1fr;
          height: 100%;
          gap: 0;
        }
        
        .header {
          grid-column: 1 / -1;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
          letter-spacing: -0.5px;
        }
        
        .header p {
          margin: 4px 0 0 0;
          font-size: 13px;
          color: var(--text-secondary);
        }
        
        .field-count {
          font-size: 13px;
          color: var(--text-secondary);
          font-weight: 500;
        }
        
        .sidebar-left {
          border-right: 1px solid var(--border-color);
          overflow-y: auto;
          background: var(--bg-secondary);
        }
        
        .sidebar-right {
          border-left: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          background: var(--bg-secondary);
        }
        
        .canvas {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
          overflow-y: auto;
          background: var(--bg-primary);
        }
        
        .canvas.has-fields {
          align-items: stretch;
          justify-content: flex-start;
        }
        
        .field-types-section {
          padding: 16px;
        }
        
        .field-types-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: var(--text-secondary);
          margin: 16px 0 8px 0;
          padding: 0 8px;
        }
        
        .field-type-button {
          width: 100%;
          padding: 12px;
          margin-bottom: 8px;
          border: 1px dashed var(--accent-color);
          background: var(--bg-primary);
          color: var(--text-primary);
          border-radius: 6px;
          cursor: grab;
          transition: all 0.2s;
          text-align: left;
          font-size: 13px;
          font-weight: 500;
          position: relative;
        }
        
        .field-type-button:hover {
          background: var(--bg-secondary);
          border-style: solid;
        }
        
        .field-type-button:active {
          cursor: grabbing;
        }
		
		.field-type-button[disabled] {
		  opacity: 0.5;
		  cursor: not-allowed;
		  background: var(--bg-secondary);
		  border-color: var(--border-color);
		  pointer-events: none; /* Prevents clicking and dragging */
		}
        
        .field-type-name {
          font-weight: 600;
          margin-bottom: 2px;
        }
        
        .field-type-desc {
          font-size: 12px;
          color: var(--text-secondary);
        }
        
        .field-type-icon {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          width: 20px;
          height: 20px;
          background: var(--accent-color);
          color: white;
          border-radius: 3px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 600;
        }
        
        .empty-state {
          text-align: center;
          color: var(--text-secondary);
        }
        
        .empty-state-icon {
          font-size: 48px;
          margin-bottom: 16px;
          opacity: 0.5;
        }
        
        .empty-state h3 {
          margin: 0 0 8px 0;
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
        }
        
        .empty-state p {
          margin: 0;
          font-size: 13px;
          line-height: 1.5;
          max-width: 300px;
        }
        
        .fields-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
          max-width: 600px;
        }
        
        .field-card {
          padding: 12px;
          border: 2px solid var(--border-color);
          border-radius: 6px;
          background: var(--bg-primary);
          cursor: move;
          transition: all 0.2s;
          display: flex;
          justify-content: space-between;
          align-items: center;
          user-select: none;
        }
        
        .field-card:hover {
          border-color: var(--accent-color);
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .field-card.selected {
          border-color: var(--accent-color);
          background: var(--bg-secondary);
        }
        
        .field-card-info {
          flex: 1;
          min-width: 0;
        }
        
        .field-card-keyname {
          font-size: 12px;
          color: var(--text-secondary);
          margin-bottom: 2px;
		  text-transform: lowercase;
        }
        
        .field-card-type {
          font-size: 11px;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-left: 4px;
        }
        
        .field-card-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
        }
        
        .field-card-actions {
          display: flex;
          gap: 4px;
          margin-left: 8px;
        }
        
        .icon-button {
          width: 28px;
          height: 28px;
          padding: 0;
          border: 1px solid var(--border-color);
          background: var(--bg-secondary);
          color: var(--text-primary);
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          transition: all 0.2s;
        }
        
        .icon-button:hover {
          border-color: var(--accent-color);
          color: var(--accent-color);
        }
        
        .icon-button.delete:hover {
          border-color: #ef4444;
          color: #ef4444;
        }
        
        .tabs {
          display: flex;
          border-bottom: 1px solid var(--border-color);
          padding: 0 16px;
        }
        
        .tab {
          padding: 12px 16px;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
        }
        
        .tab:hover {
          color: var(--text-primary);
        }
        
        .tab.active {
          color: var(--accent-color);
          border-bottom-color: var(--accent-color);
        }
        
        .tab-content {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: none;
        }
        
        .tab-content.active {
          display: block;
        }
        
        .form-group {
          margin-bottom: 16px;
        }
        
        .form-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 6px;
          color: var(--text-primary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .form-input,
        .form-textarea {
          width: 100%;
          padding: 8px;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          background: var(--bg-primary);
          color: var(--text-primary);
          font-size: 13px;
          font-family: inherit;
          transition: border-color 0.2s;
        }
        
        .form-input:focus,
        .form-textarea:focus {
          outline: none;
          border-color: var(--accent-color);
          box-shadow: 0 0 0 2px rgba(248, 101, 75, 0.1);
        }
        
        .form-textarea {
          resize: vertical;
          min-height: 60px;
        }
        
        .form-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }
        
        .form-checkbox input {
          cursor: pointer;
          accent-color: var(--accent-color);
        }
        
        .form-checkbox label {
          cursor: pointer;
          font-size: 13px;
        }
        
        .yaml-output {
          font-family: monospace;
          font-size: 12px;
          line-height: 1.6;
          white-space: pre-wrap;
          word-break: break-word;
          background: var(--bg-primary-inverted);
          padding: 12px;
          border-radius: 4px;
          border: 1px solid var(--border-color);
          color: var(--text-primary-inverted);
          max-height: 400px;
          overflow-y: auto;
        }
        
        .yaml-empty {
          color: var(--text-secondary);
          font-style: italic;
        }
        
        .button-group {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
        }
        
        .button {
          flex: 1;
          padding: 8px 12px;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .button-primary {
          background: var(--accent-color);
          color: white;
        }
        
        .button-primary:hover {
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(248, 101, 75, 0.3);
        }
        
        .button-secondary {
          background: var(--bg-primary);
          color: var(--text-primary);
          border: 1px solid var(--border-color);
        }
        
        .button-secondary:hover {
          border-color: var(--accent-color);
          color: var(--accent-color);
        }
        
        .no-field-selected {
          color: var(--text-secondary);
          /* text-align: center; */
          padding: 40px 20px;
          font-size: 13px;
        }
        
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .drag-over {
          background: var(--bg-secondary);
          border-color: var(--accent-color);
        }
		
		.reset-button {
		  margin-left: auto; /* Pushes button to the far right */
		  background: transparent;
		  border: none;
		  color: var(--accent-color);
		  cursor: pointer;
		  font-size: 11px;
		  font-weight: 600;
		  text-transform: uppercase;
		  letter-spacing: 0.5px;
		  padding: 0 4px;
		  transition: color 0.2s;
		}

		.reset-button:hover {
		  color: var(--text-secondary);
		}
      </style>
      
      <div class="container">
        <div class="header">
          <div>
            <h1>TRMNL YML Form Builder</h1>
            <p>Create custom plugin configuration forms with a no-code interface</p>
          </div>
          <div class="field-count"><span id="fieldCount">0</span> fields defined</div>
        </div>
        
        <div class="sidebar-left">
          <div id="fieldTypesList"></div>
        </div>
        
        <div class="canvas" id="canvas">
          <div class="empty-state">
            <div class="empty-state-icon">+</div>
            <h3>No fields yet</h3>
            <p>Select a field type from the left panel to start building your form.</p>
            <p style="margin-top: 8px; font-size: 12px;">You can drag fields to reorder them, or click to edit properties.</p>
          </div>
        </div>
        
        <div class="sidebar-right">
          <div class="tabs">
            <button class="tab active" data-tab="config">Config</button>
            <button class="tab" data-tab="yaml">YAML</button>
			<button class="reset-button" id="resetBtn" title="Clear all fields">Reset</button>
          </div>
          
          <div id="configTab" class="tab-content active">
            <div id="configContent" class="no-field-selected">
              Select a field to edit its properties
            </div>
          </div>
          
          <div id="yamlTab" class="tab-content">
            <div class="button-group">
              <button class="button button-primary" id="copyBtn">Copy</button>
			  <button class="button button-secondary" id="importBtn">Import</button>
            </div>
            <div id="yamlOutput" class="yaml-output">
              <span class="yaml-empty"># No fields defined yet</span>
            </div>
          </div>
        </div>
      </div>
    `;
    
    this.shadowRoot.innerHTML = html;
    this.renderFieldTypes();
  }

  renderFieldTypes() {
    const container = this.shadowRoot.getElementById('fieldTypesList');
    const grouped = {};
    
    // Group field types by category
    Object.entries(this.fieldTypes).forEach(([key, config]) => {
      if (!grouped[config.category]) {
        grouped[config.category] = [];
      }
      grouped[config.category].push({ key, ...config });
    });
    
    let html = '';
    Object.entries(grouped).forEach(([category, fields]) => {
      html += `<div class="field-types-section">
        <div class="field-types-label">${category}</div>`;
      
      fields.forEach(field => {
        html += `
          <button class="field-type-button" draggable="true" data-field-type="${field.key}">
            <div class="field-type-name">${field.name}</div>
            <div class="field-type-desc">${field.description}</div>
            <div class="field-type-icon">+</div>
          </button>
        `;
      });
      
      html += '</div>';
    });
    
    container.innerHTML = html;
	this.updateAuthorBioState(); // Check immediately on render
  }

  renderCategoryPills(selectedCategories = []) {
    if (!this.categories || this.categories.length === 0) {
      return '<div style="color: var(--text-secondary); font-size: 12px;">Loading categories...</div>';
    }

    let html = '<div style="display: flex; flex-wrap: wrap; gap: 8px;">';
    
    this.categories.forEach(category => {
      const isSelected = selectedCategories.includes(category);
      html += `
        <button class="category-pill" data-category="${category}" style="
          padding: 6px 12px;
          border: 1px solid ${isSelected ? 'var(--accent-color)' : 'var(--border-color)'};
          background: ${isSelected ? 'var(--accent-color)' : 'var(--bg-primary)'};
          color: ${isSelected ? 'white' : 'var(--text-primary)'};
          border-radius: 20px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          transition: all 0.2s;
          white-space: nowrap;
        ">${category}</button>
      `;
    });
    
    html += '</div>';
    return html;
  }

  setupEventListeners() {
    // Field type buttons
    this.shadowRoot.querySelectorAll('.field-type-button').forEach(btn => {
      btn.addEventListener('dragstart', (e) => this.handleFieldTypeDragStart(e));
      btn.addEventListener('click', (e) => this.addField(e.currentTarget.dataset.fieldType));
    });
    
    // Canvas drop zone
    const canvas = this.shadowRoot.getElementById('canvas');
    canvas.addEventListener('dragover', (e) => this.handleCanvasDragOver(e));
    canvas.addEventListener('drop', (e) => this.handleCanvasDrop(e));
    canvas.addEventListener('dragleave', (e) => this.handleCanvasDragLeave(e));
    
    // Tabs
    this.shadowRoot.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', (e) => this.switchTab(e.currentTarget.dataset.tab));
    });
    
    // YAML buttons
    this.shadowRoot.getElementById('copyBtn').addEventListener('click', () => this.copyYaml());
	this.shadowRoot.getElementById('importBtn').addEventListener('click', () => this.importYaml());
	
	// Reset button listener
    const resetBtn = this.shadowRoot.getElementById('resetBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset the form? All fields will be lost.')) {
          this.clear();
        }
      });
    }
  }

  handleFieldTypeDragStart(e) {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('fieldType', e.currentTarget.dataset.fieldType);
  }

  handleCanvasDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    this.shadowRoot.getElementById('canvas').classList.add('drag-over');
  }

  handleCanvasDragLeave(e) {
    if (e.target === this.shadowRoot.getElementById('canvas')) {
      this.shadowRoot.getElementById('canvas').classList.remove('drag-over');
    }
  }

  handleCanvasDrop(e) {
    e.preventDefault();
    this.shadowRoot.getElementById('canvas').classList.remove('drag-over');
    const fieldType = e.dataTransfer.getData('fieldType');
    if (fieldType) {
      this.addField(fieldType);
    }
  }

   addField(fieldType) {
	  if (fieldType === 'author_bio' && this.fields.some(f => f.field_type === 'author_bio')) {
		this.showToast('Only one Author Bio field is allowed');
		return;
	  }
	  
	  const fieldKeyname = fieldType === 'author_bio'
		? fieldType
		: `${fieldType}_${Date.now().toString().slice(-4)}`;

	  const typeConfig = this.fieldTypes[fieldType];
	  
	  // Create new field object with minimal defaults
	  const field = {
		id: `field_${this.nextFieldId++}`,
		keyname: fieldKeyname,
		field_type: fieldType,
	  };
	  
	  // Only set 'name' if there's a default specified in the type config
	  let hasNameDefault = false;
	  if (typeConfig && Array.isArray(typeConfig.properties)) {
		typeConfig.properties.forEach(prop => {
		  if (typeof prop === 'object' && prop.key === 'name' && prop.default) {
			field.name = prop.default;
			hasNameDefault = true;
		  }
		});
	  }
	  
	  // Fallback to type name if no custom default was set
	  if (!hasNameDefault) {
		field.name = this.fieldTypes[fieldType]?.name || fieldType;
	  }
	  
	  // Update state
	  this.fields.push(field);
	  this.selectedFieldId = field.id;
	  
	  this.switchTab('config');
	  this.updateConfigPanel(); 
	  this.updateCanvasView();
	  this.updateYamlOutput();
	  this.updateAuthorBioState();
  }

  updateCanvasView() {
    const canvas = this.shadowRoot.getElementById('canvas');
    
    if (this.fields.length === 0) {
      canvas.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">+</div>
          <h3>No fields yet</h3>
          <p>Select a field type from the left panel to start building your form.</p>
          <p style="margin-top: 8px; font-size: 12px;">You can drag fields to reorder them, or click to edit properties.</p>
        </div>
      `;
      canvas.classList.remove('has-fields');
      return;
    }
    
    canvas.classList.add('has-fields');
    let html = `<div class="fields-list">`;
    
    this.fields.forEach((field, index) => {
      const isSelected = field.id === this.selectedFieldId;
      html += `
        <div class="field-card ${isSelected ? 'selected' : ''}" data-field-id="${field.id}" draggable="true">
          <div class="field-card-info">
            <div class="field-card-keyname">${field.keyname}<span class="field-card-type">${field.field_type}</span></div>
            <div class="field-card-name">${field.name}</div>
          </div>
          <div class="field-card-actions">
	  `;
	  if (field.field_type != 'author_bio'){
            html += `<button class="icon-button duplicate" data-field-id="${field.id}" title="Duplicate">⎘</button>`;
	  }
      html += `
            <button class="icon-button delete" data-field-id="${field.id}" title="Delete">✕</button>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    canvas.innerHTML = html;
    
    // Setup field card event listeners
    this.shadowRoot.querySelectorAll('.field-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (!e.target.closest('.icon-button')) {
          this.selectedFieldId = card.dataset.fieldId;
		  this.switchTab('config');
          this.updateConfigPanel();
          this.updateCanvasView();
        }
      });
      
      card.addEventListener('dragstart', (e) => {
        // Explicitly set data to satisfy browser validation
        e.dataTransfer.setData('text/plain', card.dataset.fieldId); 
        e.dataTransfer.effectAllowed = 'move';
        
        this.draggedFieldId = card.dataset.fieldId;
        this.draggedFromIndex = this.fields.findIndex(f => f.id === this.draggedFieldId);
        card.style.opacity = '0.5';
      });
      
      card.addEventListener('dragend', () => {
        card.style.opacity = '1';
        this.draggedFieldId = null;
        this.draggedFromIndex = null;
      });
      
      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        // Stop propagation to prevent Canvas "copy" effect from overriding "move"
        e.stopPropagation(); 
        e.dataTransfer.dropEffect = 'move';
        
        // Add visual cue
        card.style.borderTop = '2px solid var(--accent-color)';
      });
      
      card.addEventListener('dragleave', (e) => {
        // Ensure we don't remove style when entering child elements
        // Only remove if we are genuinely leaving the card rect
        const rect = card.getBoundingClientRect();
        const x = e.clientX;
        const y = e.clientY;
        
        // Check if cursor is actually outside the element bounds
        if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
             card.style.borderTop = '';
        }
      });
      
      card.addEventListener('drop', (e) => {
        e.preventDefault();
        // Stop propagation so the canvas handler doesn't trigger
        e.stopPropagation(); 
        
        card.style.borderTop = '';
        
        if (this.draggedFieldId && this.draggedFieldId !== card.dataset.fieldId) {
          const toIndex = this.fields.findIndex(f => f.id === card.dataset.fieldId);
          
          if (this.draggedFromIndex !== -1 && toIndex !== -1) {
            // Perform the move
            const [draggedField] = this.fields.splice(this.draggedFromIndex, 1);
            this.fields.splice(toIndex, 0, draggedField);
            
            // Re-render
            this.updateCanvasView();
            this.updateYamlOutput();
          }
        }
      });
    });
    
    // Setup action buttons
    this.shadowRoot.querySelectorAll('.icon-button.duplicate').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.duplicateField(btn.dataset.fieldId);
      });
    });
    
    this.shadowRoot.querySelectorAll('.icon-button.delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteField(btn.dataset.fieldId);
      });
    });
    
    this.updateFieldCount();
  }

  updateAuthorBioState() {
    const hasAuthorBio = this.fields.some(f => f.field_type === 'author_bio');
    const btn = this.shadowRoot.querySelector('button[data-field-type="author_bio"]');
    
    if (btn) {
      if (hasAuthorBio) {
        btn.setAttribute('disabled', 'true');
        btn.removeAttribute('draggable');
        btn.title = "Only one Author Bio allowed";
      } else {
        btn.removeAttribute('disabled');
        btn.setAttribute('draggable', 'true');
        btn.removeAttribute('title');
      }
    }
  }

  updateConfigPanel() {
	  const field = this.fields.find(f => f.id === this.selectedFieldId);
	  if (!field) {
		this.shadowRoot.getElementById('configContent').innerHTML = '<div class="no-field-selected">Select a field to edit its properties</div>';
		return;
	  }
	  
	  const typeConfig = this.fieldTypes[field.field_type];
	  
	  // 1. Define Standard Properties
	  let visibleProps = ['keyname', 'field_type_display', 'name', 'description', 'i18n_descriptions', 'help_text'];
	  
	  // 2. Add Type-Specific Properties (These can now be strings OR objects)
	  if (typeConfig && Array.isArray(typeConfig.properties)) {
		visibleProps = [...visibleProps, ...typeConfig.properties];
	  }

	  // 3. Generate HTML
	  let html = '';
	  visibleProps.forEach(propEntry => { // propEntry is now string or object
		
		// Determine the base key (string or object.key)
		const propKey = typeof propEntry === 'string' ? propEntry : propEntry.key;
		
		// Special case for static display of field type
		if (propKey === 'field_type_display') {
		  html += `
			<div class="form-group">
			  <label class="form-label">Field Type</label>
			  <div style="font-size: 13px; color: var(--text-primary); padding: 8px; background: var(--bg-secondary); border-radius: 4px;">${field.field_type}</div>
			</div>`;
		  return;
		}

		let propDef = this.propertyDefinitions[propKey];
		
		// --- NEW LOGIC: Merge Overrides ---
		if (typeof propEntry === 'object' && propDef) {
			// Create a new definition by merging the base definition with the specific overrides
			propDef = {...propDef, ...propEntry}; 
		}

		if (propDef) {
		  // Pass the key and the potentially merged definition to the renderer
		  html += this.renderPropertyInput(propKey, propDef, field);
		}
	  });
	  
	  this.shadowRoot.getElementById('configContent').innerHTML = html;
	  
	  // 4. Re-attach Event Listeners
	  this.attachConfigListeners(field);
  }

  renderPropertyInput(key, def, field) {
	  const value = field[key] !== undefined ? field[key] : (def.default || '');
	  
	  if (def.type === 'custom_categories') {
		const selectedCategories = field.category ? field.category.split(',').map(c => c.trim()).filter(c => c) : [];
		return `
		  <div class="form-group" id="prop-${key}">
			<label class="form-label">${def.label}</label>
			<div id="categoryPills" style="margin-bottom: 8px;">
			  ${this.renderCategoryPills(selectedCategories)}
			</div>
			<div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">Selected: ${selectedCategories.length}/2</div>
		  </div>
		`;
	  }
	  
	  if (def.type === 'checkbox') {
		return `
		  <div class="form-group" id="prop-${key}">
		  <label class="form-checkbox">
		  <input type="checkbox" data-prop="${key}" ${value ? 'checked' : ''}>
			${def.label}  </label>
		  </div>`;
	  }
	  
	  if (def.type === 'textarea') {
		  // Convert array options to string for display
		  let displayValue = value;
		  let useLabelValue = false;
		  
		  if (key === 'options' && Array.isArray(value)) {
			// Check if any option is an object (label:value pair)
			useLabelValue = value.some(opt => typeof opt === 'object');
			
			if (useLabelValue) {
			  // Convert objects to "Label: value" format
			  displayValue = value.map(opt => {
				if (typeof opt === 'object') {
				  const [label, val] = Object.entries(opt)[0];
				  return `${label}: ${val}`;
				}
				return opt;
			  }).join('\n');
			} else {
			  // Simple string array
			  displayValue = value.join('\n');
			}
		  }
		  
		  // Add toggle for options field
		  const optionsToggle = key === 'options' ? `
			<label class="form-checkbox" style="margin-bottom: 8px;">
			  <input type="checkbox" id="use-label-value" ${useLabelValue ? 'checked' : ''}>
			  Use Label:Value pairs
			</label>
			<div id="options-help" style="font-size: 11px; color: var(--text-secondary); margin-bottom: 6px;">
			  ${useLabelValue ? 'Enter one per line in format "Label: value"' : 'Enter one option per line'}
			</div>
		  ` : '';
		  
		  return `
			<div class="form-group" id="prop-${key}">
			  <label class="form-label">${def.label}</label>
			  ${optionsToggle}
			  <textarea class="form-textarea" data-prop="${key}" placeholder="${def.placeholder || ''}">${displayValue}</textarea>
			  ${!optionsToggle && def.help ? `<div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">${def.help}</div>` : ''}
			</div>`;
	  }
	  
	  // --- i18n_map Renderer ---
	  if (def.type === 'i18n_map') {
		// 1. Find existing translations in the field object
		const existingTranslations = Object.keys(field)
		  .filter(k => k.startsWith('description-'))
		  .map(k => {
			const code = k.replace('description-', '');
			return { code, value: field[k] };
		  });

		// 2. Build the list of existing translation inputs
		let rowsHtml = existingTranslations.map(item => `
		  <div class="i18n-row" style="margin-top: 8px; border-left: 2px solid var(--accent-color); padding-left: 8px;">
			<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
			  <span style="font-weight: 600;">${item.code}</span>
			  <button class="remove-i18n-btn" data-code="${item.code}" style="background: none; border: none; color: #ff4444; cursor: pointer; font-size: 14px;">&times;</button>
			</div>
			<textarea class="form-textarea i18n-input" data-code="${item.code}" rows="2">${item.value}</textarea>
		  </div>
		`).join('');

		// 3. Build the "Add New" dropdown
		// Filter out locales that are already added
		const availableLocales = this.locales.filter(l => !field[`description-${l.code}`]);
		
		let addHtml = '';
		if (availableLocales.length > 0) {
		  addHtml = `
			<div style="display: flex; gap: 8px; margin-top: 8px;">
			  <select id="new-locale-select" class="form-input" style="padding: 4px;">
				<option value="">Select language...</option>
				${availableLocales.map(l => `<option value="${l.code}">${l.label} (${l.code})</option>`).join('')}
			  </select>
			  <button id="add-locale-btn" class="btn-secondary" style="padding: 4px 8px; font-size: 12px;">Add</button>
			</div>
		  `;
		}

		return `
		  <div class="form-group" id="prop-${key}">
			<label class="form-label">${def.label}</label>
			<div id="i18n-container">
			  ${rowsHtml}
			</div>
			${addHtml}
			${def.help ? `<div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">${def.help}</div>` : ''}
		  </div>`;
	  }
	  
	  // --- Handle generic Select inputs (including http_verb) ---
	  if (def.options && Array.isArray(def.options)) {
		  // Determine the current value, falling back to default if not set
		  const currentValue = field[key] !== undefined ? field[key] : (def.default || '');

		  const optionsHtml = def.options.map(option => {
			// The option value is the method name itself (GET, POST, etc.)
			const selected = currentValue === option ? 'selected' : '';
			return `<option value="${option}" ${selected}>${option}</option>`;
		  }).join('');

		  return `
			<div class="form-group" id="prop-${key}">
			  <label class="form-label">${def.label}</label>
			  <select class="form-input" data-prop="${key}">
				${optionsHtml}
			  </select>
			  ${def.help ? `<div style="color: var(--text-secondary); margin-top: 4px;">${def.help}</div>` : ''}
			</div>`;
	  }

	  // --- Conditional Builder Renderer ---
	  if (def.type === 'conditional_builder') {
		  const conditions = field.conditional_validation || [];
		  
		  // Get list of other fields for checkboxes
		  const otherFields = this.fields.filter(f => f.id !== field.id);
		  
		  let conditionsHtml = conditions.map((condition, idx) => {
			const hiddenSet = new Set(condition.hidden || []);
			
			const checkboxesHtml = otherFields.map(f => {
			  const checked = hiddenSet.has(f.keyname) ? 'checked' : '';
			  return `
				<label style="display: block; margin: 4px 0; cursor: pointer;">
				  <input type="checkbox" class="condition-hidden-cb" data-condition-idx="${idx}" data-field-keyname="${f.keyname}" ${checked} style="margin-right: 6px;">
				  <span style="font-size: 12px;">${f.keyname} (${f.name})</span>
				</label>
			  `;
			}).join('');
			
			return `
			  <div class="condition-block" data-condition-idx="${idx}" style="border-left: 2px solid var(--accent-color); padding-left: 12px; margin-top: 12px;">
				<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
				  <div style="display: flex; align-items: center; gap: 8px;">
					<span style="font-size: 12px; font-weight: 600;">When equals:</span>
					<input type="text" class="form-input condition-when-input" data-condition-idx="${idx}" value="${condition.when || ''}" style="width: 150px; padding: 4px 8px;">
				  </div>
				  <button class="remove-condition-btn" data-condition-idx="${idx}" style="background: none; border: none; color: #ff4444; cursor: pointer; font-size: 18px; font-weight: bold;">&times;</button>
				</div>
				<div style="font-size: 11px; font-weight: 600; text-transform: uppercase; margin-bottom: 6px; color: var(--text-secondary);">Hide these fields:</div>
				<div style="max-height: 150px; overflow-y: auto; padding: 4px 0;">
				  ${checkboxesHtml || '<div style="color: var(--text-secondary); font-size: 12px; font-style: italic;">No other fields available</div>'}
				</div>
			  </div>
			`;
		  }).join('');
		  
		  return `
			<div class="form-group" id="prop-${key}">
			  <label class="form-label">${def.label}</label>
			  <div id="conditional-container">
				${conditionsHtml}
			  </div>
			  <button id="add-condition-btn" style="margin-top: 12px; padding: 6px 12px; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 4px; cursor: pointer; font-size: 12px; width: 100%;">⊕ Add Condition</button>
			  ${def.help ? `<div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">${def.help}</div>` : ''}
			</div>
		  `;
	  }

	  // --- Special handling for 'default' field ---
	  if (key === 'default') {
		  const hasDefault = field.hasOwnProperty('default');
		  const defaultValue = hasDefault ? (field.default || '') : '';
		  
		  return `
			<div class="form-group" id="prop-${key}">
			  <label class="form-label">${def.label}</label>
			  <label class="form-checkbox" style="margin-bottom: 8px;">
				<input type="checkbox" id="enable-default" ${hasDefault ? 'checked' : ''}>
				Set default value
			  </label>
			  <input type="${def.type}" class="form-input" id="default-input" data-prop="${key}" value="${defaultValue}" placeholder="${def.placeholder || ''}" ${!hasDefault ? 'disabled' : ''} style="opacity: ${hasDefault ? '1' : '0.5'}">
			  ${def.help ? `<div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">${def.help}</div>` : ''}
			</div>`;
	  }

	  // Default: Text, Number, URL inputs
	  return `
		  <div class="form-group" id="prop-${key}">
			<label class="form-label">${def.label}</label>
			<input type="${def.type}" class="form-input" data-prop="${key}" value="${value}" placeholder="${def.placeholder || ''}">
			${def.help ? `<div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">${def.help}</div>` : ''}
		  </div>`;
  }


  attachConfigListeners(field) {
	  const container = this.shadowRoot.getElementById('configContent');

	  // Generic Inputs
	  container.querySelectorAll('[data-prop]').forEach(input => {
		input.addEventListener('input', (e) => this.handleConfigInput(e, field));
		input.addEventListener('change', (e) => this.handleConfigInput(e, field));
	  });

	  // Handle Label:Value toggle for options
	  const labelValueToggle = container.querySelector('#use-label-value');
	  if (labelValueToggle) {
	    labelValueToggle.addEventListener('change', (e) => {
		  const helpDiv = container.querySelector('#options-help');
		  if (helpDiv) {
		    helpDiv.textContent = e.target.checked 
			  ? 'Enter one per line in format "Label: value"'
			  : 'Enter one option per line';
		  }
	    });
 	  }
	  
	  // Handle "Set default value" checkbox
	  const enableDefaultCheckbox = container.querySelector('#enable-default');
		const defaultInput = container.querySelector('#default-input');
		if (enableDefaultCheckbox && defaultInput) {
		  enableDefaultCheckbox.addEventListener('change', (e) => {
			if (e.target.checked) {
			  // Enable the input and set default to empty string if not already set
			  defaultInput.disabled = false;
			  defaultInput.style.opacity = '1';
			  if (!field.hasOwnProperty('default')) {
				field.default = '';
			  }
			} else {
			  // Disable the input and remove the default property
			  defaultInput.disabled = true;
			  defaultInput.style.opacity = '0.5';
			  delete field.default;
			}
			this.updateYamlOutput();
		  });
	  }
	  
	  // Special Case: Categories (Pills)
	  const pills = container.querySelectorAll('.category-pill');
	  if (pills.length > 0) {
		pills.forEach(pill => {
		  pill.addEventListener('click', (e) => {
			e.preventDefault();
			e.stopPropagation();
			
			const category = pill.dataset.category;
			// Parse current selection
			let selected = field.category ? field.category.split(',').map(c => c.trim()).filter(c => c) : [];
			
			const index = selected.indexOf(category);
			
			if (index > -1) {
			  // Deselect
			  selected.splice(index, 1);
			} else if (selected.length < 2) {
			  // Select (if under limit)
			  selected.push(category);
			} else {
			  // Limit Reached Feedback
			  this.showToast('You can only select up to 2 categories');
			  return; // Stop here so we don't re-render unnecessarily
			}
			
			field.category = selected.join(',');
			this.updateConfigPanel(); // Re-render to update pill styling
			this.updateYamlOutput();
		  });
		});
	  }
	  
	  // --- i18n Listeners ---
	  // Handle Input Changes (typing in the translation box)
	  container.querySelectorAll('.i18n-input').forEach(input => {
		input.addEventListener('input', (e) => {
		  const code = e.target.dataset.code;
		  field[`description-${code}`] = e.target.value;
		  this.updateYamlOutput();
		});
	  });

	  // Handle "Add" Button
	  const addBtn = container.querySelector('#add-locale-btn');
	  if (addBtn) {
		addBtn.addEventListener('click', (e) => {
		  e.preventDefault();
		  const select = container.querySelector('#new-locale-select');
		  const code = select.value;
		  if (code) {
			// Initialize the new key
			field[`description-${code}`] = '';
			this.updateConfigPanel(); // Re-render to show the new input
			this.updateYamlOutput();
		  }
		});
	  }

	  // Handle "Remove" Buttons
	  container.querySelectorAll('.remove-i18n-btn').forEach(btn => {
		btn.addEventListener('click', (e) => {
		  e.preventDefault();
		  const code = e.target.dataset.code;
		  delete field[`description-${code}`]; // Remove the key entirely
		  this.updateConfigPanel(); // Re-render to remove the input
		  this.updateYamlOutput();
		});
	  });
	  
	  // --- Conditional Logic Listeners ---
		// Add Condition Button
		const addConditionBtn = container.querySelector('#add-condition-btn');
		if (addConditionBtn) {
		  addConditionBtn.addEventListener('click', (e) => {
			e.preventDefault();
			if (!field.conditional_validation) {
			  field.conditional_validation = [];
			}
			field.conditional_validation.push({
			  when: '',
			  hidden: []
			});
			this.updateConfigPanel();
			this.updateYamlOutput();
		  });
		}

		// Remove Condition Buttons
		container.querySelectorAll('.remove-condition-btn').forEach(btn => {
		  btn.addEventListener('click', (e) => {
			e.preventDefault();
			const idx = parseInt(e.target.dataset.conditionIdx);
			field.conditional_validation.splice(idx, 1);
			if (field.conditional_validation.length === 0) {
			  delete field.conditional_validation;
			}
			this.updateConfigPanel();
			this.updateYamlOutput();
		  });
		});

		// When Value Inputs
		container.querySelectorAll('.condition-when-input').forEach(input => {
		  input.addEventListener('input', (e) => {
			const idx = parseInt(e.target.dataset.conditionIdx);
			field.conditional_validation[idx].when = e.target.value;
			this.updateYamlOutput();
		  });
		});

		// Hidden Field Checkboxes
		container.querySelectorAll('.condition-hidden-cb').forEach(cb => {
		  cb.addEventListener('change', (e) => {
			const idx = parseInt(e.target.dataset.conditionIdx);
			const fieldKeyname = e.target.dataset.fieldKeyname;
			
			if (!field.conditional_validation[idx].hidden) {
			  field.conditional_validation[idx].hidden = [];
			}
			
			if (e.target.checked) {
			  if (!field.conditional_validation[idx].hidden.includes(fieldKeyname)) {
				field.conditional_validation[idx].hidden.push(fieldKeyname);
			  }
			} else {
			  field.conditional_validation[idx].hidden = field.conditional_validation[idx].hidden.filter(k => k !== fieldKeyname);
			}
			
			this.updateYamlOutput();
		  });
		});
  }

  handleConfigInput(e, field) {
	  const input = e.target;
	  const prop = input.dataset.prop;
	  let value;
	  const container = this.shadowRoot.getElementById('configContent');

	  // 1. Determine Value
	  if (input.type === 'checkbox') {
		value = input.checked;
	  } else if (input.type === 'number') {
		value = input.value === '' ? undefined : Number(input.value);
	  } else if (prop === 'options') {
		  const lines = input.value.split('\n').filter(o => o.trim());
		  
		  // Check if we're in label:value mode
		  const useLabelValue = container.querySelector('#use-label-value')?.checked;
		  
		  if (useLabelValue) {
			// Parse as label:value pairs
			value = lines.map(line => {
			  const colonIndex = line.indexOf(':');
			  if (colonIndex > -1) {
				const label = line.substring(0, colonIndex).trim();
				const val = line.substring(colonIndex + 1).trim();
				return { [label]: val };
			  }
			  // Fallback to simple string if no colon found
			  return line.trim();
			});
		  } else {
			// Simple string array
			value = lines;
		  }
	  } else {
		value = input.value;
		// Special handling for 'default' - allow empty string but only if checkbox is checked
		if (prop === 'default' && value === '') {
			// If checkbox is checked, explicitly set to empty string
			// If unchecked, this won't be called because input is disabled
			field[prop] = '';
			this.updateYamlOutput();
			return;
		}
	  }

	  // 2. Save Value
	  field[prop] = value;
	  
	  // 3. --- NEW: Auto-populate help text for multiple select ---
	  if (prop === 'multiple' && value === true && field.field_type === 'select') {
		// Only populate if currently empty to avoid overwriting user content
		if (!field.help_text || !field.help_text.trim()) {
		  field.help_text = 'Use <kbd>⌘</kbd>+<kbd>click</kbd> or <kbd>ctrl</kbd>+<kbd>click</kbd> to select and deselect multiple options.';
		  
		  // Force a re-render so the user sees the text appear immediately in the specific field
		  this.updateConfigPanel(); 
		}
	  }

	  // 4. Specific UI updates
	  if (prop === 'keyname' || prop === 'name') {
		this.updateCanvasView(); // Refresh the sidebar list items
	  }
	  
	  this.updateYamlOutput();
  }


  updateYamlOutput() {
    const yaml = this.generateYaml();
    this.shadowRoot.getElementById('yamlOutput').textContent = yaml;
  }

  generateYaml() {
    if (this.fields.length === 0) {
      return '# No fields defined yet';
    }
    
    const lines = [];
    
    this.fields.forEach(field => {
      lines.push(`- keyname: ${field.keyname}`);
      lines.push(`  field_type: ${field.field_type}`);
      lines.push(`  name: ${this.escapeYaml(field.name)}`);
      
      if (field.description) {
        lines.push(`  description: ${this.escapeYaml(field.description)}`);
      }
      
      if (field.help_text) {
        lines.push(`  help_text: ${this.escapeYaml(field.help_text)}`);
      }
      
      if (field.placeholder) {
        lines.push(`  placeholder: ${this.escapeYaml(field.placeholder)}`);
      }
      
      if (field.hasOwnProperty('default')) {
		  lines.push(`  default: ${this.escapeYaml(field.default)}`);
	  }
      
      if (field.optional) {
        lines.push(`  optional: true`);
      }
      
      if (field.min !== undefined) {
        lines.push(`  min: ${field.min}`);
      }
      
      if (field.max !== undefined) {
        lines.push(`  max: ${field.max}`);
      }
      
      if (field.maxlength !== undefined) {
        lines.push(`  maxlength: ${field.maxlength}`);
      }

      if (field.rows !== undefined) {
        lines.push(`  rows: ${field.rows}`);
      }
      
      if (field.options && field.options.length > 0) {
		  // console.log('Field options:', field.keyname, field.options);
		  lines.push(`  options:`);
		  field.options.forEach(opt => {
			if (typeof opt === 'object') {
			  // Label:Value pair - format as YAML key:value
			  const [label, value] = Object.entries(opt)[0];
			  // Don't escape the label in the key position, only the value
			  lines.push(`  - ${label}: ${this.escapeYaml(value)}`);
			} else {
			  // Simple string
			  lines.push(`  - ${this.escapeYaml(opt)}`);
			}
		  });
	  }
      
      if (field.multiple) {
        lines.push(`  multiple: true`);
      }
      
      if (field.endpoint) {
        lines.push(`  endpoint: ${this.escapeYaml(field.endpoint)}`);
      }
	  
      const isXhrField = field.field_type === 'xhrSelect' || field.field_type === 'xhrSelectSearch';
      if (isXhrField) {
          // Determine the verb: use the field property value, or fall back to the default 'GET'
          const verb = field.http_verb || this.propertyDefinitions.http_verb.default;
          
          // Always print the http_verb for XHR fields, even if it's the default 'GET'.
          lines.push(`  http_verb: ${verb}`);
      } else if (field.http_verb && field.http_verb !== 'GET') {
          // Keep this secondary check for non-XHR fields that might use a non-default verb 
          // (though unlikely with current definitions)
          lines.push(`  http_verb: ${field.http_verb}`);
      }
	       
      if (field.value) {
        lines.push(`  value: ${this.escapeYaml(field.value)}`);
      }
      
      if (field.category) {
        lines.push(`  category: ${this.escapeYaml(field.category)}`);
      }
      
      if (field.github_url) {
        lines.push(`  github_url: ${this.escapeYaml(field.github_url)}`);
      }
      if (field.email_address) {
        lines.push(`  email_address: ${this.escapeYaml(field.email_address)}`);
      }
      if (field.learn_more_url) {
        lines.push(`  learn_more_url: ${this.escapeYaml(field.learn_more_url)}`);
      }
      if (field.youtube_url) {
        lines.push(`  youtube_url: ${this.escapeYaml(field.youtube_url)}`);
      }
	  
	  // Conditional validation
	  if (field.conditional_validation && field.conditional_validation.length > 0) {
		lines.push(`  conditional_validation:`);
		field.conditional_validation.forEach(condition => {
			lines.push(`  - when: ${this.escapeYaml(condition.when)}`);
			if (condition.hidden && condition.hidden.length > 0) {
			  lines.push(`    hidden:`);
			  condition.hidden.forEach(keyname => {
				lines.push(`    - ${keyname}`);
			  });
			}
		});
	  }

	  // Capture any i18n description keys
	  Object.keys(field).forEach(k => {
	    if (k.startsWith('description-')) {
		  lines.push( `  ${k}: "${field[k]}"`);
	    }
	  });
      
    });
    
    return lines.join('\n');
  }

  escapeYaml(value) {
	  if (!value && value !== 0) return '""';
	  
	  // Convert to string if it's a number
	  if (typeof value === 'number') { return value.toString(); }
	  
	  // If it's not a string at this point, return empty
	  if (typeof value !== 'string') return '""';
	  
	  // Check if value needs quoting
	  if (/[:#\[\]\{\},&\*\|>!'"%@`\n\t]/.test(value) || /^\d+$/.test(value) || value.startsWith(' ') || value.endsWith(' ')) {
		return `"${value.replace(/"/g, '\\"')}"`;
	  }
	  
	  return value;  
  }

  reorderFields(draggedId, targetId) {
    const draggedIndex = this.fields.findIndex(f => f.id === draggedId);
    const targetIndex = this.fields.findIndex(f => f.id === targetId);
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
      const [draggedField] = this.fields.splice(draggedIndex, 1);
      this.fields.splice(targetIndex, 0, draggedField);
      this.updateCanvasView();
      this.updateYamlOutput();
    }
  }

  duplicateField(fieldId) {
    const field = this.fields.find(f => f.id === fieldId);
    
    // Prevent duplicating author_bio (existing logic)
    if (field && field.field_type === 'author_bio') {
      this.showToast('Author Bio field cannot be duplicated');
      return;
    }

    if (field) {
      // 1. Create a deep copy of the original field object
      const newField = JSON.parse(JSON.stringify(field));
      
      // 2. Assign a new unique ID
      const newFieldId = `field_${this.nextFieldId++}`;
      newField.id = newFieldId;
      
      // 3. FIX: Generate a clean, unique keyname based on the field type
      // Example: 'string' -> 'string_2'
      newField.keyname = `${field.field_type}_${this.nextFieldId - 1}`;
      
      // 4. Insert the new field and update state
      this.fields.push(newField);
      this.selectedFieldId = newField.id;
      
      // Ensure the config panel opens for the newly duplicated field
      this.updateConfigPanel();
      this.updateCanvasView();
      this.updateYamlOutput();
      this.updateAuthorBioState();
    }
  }

  deleteField(fieldId) {
    this.fields = this.fields.filter(f => f.id !== fieldId);
    if (this.selectedFieldId === fieldId) {
      this.selectedFieldId = this.fields[0]?.id || null;
    }
    this.updateCanvasView();
    this.updateConfigPanel();
    this.updateYamlOutput();
	this.updateAuthorBioState();
  }

  updateFieldCount() {
    this.shadowRoot.querySelector('#fieldCount').textContent = this.fields.length;
  }

  switchTab(tab) {
    this.shadowRoot.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    this.shadowRoot.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    this.shadowRoot.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    this.shadowRoot.getElementById(`${tab}Tab`).classList.add('active');
  }

  copyYaml() {
    const yaml = this.generateYaml();
    navigator.clipboard.writeText(yaml).then(() => {
      this.showToast('YAML copied to clipboard');
    });
  }
  
  importYaml() {
	  // Create modal overlay
	  const modal = document.createElement('div');
	  modal.style.cssText = `
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
	  `;
	  
	  const modalContent = document.createElement('div');
	  modalContent.style.cssText = `
		background: ${this.theme === 'dark' ? '#1a1a1a' : '#ffffff'};
		border: 1px solid ${this.theme === 'dark' ? '#404040' : '#e0e0e0'};
		border-radius: 8px;
		padding: 24px;
		width: 600px;
		max-width: 90vw;
		max-height: 80vh;
		display: flex;
		flex-direction: column;
	  `;
	  
	  modalContent.innerHTML = `
		<h3 style="margin: 0 0 16px 0; color: ${this.theme === 'dark' ? '#e0e0e0' : '#1a1a1a'}; font-size: 18px; font-weight: 600;">Import YAML</h3>
		<textarea id="yamlImportTextarea" placeholder="Paste your YAML here..." style="
		  flex: 1;
		  min-height: 300px;
		  padding: 12px;
		  border: 1px solid ${this.theme === 'dark' ? '#404040' : '#e0e0e0'};
		  border-radius: 4px;
		  background: ${this.theme === 'dark' ? '#2a2a2a' : '#ffffff'};
		  color: ${this.theme === 'dark' ? '#e0e0e0' : '#1a1a1a'};
		  font-family: monospace;
		  font-size: 12px;
		  resize: vertical;
		  margin-bottom: 16px;
		"></textarea>
		<div style="display: flex; gap: 8px; justify-content: flex-end;">
		  <button id="cancelImportBtn" style="
			padding: 8px 16px;
			border: 1px solid ${this.theme === 'dark' ? '#404040' : '#e0e0e0'};
			background: ${this.theme === 'dark' ? '#2a2a2a' : '#f5f5f5'};
			color: ${this.theme === 'dark' ? '#e0e0e0' : '#1a1a1a'};
			border-radius: 4px;
			cursor: pointer;
			font-size: 13px;
			font-weight: 600;
		  ">Cancel</button>
		  <button id="confirmImportBtn" style="
			padding: 8px 16px;
			border: none;
			background: ${this.accentColor};
			color: white;
			border-radius: 4px;
			cursor: pointer;
			font-size: 13px;
			font-weight: 600;
		  ">Import</button>
		</div>
	  `;
	  
	  modal.appendChild(modalContent);
	  document.body.appendChild(modal);
	  
	  const textarea = modalContent.querySelector('#yamlImportTextarea');
	  const cancelBtn = modalContent.querySelector('#cancelImportBtn');
	  const confirmBtn = modalContent.querySelector('#confirmImportBtn');
	  
	  // Focus textarea
	  textarea.focus();
	  
	  // Cancel handler
	  const closeModal = () => {
		document.body.removeChild(modal);
	  };
	  
	  cancelBtn.addEventListener('click', closeModal);
	  modal.addEventListener('click', (e) => {
		if (e.target === modal) closeModal();
	  });
	  
	  // Import handler
	  confirmBtn.addEventListener('click', () => {
		const yamlText = textarea.value;
		
		if (!yamlText || !yamlText.trim()) {
		  closeModal();
		  return;
		}
		
		try {
		  const fields = this.parseYaml(yamlText);
		  // console.log('Parsed fields:', fields);
		  if (fields.length === 0) {
			this.showToast('No fields found in YAML');
			closeModal();
			return;
		  }
		  
		  // Clear existing fields and import new ones
		  this.fields = fields.map((fieldData, index) => {
			const field = {
			  id: `field_${this.nextFieldId++}`,
			  keyname: fieldData.keyname || `field_${index}`,
			  field_type: fieldData.field_type || 'string',
			  name: fieldData.name || '',
			};
			
			// Copy over all other properties
			Object.keys(fieldData).forEach(key => {
			  if (key !== 'id') {
				field[key] = fieldData[key];
			  }
			});
			
			return field;
		  });
		  
		  this.selectedFieldId = this.fields[0]?.id || null;
		  this.updateCanvasView();
		  this.updateConfigPanel();
		  this.updateYamlOutput();
		  this.updateAuthorBioState();
		  this.switchTab('config');
		  this.showToast(`Imported ${fields.length} field(s)`);
		  closeModal();
		} catch (error) {
		  alert(`Error parsing YAML: ${error.message}`);
		}
	  });
	}
  
	parseYaml(yamlText) {
		const fields = [];
		const lines = yamlText.split('\n');
		let currentField = null;
		let currentArray = null;
		let currentArrayKey = null;
		let currentCondition = null;
		let currentNestedKey = null; // Helper to track if we are in hidden/required

		lines.forEach(line => {
		  // Skip comments and empty lines
		  if (line.trim().startsWith('#') || !line.trim()) {
			return;
		  }

		  // 1. New field (starts with - keyname:)
		  if (line.match(/^-\s+keyname:/)) {
			if (currentField) {
			  fields.push(currentField);
			}
			currentField = {};
			currentArray = null;
			currentArrayKey = null;
			currentCondition = null;
			currentNestedKey = null;
			const value = line.split('keyname:')[1].trim();
			currentField.keyname = this.unescapeYaml(value);
		  }
		  
		  // 2. Field properties (2 spaces indentation)
		  else if (currentField && line.match(/^\s{2}[a-z_-]+:/)) {
			const match = line.match(/^\s{2}([a-z_-]+):\s*(.*)$/);
			if (match) {
			  const key = match[1];
			  const value = match[2].trim();

			  // Handle array start (value is empty)
			  if (!value || value === '') {
				currentArrayKey = key;
				currentArray = [];

				if (key === 'conditional_validation') {
				  currentField[key] = [];
				} else {
				  currentField[key] = currentArray;
				}
			  } else {
				// Scalar values
				currentArrayKey = null;
				currentArray = null;
				currentField[key] = this.unescapeYaml(value);

				// Convert string booleans
				if (value === 'true') currentField[key] = true;
				if (value === 'false') currentField[key] = false;

				// Convert numbers (but not empty strings!)
				if (!isNaN(value) && value !== '' && value !== '""') {
				  currentField[key] = Number(value);
				}
			  }
			}
		  }

		  // 3. Nested properties in conditions (e.g., "    hidden:")
		  // We check this BEFORE array items to set context
		  else if (currentCondition && line.match(/^\s{4}[a-z_-]+:/)) {
			const match = line.match(/^\s{4}([a-z_]+):\s*(.*)$/);
			if (match) {
			  const key = match[1];
			  // Initialize the nested array
			  currentCondition[key] = [];
			  currentNestedKey = key; // Track that we are currently filling this key
			}
		  }

		  // 4. Nested Array Items (Deep indentation: 4 or more spaces + dash)
		  // IMPORTANT: This must come BEFORE the generic array check
		  else if (currentCondition && line.match(/^\s{4,}-\s+/)) {
			const value = line.replace(/^\s{4,}-\s+/, '').trim();
			
			// Add to the currently active nested array (hidden or required)
			if (currentNestedKey && Array.isArray(currentCondition[currentNestedKey])) {
			   currentCondition[currentNestedKey].push(value);
			}
		  }

		  // 5. Top-Level Array items (Exactly 2 spaces + dash)
		  // Regex changed from {2,} to {2} to avoid eating nested items
		  else if (line.match(/^\s{2}-\s+/)) {
			const value = line.replace(/^\s{2}-\s+/, '').trim();

			// If we're in conditional_validation, this is a NEW condition object
			if (currentArrayKey === 'conditional_validation') {
			  currentCondition = {};
			  currentField.conditional_validation.push(currentCondition);
			  currentNestedKey = null; // Reset nested context for new object

			  // Parse the "when" value
			  if (value.startsWith('when:')) {
				currentCondition.when = this.unescapeYaml(value.split('when:')[1].trim());
			  }
			}
			// Otherwise it's a regular array item (like options)
			else if (currentArray) {
			  const colonIndex = value.indexOf(':');
			  if (currentArrayKey === 'options' && colonIndex > -1) {
				const label = value.substring(0, colonIndex).trim();
				const val = value.substring(colonIndex + 1).trim();
				currentArray.push({ [this.unescapeYaml(label)]: this.unescapeYaml(val) });
			  } else {
				currentArray.push(this.unescapeYaml(value));
			  }
			}
		  }
		});

		// Don't forget the last field
		if (currentField) {
		  fields.push(currentField);
		}

		return fields;
	}

  unescapeYaml(value) {
	  if (!value && value !== 0) return '';

	  // If it's not a string, just return it as-is
	  if (typeof value !== 'string') return value;
	  
	  // Remove surrounding quotes
	  value = value.replace(/^["'](.*)["']$/, '$1');
	  
	  // Unescape escaped quotes
	  value = value.replace(/\\"/g, '"');
	  
	  return value;
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 12px 16px;
      background: ${this.theme === 'dark' ? '#e0e0e0' : '#1a1a1a'};
      color: ${this.theme === 'dark' ? '#1a1a1a' : '#e0e0e0'};
      border-radius: 4px;
      font-size: 150%;
      font-weight: 500;
      z-index: 1000;
      animation: slideIn 0.3s ease-out;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }

  // Public API methods
  getYaml() {
    return this.generateYaml();
  }

  getFields() {
    return JSON.parse(JSON.stringify(this.fields));
  }

  setFields(fields) {
    this.fields = JSON.parse(JSON.stringify(fields));
    this.selectedFieldId = this.fields[0]?.id || null;
    this.updateCanvasView();
    this.updateConfigPanel();
    this.updateYamlOutput();
	this.updateAuthorBioState(); // Check immediately on render
  }

  clear() {
    this.fields = [];
    this.selectedFieldId = null;
	this.draggedFieldId = null;
    this.draggedFromIndex = null;
	this.nextFieldId = 1;
    this.render();
    this.setupEventListeners();
    this.updateCanvasView();
	this.updateConfigPanel();
    this.updateYamlOutput();
	this.updateAuthorBioState(); // Check immediately on render
  }
}

// Register the custom element
customElements.define('trmnl-form-builder', TRMLYamlForm);
