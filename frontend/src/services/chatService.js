import api from "./api";

// ==========================================
// CREATE CONVERSATION
// ==========================================

export async function createConversation(projectId, title = "New Chat") {
  const response = await api.post(`/projects/${projectId}/conversations`, {
    title,
  });

  return response.data;
}

// ==========================================
// GET PROJECT CONVERSATIONS
// ==========================================

export async function getConversations(projectId) {
  const response = await api.get(`/projects/${projectId}/conversations`);

  return response.data;
}

// ==========================================
// GET CONVERSATION MESSAGES
// ==========================================

export async function getConversationMessages(projectId, conversationId) {
  const response = await api.get(
    `/projects/${projectId}/conversations/${conversationId}/messages`,
  );

  return response.data;
}

// ==========================================
// SEND MESSAGE TO AI
// ==========================================

export async function sendMessage(projectId, conversationId, question) {
  let settings = {
    responseStyle: "balanced",
    showCitations: true,
  };

  try {
    const savedSettings = localStorage.getItem("insightflow-settings");

    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);

      settings = {
        responseStyle: ["concise", "balanced", "detailed"].includes(
          parsed.responseStyle,
        )
          ? parsed.responseStyle
          : "balanced",

        showCitations:
          typeof parsed.showCitations === "boolean"
            ? parsed.showCitations
            : true,
      };
    }
  } catch (error) {
    console.error("Unable to read AI preferences:", error);
  }

  const response = await api.post(
    `/projects/${projectId}/conversations/${conversationId}/messages`,
    {
      conversation_id: conversationId,
      question,
      response_style: settings.responseStyle,
      show_citations: settings.showCitations,
    },
  );

  return response.data;
}

// ==========================================
// RENAME CONVERSATION
// ==========================================

export async function renameConversation(projectId, conversationId, title) {
  const response = await api.patch(
    `/projects/${projectId}/conversations/${conversationId}`,
    {
      title,
    },
  );

  return response.data;
}

// ==========================================
// DELETE CONVERSATION
// ==========================================

export async function deleteConversation(projectId, conversationId) {
  await api.delete(`/projects/${projectId}/conversations/${conversationId}`);
}
