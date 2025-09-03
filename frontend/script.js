// Interactive Story Game Frontend
class StoryGame {
    constructor() {
        this.apiBaseUrl = 'http://localhost:5000/api';
        this.currentSessionId = null;
        this.isLoading = false;
        
        this.initializeElements();
        this.attachEventListeners();
        this.showNewGamePrompt();
    }
    
    initializeElements() {
        // Control elements
        this.newGameBtn = document.getElementById('newGameBtn');
        this.saveGameBtn = document.getElementById('saveGameBtn');
        this.loadGameBtn = document.getElementById('loadGameBtn');
        
        // Character setup
        this.characterNameSection = document.getElementById('characterNameSection');
        this.characterNameInput = document.getElementById('characterName');
        this.startGameBtn = document.getElementById('startGameBtn');
        
        // Game area
        this.gameArea = document.getElementById('gameArea');
        this.storyText = document.getElementById('storyText');
        this.loadingSpinner = document.getElementById('loadingSpinner');
        
        // Choice buttons
        this.choiceButtons = [
            document.getElementById('choice0'),
            document.getElementById('choice1'),
            document.getElementById('choice2')
        ];
        
        // Character display
        this.characterNameDisplay = document.getElementById('characterNameDisplay');
        this.characterTraits = document.getElementById('characterTraits');
        this.traitsDisplay = document.getElementById('traitsDisplay');
        this.characterInventory = document.getElementById('characterInventory');
        this.inventoryDisplay = document.getElementById('inventoryDisplay');
        
        // Modals
        this.saveModal = document.getElementById('saveModal');
        this.loadModal = document.getElementById('loadModal');
        this.saveNameInput = document.getElementById('saveName');
        this.confirmSaveBtn = document.getElementById('confirmSave');
        this.cancelSaveBtn = document.getElementById('cancelSave');
        this.cancelLoadBtn = document.getElementById('cancelLoad');
        this.savedGamesList = document.getElementById('savedGamesList');
        
        // Error display
        this.errorMessage = document.getElementById('errorMessage');
    }
    
