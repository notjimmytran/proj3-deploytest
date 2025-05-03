const API_URL = 'http://localhost:8000/';

// Save a pattern
export async function savePattern(name, patternData) {
    try {
        const response = await fetch(`${API_URL}api/patterns/save_pattern.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: name,
                pattern_data: patternData
            }),
            credentials: 'include'
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Failed to save pattern' }));
            return { success: false, error: errorData.error || `HTTP error ${response.status}` };
        }
        
        return await response.json();
    } catch (error) {
        console.error('Save pattern network error:', error);
        return { success: false, error: 'Network error occurred while saving pattern' };
    }
}

// Get all patterns for the current user
export async function listPatterns() {
    try {
        const response = await fetch(`${API_URL}api/patterns/list_patterns.php`, {
            method: 'GET',
            credentials: 'include'
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Failed to list patterns' }));
            return { success: false, error: errorData.error || `HTTP error ${response.status}` };
        }
        
        return await response.json();
    } catch (error) {
        console.error('List patterns network error:', error);
        return { success: false, error: 'Network error occurred while listing patterns' };
    }
}

// Get a specific pattern by ID
export async function getPattern(patternId) {
    try {
        const response = await fetch(`${API_URL}api/patterns/get_pattern.php?id=${patternId}`, {
            method: 'GET',
            credentials: 'include'
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Failed to get pattern' }));
            return { success: false, error: errorData.error || `HTTP error ${response.status}` };
        }
        
        return await response.json();
    } catch (error) {
        console.error('Get pattern network error:', error);
        return { success: false, error: 'Network error occurred while getting pattern' };
    }
}

// Delete a pattern by ID
export async function deletePattern(patternId) {
    try {
        const response = await fetch(`${API_URL}api/patterns/delete_pattern.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: patternId
            }),
            credentials: 'include'
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Failed to delete pattern' }));
            return { success: false, error: errorData.error || `HTTP error ${response.status}` };
        }
        
        return await response.json();
    } catch (error) {
        console.error('Delete pattern network error:', error);
        return { success: false, error: 'Network error occurred while deleting pattern' };
    }
}