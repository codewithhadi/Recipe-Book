// Recipe management functionality
window.RecipeManager = {
    currentView: 'grid',
    currentRecipes: [],
    currentFilter: 'all',
    categories: [],
    areas: [],
    activeCategory: 'all',
    activeArea: 'all',

    // Initialize recipe manager
    async init() {
        // Show loading state
        this.showLoading(true);
        
        try {
            // Wait for APIManager to be available
            if (typeof window.APIManager === 'undefined') {
                console.error('APIManager not found');
                this.showError('API Manager not loaded. Please refresh the page.');
                return;
            }

            // Load initial data
            await this.loadInitialData();
            
            // Setup UI components
            this.setupEventListeners();
            this.updateStats();
            
            // Hide loading, show content
            this.showLoading(false);
            this.showContent(true);
            
        } catch (error) {
            console.error('Error initializing recipe manager:', error);
            this.showError('Failed to load recipes. Please refresh the page.');
        }
    },

    // Load initial data
    async loadInitialData() {
        try {
            // Load categories and areas
            this.categories = await window.APIManager.getCategories();
            this.areas = await window.APIManager.getAreas();
            
            // Load popular recipes
            this.currentRecipes = await window.APIManager.getPopularRecipes();
            
            // Display recipes
            this.displayRecipes(this.currentRecipes);
            
            // Populate filters - with null checks
            this.populateCategories();
            this.populateAreas();
            this.populateCategoryDropdown();
            
        } catch (error) {
            console.error('Error in loadInitialData:', error);
            throw error;
        }
    },

    // Show/hide loading state
    showLoading(show) {
        const loadingSection = document.getElementById('loading-section');
        const mainContent = document.getElementById('main-content');
        
        if (loadingSection && mainContent) {
            if (show) {
                loadingSection.style.display = 'flex';
                mainContent.style.display = 'none';
            } else {
                loadingSection.style.display = 'none';
            }
        }
    },

    // Show/hide main content
    showContent(show) {
        const mainContent = document.getElementById('main-content');
        if (mainContent && show) {
            mainContent.style.display = 'grid';
        }
    },

    // Show error message
    showError(message) {
        const loadingSection = document.getElementById('loading-section');
        if (loadingSection) {
            loadingSection.innerHTML = `
                <div class="error-message">
                    <div style="font-size: 3rem;">😞</div>
                    <h3>Oops! Something went wrong</h3>
                    <p>${message}</p>
                    <button class="btn" onclick="location.reload()">Try Again</button>
                </div>
            `;
        }
    },

    // Setup event listeners
    setupEventListeners() {
        // Search functionality with null checks
        const searchBtn = document.getElementById('search-btn');
        const searchInput = document.getElementById('search-input');
        const globalSearchBtn = document.getElementById('global-search-btn');
        const globalSearch = document.getElementById('global-search');
        const clearSearch = document.getElementById('clear-search');
        
        if (searchBtn) searchBtn.addEventListener('click', () => this.handleSearch());
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                if (e.target.value.trim() === '') {
                    this.clearSearch();
                }
            });
        }
        
        if (globalSearchBtn) globalSearchBtn.addEventListener('click', () => this.handleGlobalSearch());
        if (globalSearch) {
            globalSearch.addEventListener('input', (e) => {
                if (e.target.value.trim() === '') {
                    this.clearSearch();
                }
            });
        }

        if (clearSearch) clearSearch.addEventListener('click', () => this.clearSearch());

        // View controls
        const gridView = document.getElementById('grid-view');
        const listView = document.getElementById('list-view');
        if (gridView) gridView.addEventListener('click', () => this.switchView('grid'));
        if (listView) listView.addEventListener('click', () => this.switchView('list'));

        // Load more
        const loadMoreBtn = document.getElementById('load-more-btn');
        if (loadMoreBtn) loadMoreBtn.addEventListener('click', () => this.loadMoreRecipes());

        // Navigation
        const homeLink = document.getElementById('home-link');
        const browseLink = document.getElementById('browse-link');
        const myRecipesLink = document.getElementById('my-recipes-link');
        
        if (homeLink) homeLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.showHomePage();
        });
        if (browseLink) browseLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.showBrowsePage();
        });
        if (myRecipesLink) myRecipesLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.showMyRecipesPage();
        });

        // Category filter dropdown
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.handleCategoryFilterChange(e.target.value);
            });
        }
    },

    // Populate categories filter
    populateCategories() {
        const container = document.getElementById('categories-list');
        const dropdown = document.getElementById('category-filter');
        
        if (!container) {
            console.error('categories-list element not found');
            return;
        }
        
        container.innerHTML = '';
        
        // Add "All" option to sidebar
        const allBtn = document.createElement('button');
        allBtn.className = 'category-btn active';
        allBtn.innerHTML = '🌍 All Categories';
        allBtn.onclick = () => this.handleCategoryClick('all');
        container.appendChild(allBtn);
        
        // Add categories to sidebar
        this.categories.forEach(category => {
            const btn = document.createElement('button');
            btn.className = 'category-btn';
            btn.innerHTML = `🍽️ ${category.name}`;
            btn.onclick = () => this.handleCategoryClick(category.name);
            container.appendChild(btn);
        });

        // Populate dropdown if it exists
        if (dropdown) {
            dropdown.innerHTML = '<option value="all">All Categories</option>';
            this.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.name;
                option.textContent = category.name;
                dropdown.appendChild(option);
            });
        }
    },

    // Populate areas filter
    populateAreas() {
        const container = document.getElementById('areas-list');
        
        if (!container) {
            console.error('areas-list element not found');
            return;
        }
        
        container.innerHTML = '';
        
        // Add "All" option
        const allBtn = document.createElement('button');
        allBtn.className = 'category-btn active';
        allBtn.innerHTML = '🌎 All Cuisines';
        allBtn.onclick = () => this.handleAreaClick('all');
        container.appendChild(allBtn);
        
        // Add areas
        this.areas.forEach(area => {
            const btn = document.createElement('button');
            btn.className = 'category-btn';
            btn.innerHTML = `🇺🇳 ${area}`;
            btn.onclick = () => this.handleAreaClick(area);
            container.appendChild(btn);
        });
    },

    // Populate category dropdown for custom recipes
    populateCategoryDropdown() {
        const dropdown = document.getElementById('recipe-category');
        
        if (!dropdown) {
            console.error('recipe-category element not found');
            return;
        }
        
        dropdown.innerHTML = '<option value="">Select Category</option>';
        
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.name;
            option.textContent = category.name;
            dropdown.appendChild(option);
        });
    },

    // Handle category click from sidebar
    async handleCategoryClick(category) {
        this.activeCategory = category;
        this.updateActiveFilterButtons();
        
        if (category === 'all') {
            await this.showHomePage();
        } else {
            this.showLoading(true);
            try {
                const recipes = await window.APIManager.getRecipesByCategory(category);
                this.displayRecipes(recipes);
                this.updatePageTitle(`${category} Recipes`);
                this.updateCategoryFilter(category);
            } catch (error) {
                this.showNotification('Failed to load category recipes', 'error');
            }
            this.showLoading(false);
        }
    },

    // Handle area click from sidebar
    async handleAreaClick(area) {
        this.activeArea = area;
        this.updateActiveFilterButtons();
        
        if (area === 'all') {
            await this.showHomePage();
        } else {
            this.showLoading(true);
            try {
                const recipes = await window.APIManager.getRecipesByArea(area);
                this.displayRecipes(recipes);
                this.updatePageTitle(`${area} Cuisine`);
            } catch (error) {
                this.showNotification('Failed to load cuisine recipes', 'error');
            }
            this.showLoading(false);
        }
    },

    // Handle category filter change from dropdown
    async handleCategoryFilterChange(category) {
        if (category === 'all') {
            await this.showHomePage();
        } else {
            this.showLoading(true);
            try {
                const recipes = await window.APIManager.getRecipesByCategory(category);
                this.displayRecipes(recipes);
                this.updatePageTitle(`${category} Recipes`);
                
                // Update active state in sidebar
                this.activeCategory = category;
                this.updateActiveFilterButtons();
            } catch (error) {
                this.showNotification('Failed to load category recipes', 'error');
            }
            this.showLoading(false);
        }
    },

    // Update page title
    updatePageTitle(title) {
        const titleElement = document.getElementById('recipes-title');
        if (titleElement) {
            titleElement.textContent = title;
        }
    },

    // Update category filter dropdown
    updateCategoryFilter(category) {
        const dropdown = document.getElementById('category-filter');
        if (dropdown) {
            dropdown.value = category;
        }
    },

    // Update active filter buttons
    updateActiveFilterButtons() {
        // Update category buttons
        const categoryButtons = document.querySelectorAll('#categories-list .category-btn');
        categoryButtons.forEach(btn => {
            btn.classList.remove('active');
            const btnText = btn.textContent || btn.innerText;
            if ((this.activeCategory === 'all' && btnText.includes('All Categories')) ||
                btnText.includes(this.activeCategory)) {
                btn.classList.add('active');
            }
        });

        // Update area buttons
        const areaButtons = document.querySelectorAll('#areas-list .category-btn');
        areaButtons.forEach(btn => {
            btn.classList.remove('active');
            const btnText = btn.textContent || btn.innerText;
            if ((this.activeArea === 'all' && btnText.includes('All Cuisines')) ||
                btnText.includes(this.activeArea)) {
                btn.classList.add('active');
            }
        });
    },

    // Display recipes
    displayRecipes(recipesToDisplay) {
        const recipesContainer = document.getElementById('recipes-container');
        if (!recipesContainer) {
            console.error('recipes-container element not found');
            return;
        }

        this.currentRecipes = recipesToDisplay;
        recipesContainer.innerHTML = '';
        
        if (recipesToDisplay.length === 0) {
            recipesContainer.innerHTML = `
                <div class="no-recipes">
                    <h3>🍳 No recipes found</h3>
                    <p>Try adjusting your search or browse different categories!</p>
                </div>
            `;
            this.hideLoadMoreButton();
            return;
        }

        this.showLoadMoreButton();
        
        recipesToDisplay.forEach(recipe => {
            const recipeCard = this.createRecipeCard(recipe);
            recipesContainer.appendChild(recipeCard);
        });

        this.updateStats();
    },

    // Show/hide load more button
    showLoadMoreButton() {
        const loadMoreBtn = document.getElementById('load-more-btn');
        if (loadMoreBtn) {
            loadMoreBtn.style.display = 'block';
        }
    },

    hideLoadMoreButton() {
        const loadMoreBtn = document.getElementById('load-more-btn');
        if (loadMoreBtn) {
            loadMoreBtn.style.display = 'none';
        }
    },

    // Create recipe card
    createRecipeCard(recipe) {
        const recipeCard = document.createElement('div');
        recipeCard.className = `recipe-card ${this.currentView === 'list' ? 'list-view' : ''}`;
        
        const ingredientsPreview = recipe.ingredients.slice(0, 3).join(', ') + (recipe.ingredients.length > 3 ? '...' : '');
        const saveIcon = recipe.isSaved ? '❤️' : '🤍';
        
        recipeCard.innerHTML = `
            <div class="recipe-image">
                ${recipe.image ? `<img src="${recipe.image}" alt="${recipe.title}" loading="lazy">` : '<div class="image-placeholder">🍳</div>'}
                <div class="recipe-category">${recipe.category}</div>
            </div>
            <div class="recipe-content">
                <h3 class="recipe-title">${recipe.title}</h3>
                ${recipe.area ? `<div class="recipe-area">${recipe.area} Cuisine</div>` : ''}
                <p class="recipe-ingredients">${ingredientsPreview}</p>
                <div class="recipe-actions">
                    <button class="action-btn view-btn" data-id="${recipe.id}">
                        👁️ View
                    </button>
                    <button class="action-btn save-toggle-btn ${recipe.isSaved ? 'saved' : ''}" data-id="${recipe.id}">
                        ${saveIcon} ${recipe.isSaved ? 'Saved' : 'Save'}
                    </button>
                </div>
            </div>
        `;
        
        // Add event listeners
        const viewBtn = recipeCard.querySelector('.view-btn');
        const saveBtn = recipeCard.querySelector('.save-toggle-btn');
        
        if (viewBtn) {
            viewBtn.addEventListener('click', (e) => {
                const recipeId = e.target.closest('.view-btn').getAttribute('data-id');
                this.showRecipeDetail(recipeId);
            });
        }
        
        if (saveBtn) {
            saveBtn.addEventListener('click', (e) => {
                const recipeId = e.target.closest('.save-toggle-btn').getAttribute('data-id');
                this.toggleSaveRecipe(recipeId, e.target.closest('.save-toggle-btn'));
            });
        }
        
        // Click on card to view details
        recipeCard.addEventListener('click', (e) => {
            if (!e.target.closest('.action-btn')) {
                const viewBtn = recipeCard.querySelector('.view-btn');
                if (viewBtn) {
                    const recipeId = viewBtn.getAttribute('data-id');
                    this.showRecipeDetail(recipeId);
                }
            }
        });
        
        return recipeCard;
    },

    // Handle search from search bar
    async handleSearch() {
        const query = document.getElementById('search-input')?.value.trim() || '';
        await this.performSearch(query, 'search-input');
    },

    // Handle global search from hero section
    async handleGlobalSearch() {
        const query = document.getElementById('global-search')?.value.trim() || '';
        await this.performSearch(query, 'global-search');
    },

    // Perform actual search
    async performSearch(query, source) {
        if (!query) {
            this.showNotification('Please enter a search term', 'warning');
            return;
        }
        
        this.showLoading(true);
        
        try {
            const recipes = await window.APIManager.searchRecipes(query);
            this.displayRecipes(recipes);
            this.updatePageTitle(`Search Results for "${query}"`);
            
            // Sync search inputs
            if (source === 'search-input') {
                const globalSearch = document.getElementById('global-search');
                if (globalSearch) globalSearch.value = query;
            } else {
                const searchInput = document.getElementById('search-input');
                if (searchInput) searchInput.value = query;
            }
            
            // Reset filters
            this.activeCategory = 'all';
            this.activeArea = 'all';
            this.updateActiveFilterButtons();
            this.updateCategoryFilter('all');
            
        } catch (error) {
            this.showNotification('Search failed. Please try again.', 'error');
        }
        
        this.showLoading(false);
    },

    // Clear search and reset to home
    async clearSearch() {
        const searchInput = document.getElementById('search-input');
        const globalSearch = document.getElementById('global-search');
        
        if (searchInput) searchInput.value = '';
        if (globalSearch) globalSearch.value = '';
        
        // Reset filters
        this.activeCategory = 'all';
        this.activeArea = 'all';
        this.updateActiveFilterButtons();
        this.updateCategoryFilter('all');
        
        await this.showHomePage();
    },

    // Load more recipes
    async loadMoreRecipes() {
        this.showNotification('Loading more recipes...', 'info');
        
        try {
            const moreRecipes = await window.APIManager.getRandomRecipes(6);
            this.currentRecipes = [...this.currentRecipes, ...moreRecipes];
            this.displayRecipes(this.currentRecipes);
            this.showNotification('More recipes loaded!', 'success');
        } catch (error) {
            this.showNotification('Failed to load more recipes', 'error');
        }
    },

    // Show home page
    async showHomePage() {
        this.showLoading(true);
        
        try {
            const recipes = await window.APIManager.getPopularRecipes();
            this.displayRecipes(recipes);
            this.updatePageTitle('Popular Recipes');
            this.setActiveNav('home-link');
            
            // Reset active filters
            this.activeCategory = 'all';
            this.activeArea = 'all';
            this.updateActiveFilterButtons();
            
        } catch (error) {
            this.showNotification('Failed to load recipes', 'error');
        }
        
        this.showLoading(false);
    },

    // Show browse page
    async showBrowsePage() {
        await this.showHomePage();
        this.setActiveNav('browse-link');
    },

    // Show my recipes page
    async showMyRecipesPage() {
        this.showLoading(true);
        
        try {
            const savedRecipes = window.StorageManager.getSavedRecipes();
            this.displayRecipes(savedRecipes);
            this.updatePageTitle('My Saved Recipes');
            this.setActiveNav('my-recipes-link');
            
            // Reset active filters
            this.activeCategory = 'all';
            this.activeArea = 'all';
            this.updateActiveFilterButtons();
            
        } catch (error) {
            this.showNotification('Failed to load saved recipes', 'error');
        }
        
        this.showLoading(false);
    },

    // Set active navigation
    setActiveNav(activeId) {
        const navLinks = document.querySelectorAll('nav a');
        navLinks.forEach(link => {
            link.classList.remove('nav-active');
        });
        
        const activeLink = document.getElementById(activeId);
        if (activeLink) {
            activeLink.classList.add('nav-active');
        }
    },

    // Switch view
    switchView(view) {
        this.currentView = view;
        const recipesContainer = document.getElementById('recipes-container');
        const gridBtn = document.getElementById('grid-view');
        const listBtn = document.getElementById('list-view');
        
        if (recipesContainer) {
            if (view === 'grid') {
                recipesContainer.className = 'recipe-grid';
            } else {
                recipesContainer.className = 'recipe-grid list-view';
            }
        }
        
        if (gridBtn && listBtn) {
            if (view === 'grid') {
                gridBtn.classList.add('active');
                listBtn.classList.remove('active');
            } else {
                listBtn.classList.add('active');
                gridBtn.classList.remove('active');
            }
        }
        
        // Re-render recipes with new view
        this.displayRecipes(this.currentRecipes);
    },

    // Update statistics
    updateStats() {
        const totalRecipes = document.getElementById('total-recipes');
        const savedRecipes = document.getElementById('saved-recipes');
        
        if (totalRecipes) {
            totalRecipes.textContent = this.currentRecipes.length;
        }
        if (savedRecipes) {
            savedRecipes.textContent = window.StorageManager.getSavedRecipesCount();
        }
    },

    // Show notification
    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Add styles based on type
        const bgColor = type === 'success' ? '#27ae60' : 
                       type === 'error' ? '#e74c3c' : 
                       type === 'warning' ? '#f39c12' : '#3498db';
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${bgColor};
            color: white;
            border-radius: 5px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    },

    // [Include all the other methods: showRecipeDetail, populateRecipeDetail, toggleSaveRecipe, etc.]
    // ... (Keep all the other methods from the previous code that are working)
};