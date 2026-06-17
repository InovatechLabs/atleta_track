import axios from 'axios';

// Cria a instância padrão do Axios
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3333/api',
  withCredentials: true,
});

export async function uploadPerformance(file: File) {
  const form = new FormData();
  form.append('file', file);
  
  const response = await api.post('/import', form);
  return response.data;
}
