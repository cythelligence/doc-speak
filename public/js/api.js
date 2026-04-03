/**
 * API Utility Functions
 */

async function fetchVendors() {
  try {
    const response = await fetch('/api/vendors');
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch vendors:', error);
    return [];
  }
}

async function fetchSessions() {
  try {
    const response = await fetch('/api/sessions');
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    return [];
  }
}

async function fetchMessages(sessionId) {
  try {
    const response = await fetch(`/api/sessions/${sessionId}/messages`);
    return await response.json();
  } catch (error) {
    console.error('Failed to load messages:', error);
    return [];
  }
}

async function createSession(title, vendorIds) {
  try {
    const response = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        vendorIds,
      }),
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to create session:', error);
    throw error;
  }
}

async function sendMessage(sessionId, message, vendorIds) {
  try {
    const response = await fetch(`/api/chat/${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        vendorIds,
      }),
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to send message:', error);
    throw error;
  }
}

export { fetchVendors, fetchSessions, fetchMessages, createSession, sendMessage };
