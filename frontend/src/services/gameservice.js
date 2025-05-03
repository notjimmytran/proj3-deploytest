const API_URL = 'http://localhost:8000/';

export async function startSession() {
    try {
        console.log("Starting session - sending request to:", `${API_URL}api/game/save_session.php`);
        
        const response = await fetch(`${API_URL}api/game/save_session.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'start' }),
            credentials: 'include'
        });
        
        console.log("Response status:", response.status);
        
        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
                console.error("Error response data:", errorData);
            } catch (e) {
                console.error("Couldn't parse error response:", e);
                errorData = { error: 'Failed to start session' };
            }
            return { success: false, error: errorData.error || `HTTP error ${response.status}` };
        }
        
        const data = await response.json();
        console.log("Success response:", data);
        return data;
    } catch (error) {
        console.error("Network error in startSession:", error);
        return { success: false, error: 'Network error occurred while starting session' };
    }
}

export async function endSession(sessionId, generation, population) {
    try {
        const response = await fetch(`${API_URL}api/game/save_session.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'end',
                sessionId: sessionId,
                generation: generation,
                population: population
            }),
            credentials: 'include'
        });
         if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Failed to end session' }));
            console.error('End session error response:', response.status, errorData);
            return { success: false, error: errorData.error || `HTTP error ${response.status}` };
        }
        return await response.json();
    } catch (error) {
        console.error('End session network error:', error);
        return { success: false, error: 'Network error occurred while ending session' };
    }
}

// New function to save game state to the server
export async function saveGameState(gameState, generation, population) {
    try {
        const response = await fetch(`${API_URL}api/game/save_state.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                state: gameState,
                generations: generation,
                population: population
            }),
            credentials: 'include'
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Failed to save game state' }));
            console.error('Save state error response:', response.status, errorData);
            return { success: false, error: errorData.error || `HTTP error ${response.status}` };
        }
        return await response.json();
    } catch (error) {
        console.error('Save state network error:', error);
        return { success: false, error: 'Network error occurred while saving game state' };
    }
}

// New function to load game state from the server
export async function loadGameState() {
    try {
        const response = await fetch(`${API_URL}api/game/load_state.php`, {
            method: 'GET',
            credentials: 'include'
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Failed to load game state' }));
            console.error('Load state error response:', response.status, errorData);
            return { success: false, error: errorData.error || `HTTP error ${response.status}` };
        }
        return await response.json();
    } catch (error) {
        console.error('Load state network error:', error);
        return { success: false, error: 'Network error occurred while loading game state' };
    }
}