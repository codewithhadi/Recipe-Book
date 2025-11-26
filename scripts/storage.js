// Storage management for recipes
window.StorageManager = {
    // Get saved recipes from localStorage
    getSavedRecipes: function() {
        const recipes = localStorage.getItem('savedRecipes');
        return recipes ? JSON.parse(recipes) : [];
    },

    // Save recipes to localStorage
    saveRecipes: function(recipes) {
        localStorage.setItem('savedRecipes', JSON.stringify(recipes));
    },

    // Get custom recipes from localStorage
    getCustomRecipes: function() {
        const recipes = localStorage.getItem('customRecipes');
        return recipes ? JSON.parse(recipes) : [];
    },

    // Save custom recipes to localStorage
    saveCustomRecipes: function(recipes) {
        localStorage.setItem('customRecipes', JSON.stringify(recipes));
    },

    // Get next available ID for custom recipes
    getNextCustomId: function() {
        const recipes = this.getCustomRecipes();
        if (recipes.length === 0) return 1;
        return Math.max(...recipes.map(r => parseInt(r.id.replace('custom_', '')) || 0)) + 1;
    },

    // Check if recipe is saved
    isRecipeSaved: function(recipeId) {
        const savedRecipes = this.getSavedRecipes();
        return savedRecipes.some(recipe => recipe.id === recipeId);
    },

    // Save a recipe
    saveRecipe: function(recipe) {
        const savedRecipes = this.getSavedRecipes();
        
        // Check if already saved
        if (!savedRecipes.some(r => r.id === recipe.id)) {
            savedRecipes.push({
                ...recipe,
                savedAt: new Date().toISOString()
            });
            this.saveRecipes(savedRecipes);
            return true;
        }
        return false;
    },

    // Unsave a recipe
    unsaveRecipe: function(recipeId) {
        const savedRecipes = this.getSavedRecipes();
        const updatedRecipes = savedRecipes.filter(recipe => recipe.id !== recipeId);
        this.saveRecipes(updatedRecipes);
        return updatedRecipes;
    },

    // Add custom recipe
    addCustomRecipe: function(recipeData) {
        const customRecipes = this.getCustomRecipes();
        const newRecipe = {
            ...recipeData,
            id: `custom_${this.getNextCustomId()}`,
            isCustom: true,
            isSaved: true,
            createdAt: new Date().toISOString().split('T')[0]
        };
        
        customRecipes.push(newRecipe);
        this.saveCustomRecipes(customRecipes);
        
        // Also save to saved recipes
        this.saveRecipe(newRecipe);
        
        return newRecipe;
    },

    // Update custom recipe
    updateCustomRecipe: function(id, recipeData) {
        const customRecipes = this.getCustomRecipes();
        const index = customRecipes.findIndex(recipe => recipe.id === id);
        
        if (index !== -1) {
            customRecipes[index] = { ...customRecipes[index], ...recipeData };
            this.saveCustomRecipes(customRecipes);
            
            // Update in saved recipes as well
            const savedRecipes = this.getSavedRecipes();
            const savedIndex = savedRecipes.findIndex(recipe => recipe.id === id);
            if (savedIndex !== -1) {
                savedRecipes[savedIndex] = { ...savedRecipes[savedIndex], ...recipeData };
                this.saveRecipes(savedRecipes);
            }
            
            return customRecipes[index];
        }
        return null;
    },

    // Delete custom recipe
    deleteCustomRecipe: function(id) {
        let customRecipes = this.getCustomRecipes();
        customRecipes = customRecipes.filter(recipe => recipe.id !== id);
        this.saveCustomRecipes(customRecipes);
        
        // Also remove from saved recipes
        this.unsaveRecipe(id);
        
        return customRecipes;
    },

    // Get all recipes (saved + custom)
    getAllRecipes: function() {
        const savedRecipes = this.getSavedRecipes();
        const customRecipes = this.getCustomRecipes();
        return [...savedRecipes, ...customRecipes];
    },

    // Get saved recipes count
    getSavedRecipesCount: function() {
        return this.getSavedRecipes().length;
    },

    // Get custom recipes count
    getCustomRecipesCount: function() {
        return this.getCustomRecipes().length;
    }
};