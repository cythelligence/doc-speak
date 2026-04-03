/**
 * UI Update Functions
 */

// DOM Elements
const vendorsList = document.getElementById('vendorsList');
const sessionsList = document.getElementById('sessionsList');
const messagesContainer = document.getElementById('messagesContainer');
const emptyState = document.getElementById('emptyState');
const inputArea = document.getElementById('inputArea');
const messageInput = document.getElementById('messageInput');
const messageForm = document.getElementById('messageForm');
const createSessionBtn = document.getElementById('createSessionBtn');

/**
 * Render vendors list with checkboxes
 */
function renderVendors(vendors, selectedVendors, onToggle) {
  vendorsList.innerHTML = '';

  if (vendors.length === 0) {
    vendorsList.innerHTML = '<p class="text-sm text-slate-500">No vendors available</p>';
    return;
  }

  vendors.forEach(vendor => {
    const label = document.createElement('label');
    label.className = 'flex items-center cursor-pointer group';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = selectedVendors.includes(vendor);
    checkbox.className = 'w-4 h-4 rounded border-slate-500 text-cyan-500 focus:ring-cyan-500';
    checkbox.addEventListener('change', () => onToggle(vendor));

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
function renderSessions(sessions, currentSessionId, onSelectSession) {
  sessionsList.innerHTML = '';

  if (sessions.length === 0) {
    sessionsList.innerHTML = '<p class="text-sm text-slate-500">No sessions yet</p>';
    return;
  }

  sessions.forEach(session => {
    const button = document.createElement('button');
    button.className = `w-full text-left p-2 rounded transition text-sm truncate ${
      currentSessionId === session.id
        ? 'bg-cyan-600 text-white'
        : 'text-slate-300 hover:bg-slate-800'
    }`;
    button.title = session.title;
    button.textContent = session.title;
    button.addEventListener('click', () => onSelectSession(session.id));

    sessionsList.appendChild(button);
  });
}

/**
 * Render messages in the chat area
 */
function renderMessages(messages) {
  if (messages.length === 0) {
    messagesContainer.innerHTML = `
      <div id="emptyState" class="flex items-center justify-center h-full">
        <div class="text-center">
          <h2 class="text-2xl font-bold text-slate-900 mb-2">
            Welcome to Doc-Speak
          </h2>
          <p class="text-slate-600">Start chatting about your documentation</p>
        </div>
      </div>
    `;
    return;
  }

  messagesContainer.innerHTML = messages
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
 * Show/hide input area based on session state
 */
function updateInputAreaVisibility(hasSession) {
  if (hasSession) {
    inputArea.classList.remove('hidden');
  } else {
    inputArea.classList.add('hidden');
  }
}

/**
 * Add a temporary user message to UI while waiting for response
 */
function addTemporaryUserMessage(content) {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'flex justify-end';
  messageDiv.innerHTML = `
    <div class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-cyan-600 text-white rounded-br-none">
      <p class="text-sm">${escapeHtml(content)}</p>
      <p class="text-xs mt-1 text-cyan-100">${new Date().toLocaleTimeString()}</p>
    </div>
  `;
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Add assistant message to UI
 */
function addAssistantMessage(content) {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'flex justify-start';
  messageDiv.innerHTML = `
    <div class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-white text-slate-900 border border-slate-200 rounded-bl-none">
      <p class="text-sm">${escapeHtml(content)}</p>
      <p class="text-xs mt-1 text-slate-500">${new Date().toLocaleTimeString()}</p>
    </div>
  `;
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Update create session button state
 */
function updateCreateSessionButton(enabled) {
  createSessionBtn.disabled = !enabled;
  if (enabled) {
    createSessionBtn.classList.remove('disabled:bg-slate-600', 'disabled:cursor-not-allowed');
    createSessionBtn.classList.add('hover:bg-cyan-700');
  } else {
    createSessionBtn.classList.add('disabled:bg-slate-600', 'disabled:cursor-not-allowed');
    createSessionBtn.classList.remove('hover:bg-cyan-700');
  }
}

/**
 * Clear message input
 */
function clearMessageInput() {
  messageInput.value = '';
}

/**
 * Get message input value
 */
function getMessageInputValue() {
  return messageInput.value.trim();
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

/**
 * Show loading state
 */
function showLoading() {
  const loadingDiv = document.createElement('div');
  loadingDiv.id = 'loadingIndicator';
  loadingDiv.className = 'flex justify-start';
  loadingDiv.innerHTML = `
    <div class="px-4 py-2 rounded-lg bg-white text-slate-900 border border-slate-200">
      <p class="text-sm">Thinking...</p>
    </div>
  `;
  messagesContainer.appendChild(loadingDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Hide loading state
 */
function hideLoading() {
  const loadingIndicator = document.getElementById('loadingIndicator');
  if (loadingIndicator) {
    loadingIndicator.remove();
  }
}

export {
  renderVendors,
  renderSessions,
  renderMessages,
  updateInputAreaVisibility,
  addTemporaryUserMessage,
  addAssistantMessage,
  updateCreateSessionButton,
  clearMessageInput,
  getMessageInputValue,
  showLoading,
  hideLoading,
  messageForm,
  createSessionBtn,
};