    attachEventListeners() {
        // Control buttons
        this.newGameBtn.addEventListener('click', () => this.showNewGamePrompt());
        this.saveGameBtn.addEventListener('click', () => this.showSaveModal());
        this.loadGameBtn.addEventListener('click', () => this.showLoadModal());
        
        // Character setup
        this.startGameBtn.addEventListener('click', () => this.startNewGame());
        this.characterNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.startNewGame();
        });
        
        // Choice buttons
        this.choiceButtons.forEach((btn, index) => {
            btn.addEventListener('click', () => this.makeChoice(index));
        });
        
        // Save modal
        this.confirmSaveBtn.addEventListener('click', () => this.saveGame());
        this.cancelSaveBtn.addEventListener('click', () => this.hideSaveModal());
        this.saveNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.saveGame();
        });
        
        // Load modal
        this.cancelLoadBtn.addEventListener('click', () => this.hideLoadModal());
        
        // Close modals on outside click
        this.saveModal.addEventListener('click', (e) => {
            if (e.target === this.saveModal) this.hideSaveModal();
        });
        this.loadModal.addEventListener('click', (e) => {
            if (e.target === this.loadModal) this.hideLoadModal();
        });
    }
    
    // Game State Management
    showNewGamePrompt() {
        this.characterNameSection.style.display = 'block';
        this.gameArea.style.display = 'none';
        this.characterNameInput.value = '';
        this.characterNameInput.focus();
        this.saveGameBtn.disabled = true;
        this.hideError();
    }
    
    async startNewGame() {
        const characterName = this.characterNameInput.value.trim() || 'Player';
        
        if (this.isLoading) return;
        this.setLoading(true);
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/game/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    character_name: characterName
                }),
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.currentSessionId = data.session_id;
                this.updateGameDisplay(data.current_story, data.choices, data.character_info);
                this.characterNameSection.style.display = 'none';
                this.gameArea.style.display = 'block';
                this.saveGameBtn.disabled = false;
            } else {
                this.showError(data.error || 'Failed to start game');
            }
        } catch (error) {
            this.showError('Unable to connect to game server. Please check if the server is running.');
            console.error('Error starting game:', error);
        } finally {
            this.setLoading(false);
        }
    }
    
    async makeChoice(choiceIndex) {
        if (this.isLoading || !this.currentSessionId) return;
        
        this.setLoading(true);
        this.disableChoices();
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/game/choice`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    session_id: this.currentSessionId,
                    choice_index: choiceIndex
                }),
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.updateGameDisplay(data.story, data.choices, data.character_info);
            } else {
                this.showError(data.error || 'Failed to process choice');
                this.enableChoices();
            }
        } catch (error) {
            this.showError('Unable to connect to game server');
            this.enableChoices();
            console.error('Error making choice:', error);
        } finally {
            this.setLoading(false);
        }
    }
    
    // Save/Load Functionality
    async showSaveModal() {
        if (!this.currentSessionId) return;
        
        this.saveNameInput.value = `Save ${new Date().toLocaleDateString()}`;
        this.saveModal.style.display = 'flex';
        this.saveNameInput.focus();
        this.saveNameInput.select();
    }
    
    hideSaveModal() {
        this.saveModal.style.display = 'none';
    }
    
    async saveGame() {
        const saveName = this.saveNameInput.value.trim();
        if (!saveName || !this.currentSessionId) return;
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/game/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    session_id: this.currentSessionId,
                    save_name: saveName
                }),
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.hideSaveModal();
                this.showSuccess('Game saved successfully!');
            } else {
                this.showError(data.error || 'Failed to save game');
            }
        } catch (error) {
            this.showError('Unable to save game');
            console.error('Error saving game:', error);
        }
    }
    
    async showLoadModal() {
        this.loadModal.style.display = 'flex';
        await this.loadSavedGames();
    }
    
    hideLoadModal() {
        this.loadModal.style.display = 'none';
    }
    
    async loadSavedGames() {
        this.savedGamesList.innerHTML = '<p class="loading-text">Loading saved games...</p>';
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/game/saves`);
            const data = await response.json();
            
            if (data.success && data.saved_games.length > 0) {
                this.displaySavedGames(data.saved_games);
            } else {
                this.savedGamesList.innerHTML = '<p class="loading-text">No saved games found</p>';
            }
        } catch (error) {
            this.savedGamesList.innerHTML = '<p class="loading-text">Error loading saved games</p>';
            console.error('Error loading saved games:', error);
        }
    }
    
    displaySavedGames(savedGames) {
        this.savedGamesList.innerHTML = '';
        
        savedGames.forEach(save => {
            const saveElement = document.createElement('div');
            saveElement.className = 'saved-game-item';
            saveElement.innerHTML = `
                <div class="saved-game-name">${save.save_name}</div>
                <div class="saved-game-date">${new Date(save.saved_at).toLocaleString()}</div>
            `;
            
            saveElement.addEventListener('click', () => this.loadGame(save.id));
            this.savedGamesList.appendChild(saveElement);
        });
    }
    
    async loadGame(saveId) {
        if (this.isLoading) return;
        
        this.setLoading(true);
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/game/load/${saveId}`, {
                method: 'POST',
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.currentSessionId = data.session_id;
                this.updateGameDisplay(data.current_story, data.choices, data.character_info);
                this.characterNameSection.style.display = 'none';
                this.gameArea.style.display = 'block';
                this.saveGameBtn.disabled = false;
                this.hideLoadModal();
                this.showSuccess('Game loaded successfully!');
            } else {
                this.showError(data.error || 'Failed to load game');
            }
        } catch (error) {
            this.showError('Unable to load game');
            console.error('Error loading game:', error);
        } finally {
            this.setLoading(false);
        }
    }
    
    // UI Updates
    updateGameDisplay(story, choices, characterInfo) {
        // Update story text
        this.storyText.textContent = story;
        
        // Update choices
        choices.forEach((choice, index) => {
            if (this.choiceButtons[index]) {
                this.choiceButtons[index].textContent = choice;
                this.choiceButtons[index].style.display = 'block';
            }
        });
        
        // Hide unused choice buttons
        for (let i = choices.length; i < this.choiceButtons.length; i++) {
            if (this.choiceButtons[i]) {
                this.choiceButtons[i].style.display = 'none';
            }
        }
        
        // Update character info
        this.updateCharacterDisplay(characterInfo);
        
        // Enable choices
        this.enableChoices();
        
        // Scroll to top of story
        this.storyText.scrollTop = 0;
    }
    
    updateCharacterDisplay(characterInfo) {
        this.characterNameDisplay.textContent = characterInfo.name || 'Player';
        
        // Update traits
        if (characterInfo.traits && characterInfo.traits.length > 0) {
            this.traitsDisplay.textContent = characterInfo.traits.join(', ');
            this.characterTraits.style.display = 'block';
        } else {
            this.characterTraits.style.display = 'none';
        }
        
        // Update inventory
        if (characterInfo.inventory && characterInfo.inventory.length > 0) {
            this.inventoryDisplay.textContent = characterInfo.inventory.join(', ');
            this.characterInventory.style.display = 'block';
        } else {
            this.characterInventory.style.display = 'none';
        }
    }
    
    setLoading(loading) {
        this.isLoading = loading;
        
        if (loading) {
            this.loadingSpinner.style.display = 'flex';
            this.storyText.style.display = 'none';
        } else {
            this.loadingSpinner.style.display = 'none';
            this.storyText.style.display = 'block';
        }
    }
    
    disableChoices() {
        this.choiceButtons.forEach(btn => {
            btn.disabled = true;
        });
    }
    
    enableChoices() {
        this.choiceButtons.forEach(btn => {
            btn.disabled = false;
        });
    }
    
    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.hideError();
        }, 5000);
    }
    
    hideError() {
        this.errorMessage.style.display = 'none';
    }
    
    showSuccess(message) {
        // Create temporary success message
        const successMessage = document.createElement('div');
        successMessage.className = 'error-message';
        successMessage.style.background = '#d4edda';
        successMessage.style.color = '#155724';
        successMessage.style.borderLeftColor = '#28a745';
        successMessage.textContent = message;
        
        // Insert after header
        const header = document.querySelector('.header');
        header.after(successMessage);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            successMessage.remove();
        }, 3000);
    }
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new StoryGame();
});
