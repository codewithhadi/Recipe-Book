// Main application initialization
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the app
    init();
    
    async function init() {
        try {
            // Initialize recipe manager
            await window.RecipeManager.init();
            
            // Set up global event listeners
            setupGlobalEventListeners();
            
        } catch (error) {
            console.error('Error initializing app:', error);
            window.RecipeManager.showError('Failed to initialize the application. Please refresh the page.');
        }
    }
    
    // Set up global event listeners
    function setupGlobalEventListeners() {
        // Modal controls
        document.querySelectorAll('.close-btn').forEach(button => {
            button.addEventListener('click', closeModals);
        });
        
        document.getElementById('cancel-btn').addEventListener('click', closeModals);
        
        // Add recipe form
        document.getElementById('add-recipe-link').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('add-recipe-modal').style.display = 'flex';
        });
        
        document.getElementById('recipe-form').addEventListener('submit', handleCustomRecipeSubmit);
        
        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === document.getElementById('add-recipe-modal') || 
                e.target === document.getElementById('recipe-detail')) {
                closeModals();
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeModals();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                document.getElementById('global-search').focus();
            }
        });
    }
    
    // Close all modals
    function closeModals() {
        document.getElementById('add-recipe-modal').style.display = 'none';
        document.getElementById('recipe-detail').style.display = 'none';
    }
    
    // Handle custom recipe form submission
    async function handleCustomRecipeSubmit(e) {
        e.preventDefault();
        
        const title = document.getElementById('recipe-title').value;
        const category = document.getElementById('recipe-category').value;
        const area = document.getElementById('recipe-area').value;
        const ingredients = document.getElementById('recipe-ingredients').value.split('\n').filter(i => i.trim() !== '');
        const instructions = document.getElementById('recipe-instructions').value.split('\n').filter(i => i.trim() !== '');
        const story = document.getElementById('recipe-story').value;
        
        const recipeData = {
            title,
            category,
            area,
            ingredients,
            instructions,
            story
        };
        
        try {
            const newRecipe = window.StorageManager.addCustomRecipe(recipeData);
            window.RecipeManager.showNotification('Custom recipe saved successfully!', 'success');
            
            // Reset form and close modal
            document.getElementById('recipe-form').reset();
            closeModals();
            
            // If on "My Recipes" page, refresh the view
            if (document.getElementById('my-recipes-link').classList.contains('nav-active')) {
                window.RecipeManager.showMyRecipesPage();
            }
            
        } catch (error) {
            window.RecipeManager.showNotification('Failed to save recipe. Please try again.', 'error');
        }
    }
});