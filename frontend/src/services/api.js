const API_URL = 'http://localhost:8000/';

export async function getUserStats() {
  try {
    const response = await fetch(`${API_URL}api/user/stats.php`, {
      method: 'GET',
      credentials: 'include'
    });
    return await response.json();
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}