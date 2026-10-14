import api from "./api";

export async function generateContent(projectId, data) {
  const response = await api.post(`/projects/${projectId}/generate`, data);

  return response.data;
}

export async function getGeneratedContent(projectId) {
  const response = await api.get(`/projects/${projectId}/generated`);

  return response.data;
}

export async function getGeneratedContentById(projectId, contentId) {
  const response = await api.get(
    `/projects/${projectId}/generated/${contentId}`,
  );

  return response.data;
}

export async function deleteGeneratedContent(projectId, contentId) {
  await api.delete(`/projects/${projectId}/generated/${contentId}`);
}
