/**
 * Main Application Logic
 */

// Import state management functions
// Note: Using global functions since we're not using ES6 modules in the HTML
// Instead, we rely on the script loading order in index.html

let currentState = {
  vendors: [],
  selectedVendors: [],
  sessions: [],
  currentSessionId: null,
  messages: [],
};

/**
 * Initialize the application
 */
async function initApp() {
  console.log('Initializing Doc-Speak...');

  // Fetch initial data
  await loadVendors();
  await loadSessions();

  // Set up event listeners
  setupEventListeners();

  console.log('App initialized successfully');
}

/**
 * Load vendors from API
 */
async function loadVendors() {
  try {
    const vendors = await fetch('/api/vendors').then(r => r.json());
    currentState.vendors = vendors;
    updateUI();
  } catch (error) {
    console.error('Failed to fetch vendors:', error);
  }
}

/**
 * Load sessions from API
 */
async function loadSessions() {
  try {
    const sessions = await fetch('/api/sessions').then(r => r.json());
    currentState.sessions = sessions;
    updateUI();
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
  }
}

/**
 * Handle vendor toggle
 */
function handleVendorToggle(vendor) {
  if (currentState.selectedVendors.includes(vendor)) {
    currentState.selectedVendors = currentState.selectedVendors.filter(v => v !== vendor);
  } else {
    currentState.selectedVendors = [...currentState.selectedVendors, vendor];
  }
  updateUI();
}

/**
 * Handle session creation
 */
async function handleCreateSession() {
  if (currentState.selectedVendors.length === 0) {
    alert('Please select at least one vendor');
    return;
  }

  try {
    const title = `Session ${new Date().toLocaleString()}`;
    const response = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        vendorIds: currentState.selectedVendors,
      }),
    });

    const session = await response.json();
    currentState.sessions = [...currentState.sessions, session];
    currentState.currentSessionId = session.id;
    await loadMessages(session.id);
    updateUI();
  } catch (error) {
    console.error('Failed to create session:', error);
    alert('Failed to create session');
  }
}

/**
 * Handle session selection
 */
async function handleSelectSession(sessionId) {
  currentState.currentSessionId = sessionId;
  await loadMessages(sessionId);
  updateUI();
}

/**
 * Load messages for current session
 */
async function loadMessages(sessionId) {
  if (!sessionId) {
    currentState.messages = [];
    return;
  }

  try {
    const messages = await fetch(`/api/sessions/${sessionId}/messages`).then(r => r.json());
    currentState.messages = messages;
    updateUI();
  } catch (error) {
    console.error('Failed to load messages:', error);
  }
}

/**
 * Handle message submission
 */
