// API Manager for TheMealDB - NO API KEY NEEDED!
window.APIManager = {
    baseURL: 'https://www.themealdb.com/api/json/v1/1/',

    // Fetch random recipes
    async getRandomRecipes(count = 12) {
        try {
            console.log('🔄 Fetching random recipes from TheMealDB...');
            
            const requests = Array.from({ length: count }, () => 
                fetch(`${this.baseURL}random.php`).then(res => res.json())
            );
            
            const results = await Promise.all(requests);
            const recipes = results.map(result => result.meals[0]).filter(meal => meal);
            
            // Remove duplicates
            const uniqueRecipes = this.removeDuplicates(recipes);
            console.log(`✅ Loaded ${uniqueRecipes.length} unique recipes`);
            
            return uniqueRecipes.map(meal => this.formatMealData(meal));
        } catch (error) {
            console.error('❌ Error fetching random recipes:', error);
            return [];
        }
    },

    // Search recipes by name
    async searchRecipes(query) {
        try {
            console.log(`🔍 Searching for: ${query}`);
            const response = await fetch(`${this.baseURL}search.php?s=${query}`);
            const data = await response.json();
            
            if (data.meals) {
                console.log(`✅ Found ${data.meals.length} recipes for "${query}"`);
                return data.meals.map(meal => this.formatMealData(meal));
            }
            console.log(`❌ No recipes found for "${query}"`);
            return [];
        } catch (error) {
            console.error('❌ Error searching recipes:', error);
            return [];
        }
    },

    // Search recipes by ingredient
    async searchByIngredient(ingredient) {
        try {
            const response = await fetch(`${this.baseURL}filter.php?i=${ingredient}`);
            const data = await response.json();
            
            if (data.meals) {
                // Get full details for each meal
                const mealDetails = await Promise.all(
                    data.meals.slice(0, 12).map(meal => 
                        this.getRecipeById(meal.idMeal)
                    )
                );
                return mealDetails.filter(meal => meal);
            }
            return [];
        } catch (error) {
            console.error('Error searching by ingredient:', error);
            return [];
        }
    },

    // Get recipe by ID
    async getRecipeById(id) {
        try {
            const response = await fetch(`${this.baseURL}lookup.php?i=${id}`);
            const data = await response.json();
            
            if (data.meals && data.meals[0]) {
                return this.formatMealData(data.meals[0]);
            }
            return null;
        } catch (error) {
            console.error('Error fetching recipe by ID:', error);
            return null;
        }
    },

    // Get all categories
    async getCategories() {
        try {
            console.log('🔄 Fetching categories...');
            const response = await fetch(`${this.baseURL}categories.php`);
            const data = await response.json();
            
            if (data.categories) {
                console.log(`✅ Loaded ${data.categories.length} categories`);
                return data.categories.map(cat => ({
                    id: cat.idCategory,
                    name: cat.strCategory,
                    description: cat.strCategoryDescription,
                    thumbnail: cat.strCategoryThumb
                }));
            }
            return [];
        } catch (error) {
            console.error('Error fetching categories:', error);
            return [];
        }
    },

    // Get recipes by category
    async getRecipesByCategory(category) {
        try {
            console.log(`🔄 Fetching ${category} recipes...`);
            const response = await fetch(`${this.baseURL}filter.php?c=${category}`);
            const data = await response.json();
            
            if (data.meals) {
                const mealDetails = await Promise.all(
                    data.meals.slice(0, 12).map(meal => 
                        this.getRecipeById(meal.idMeal)
                    )
                );
                const validMeals = mealDetails.filter(meal => meal);
                console.log(`✅ Loaded ${validMeals.length} ${category} recipes`);
                return validMeals;
            }
            return [];
        } catch (error) {
            console.error('Error fetching recipes by category:', error);
            return [];
        }
    },

    // Get all areas/cuisines
    async getAreas() {
        try {
            console.log('🔄 Fetching cuisines...');
            const response = await fetch(`${this.baseURL}list.php?a=list`);
            const data = await response.json();
            
            if (data.meals) {
                console.log(`✅ Loaded ${data.meals.length} cuisines`);
                return data.meals.map(area => area.strArea);
            }
            return [];
        } catch (error) {
            console.error('Error fetching areas:', error);
            return [];
        }
    },

    // Get recipes by area
    async getRecipesByArea(area) {
        try {
            console.log(`🔄 Fetching ${area} cuisine recipes...`);
            const response = await fetch(`${this.baseURL}filter.php?a=${area}`);
            const data = await response.json();
            
            if (data.meals) {
                const mealDetails = await Promise.all(
                    data.meals.slice(0, 12).map(meal => 
                        this.getRecipeById(meal.idMeal)
                    )
                );
                const validMeals = mealDetails.filter(meal => meal);
                console.log(`✅ Loaded ${validMeals.length} ${area} recipes`);
                return validMeals;
            }
            return [];
        } catch (error) {
            console.error('Error fetching recipes by area:', error);
            return [];
        }
    },

    // Format meal data to our recipe format
    formatMealData(meal) {
        // Extract ingredients and measurements
        const ingredients = [];
        for (let i = 1; i <= 20; i++) {
            const ingredient = meal[`strIngredient${i}`];
            const measure = meal[`strMeasure${i}`];
            
            if (ingredient && ingredient.trim()) {
                ingredients.push(`${measure ? measure + ' ' : ''}${ingredient}`.trim());
            }
        }

        // Format instructions
        let instructions = meal.strInstructions || '';
        // Split by new lines
        instructions = instructions.split('\n').filter(step => step.trim());
        
        // If no clear steps found, split by sentences
        if (instructions.length <= 1) {
            instructions = instructions[0]?.split(/\.(?=\s|$)/).filter(step => step.trim()) || [];
            instructions = instructions.map(step => step.trim() + '.');
        }

        // Check if StorageManager is available
        const isSaved = window.StorageManager && typeof window.StorageManager.isRecipeSaved === 'function' 
            ? window.StorageManager.isRecipeSaved(meal.idMeal) 
            : false;

        return {
            id: meal.idMeal,
            title: meal.strMeal,
            category: meal.strCategory || 'Unknown',
            area: meal.strArea || 'International',
            ingredients: ingredients,
            instructions: instructions,
            image: meal.strMealThumb,
            video: meal.strYoutube,
            tags: meal.strTags ? meal.strTags.split(',') : [],
            source: meal.strSource,
            isCustom: false,
            isSaved: isSaved
        };
    },

    // Remove duplicate recipes
    removeDuplicates(recipes) {
        const seen = new Set();
        return recipes.filter(recipe => {
            if (seen.has(recipe.idMeal)) {
                return false;
            }
            seen.add(recipe.idMeal);
            return true;
        });
    },

    // Get popular recipes
    async getPopularRecipes() {
        try {
            console.log('🔄 Loading popular recipes...');
            
            // Get random recipes
            const randomRecipes = await this.getRandomRecipes(8);
            
            // Get some from popular categories
            const popularCategories = ['Beef', 'Chicken', 'Dessert', 'Vegetarian'];
            const categoryPromises = popularCategories.map(cat => 
                this.getRecipesByCategory(cat)
            );
            
            const categoryResults = await Promise.all(categoryPromises);
            const categoryRecipes = categoryResults.flat().slice(0, 6);
            
            // Combine and remove duplicates
            const allRecipes = [...randomRecipes, ...categoryRecipes];
            const uniqueRecipes = this.removeDuplicatesById(allRecipes);
            
            console.log(`✅ Total popular recipes loaded: ${uniqueRecipes.length}`);
            return uniqueRecipes.slice(0, 12);
        } catch (error) {
            console.error('Error fetching popular recipes:', error);
            // Fallback to random recipes
            return this.getRandomRecipes(12);
        }
    },

    removeDuplicatesById(recipes) {
        const seen = new Set();
        return recipes.filter(recipe => {
            if (seen.has(recipe.id)) {
                return false;
            }
            seen.add(recipe.id);
            return true;
        });
    }
};