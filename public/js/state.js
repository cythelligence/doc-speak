/**
 * State Management
 */

const state = {
  vendors: [],
  selectedVendors: [],
  sessions: [],
  currentSessionId: null,
  messages: [],
  isLoading: false,
  isLoadingMessages: false,
};

// State getters
function getState() {
  return { ...state };
}

function getVendors() {
  return state.vendors;
}

function getSelectedVendors() {
  return state.selectedVendors;
}

function getSessions() {
  return state.sessions;
}

function getCurrentSessionId() {
  return state.currentSessionId;
}

function getMessages() {
  return state.messages;
}

function isLoading() {
  return state.isLoading;
}

function isLoadingMessages() {
  return state.isLoadingMessages;
}

// State setters
function setVendors(vendors) {
  state.vendors = vendors;
  notifyListeners('vendors');
}

function setSelectedVendors(vendors) {
  state.selectedVendors = vendors;
  notifyListeners('selectedVendors');
}

function setSessions(sessions) {
  state.sessions = sessions;
  notifyListeners('sessions');
}

function setCurrentSessionId(sessionId) {
  state.currentSessionId = sessionId;
  notifyListeners('currentSessionId');
}

function setMessages(messages) {
  state.messages = messages;
  notifyListeners('messages');
}

function addMessage(message) {
  state.messages.push(message);
  notifyListeners('messages');
}

function setLoading(loading) {
  state.isLoading = loading;
  notifyListeners('isLoading');
}

function setLoadingMessages(loading) {
  state.isLoadingMessages = loading;
  notifyListeners('isLoadingMessages');
}

function toggleVendor(vendor) {
  if (state.selectedVendors.includes(vendor)) {
    state.selectedVendors = state.selectedVendors.filter(v => v !== vendor);
  } else {
    state.selectedVendors = [...state.selectedVendors, vendor];
  }
  notifyListeners('selectedVendors');
}

// Observer pattern for state changes
const listeners = {};

function subscribe(key, callback) {
  if (!listeners[key]) {
    listeners[key] = [];
  }
  listeners[key].push(callback);
}

function notifyListeners(key) {
  if (listeners[key]) {
    listeners[key].forEach(callback => callback(state[key]));
  }
}

export {
  getState,
  getVendors,
  getSelectedVendors,
  getSessions,
  getCurrentSessionId,
  getMessages,
  isLoading,
  isLoadingMessages,
  setVendors,
  setSelectedVendors,
  setSessions,
  setCurrentSessionId,
  setMessages,
  addMessage,
  setLoading,
  setLoadingMessages,
  toggleVendor,
  subscribe,
};