async function handleSendMessage(e) {
  e.preventDefault();

  const messageText = document.getElementById('messageInput').value.trim();

  if (!messageText || !currentState.currentSessionId || currentState.selectedVendors.length === 0) {
    return;
  }

  // Clear input
  document.getElementById('messageInput').value = '';

  // Add temporary user message
  const userMessage = {
    id: `temp-${Date.now()}`,
    role: 'user',
    content: messageText,
    createdAt: new Date().toISOString(),
  };

  currentState.messages.push(userMessage);
  updateUI();

  try {
    // Show loading indicator
    showLoadingIndicator();

    // Send message to API
    const response = await fetch(`/api/chat/${currentState.currentSessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: messageText,
        vendorIds: currentState.selectedVendors,
      }),
    });

    const result = await response.json();

    // Remove temp message and add real one
    currentState.messages = currentState.messages.filter(m => m.id !== userMessage.id);

    if (result.userMessage) {
      currentState.messages.push(result.userMessage);
    }

    if (result.assistantMessage) {
      currentState.messages.push(result.assistantMessage);
    }

    updateUI();
  } catch (error) {
    console.error('Failed to send message:', error);
    // Remove temporary message on error
    currentState.messages = currentState.messages.filter(m => m.id !== userMessage.id);
    updateUI();
    alert('Failed to send message');
  }
}

/**
 * Show loading indicator
 */
function showLoadingIndicator() {
  const loadingDiv = document.createElement('div');
  loadingDiv.id = 'loadingIndicator';
  loadingDiv.className = 'flex justify-start';
  loadingDiv.innerHTML = `
    <div class="px-4 py-2 rounded-lg bg-white text-slate-900 border border-slate-200">
      <p class="text-sm animate-pulse">Thinking...</p>
    </div>
  `;
  document.getElementById('messagesContainer').appendChild(loadingDiv);
  document.getElementById('messagesContainer').scrollTop = document.getElementById('messagesContainer').scrollHeight;
}

/**
 * Remove loading indicator
 */
function removeLoadingIndicator() {
  const loadingIndicator = document.getElementById('loadingIndicator');
  if (loadingIndicator) {
    loadingIndicator.remove();
  }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Create session button
  document.getElementById('createSessionBtn').addEventListener('click', handleCreateSession);

  // Message form
  document.getElementById('messageForm').addEventListener('submit', handleSendMessage);
}

/**
 * Update UI based on current state
 */
function updateUI() {
  // Update vendors list
  renderVendorsList();

  // Update sessions list
  renderSessionsList();

  // Update messages
  renderMessagesList();

  // Update input area visibility
  const hasSession = !!currentState.currentSessionId;
  if (hasSession) {
    document.getElementById('inputArea').classList.remove('hidden');
  } else {
    document.getElementById('inputArea').classList.add('hidden');
    document.getElementById('messagesContainer').innerHTML = `
      <div class="flex items-center justify-center h-full">
        <div class="text-center">
          <h2 class="text-2xl font-bold text-slate-900 mb-2">
            Welcome to Doc-Speak
          </h2>
          <p class="text-slate-600">Select vendors and create a new chat to get started</p>
        </div>
      </div>
    `;
  }

  // Update create button state
  document.getElementById('createSessionBtn').disabled = currentState.selectedVendors.length === 0;
}

/**
 * Render vendors list
 */
function renderVendorsList() {
  const vendorsList = document.getElementById('vendorsList');
  vendorsList.innerHTML = '';

  if (currentState.vendors.length === 0) {
    vendorsList.innerHTML = '<p class="text-sm text-slate-500">No vendors available</p>';
    return;
  }

  currentState.vendors.forEach(vendor => {
    const label = document.createElement('label');
    label.className = 'flex items-center cursor-pointer group';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = currentState.selectedVendors.includes(vendor);
    checkbox.className = 'w-4 h-4 rounded border-slate-500 text-cyan-500 focus:ring-cyan-500';
    checkbox.addEventListener('change', () => handleVendorToggle(vendor));

    const span = document.createElement('span');
    span.className = 'ml-3 text-sm text-slate-300 group-hover:text-cyan-400 transition';
    span.textContent = vendor;

    label.appendChild(checkbox);
    label.appendChild(span);
    vendorsList.appendChild(label);
  });
}

/**
 * Render sessions list
 */
function renderSessionsList() {
  const sessionsList = document.getElementById('sessionsList');
  sessionsList.innerHTML = '';

  if (currentState.sessions.length === 0) {
    sessionsList.innerHTML = '<p class="text-sm text-slate-500">No sessions yet</p>';
    return;
  }

  currentState.sessions.forEach(session => {
    const button = document.createElement('button');
    button.className = `w-full text-left p-2 rounded transition text-sm truncate ${
      currentState.currentSessionId === session.id
        ? 'bg-cyan-600 text-white'
        : 'text-slate-300 hover:bg-slate-800'
    }`;
    button.title = session.title;
    button.textContent = session.title;
    button.addEventListener('click', () => handleSelectSession(session.id));

    sessionsList.appendChild(button);
  });
}

/**
 * Render messages list
 */
function renderMessagesList() {
  const messagesContainer = document.getElementById('messagesContainer');

  if (currentState.messages.length === 0) {
    if (!currentState.currentSessionId) {
      return; // Don't update if no session selected (handled by updateUI)
    }
    messagesContainer.innerHTML = `
      <div class="flex items-center justify-center h-full">
        <div class="text-center">
          <h2 class="text-2xl font-bold text-slate-900 mb-2">
            New Chat
          </h2>
          <p class="text-slate-600">Start by asking a question about your documentation</p>
        </div>
      </div>
    `;
    return;
  }

  messagesContainer.innerHTML = currentState.messages
    .map(msg => {
      const isUser = msg.role === 'user';
      return `
        <div class="flex ${isUser ? 'justify-end' : 'justify-start'}">
          <div class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
            isUser
              ? 'bg-cyan-600 text-white rounded-br-none'
              : 'bg-white text-slate-900 border border-slate-200 rounded-bl-none'
          }">
            <p class="text-sm">${escapeHtml(msg.content)}</p>
            <p class="text-xs mt-1 ${isUser ? 'text-cyan-100' : 'text-slate-500'}">
              ${new Date(msg.createdAt).toLocaleTimeString()}
            </p>
          </div>
        </div>
      `;
    })
    .join('');

  // Auto-scroll to bottom
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
