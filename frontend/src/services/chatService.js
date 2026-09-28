import api from "./api";

export async function createConversation(projectId, title = "New Chat") {
  const response = await api.post(`/projects/${projectId}/conversations`, {
    title,
  });

  return response.data;
}

export async function getConversations(projectId) {
  const response = await api.get(`/projects/${projectId}/conversations`);

  return response.data;
}

export async function getConversationMessages(projectId, conversationId) {
  const response = await api.get(
    `/projects/${projectId}/conversations/${conversationId}/messages`,
  );

  return response.data;
}

// Send a message to the AI
export async function sendMessage(projectId, conversationId, question) {
  const response = await api.post(
    `/projects/${projectId}/conversations/${conversationId}/messages`,
    {
      conversation_id: conversationId,
      question,
    },
  );

  return response.data;
}
