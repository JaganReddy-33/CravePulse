import { useState, useEffect } from 'react';
import api from '../services/api';

/**
 * Custom hook managing restaurant catalog data, menu filtering, and customizer modal state.
 */
export function useRestaurantDetail(restaurantId) {
  const [restaurant, setRestaurant] = useState(null);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeCategory, setActiveCategory] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [vegOnly, setVegOnly] = useState(false);

  const [customizingDish, setCustomizingDish] = useState(null);
  const [showCustomizer, setShowCustomizer] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const fetchRestaurantData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch details from backend API
        const restRes = await api.get(`/restaurants/${restaurantId}`);
        if (!isCancelled && restRes.success && restRes.data) {
          setRestaurant(restRes.data);
        }

        // Fetch menu items from backend API
        const menuRes = await api.get(`/menu/restaurant/${restaurantId}`);
        if (!isCancelled && menuRes.success && menuRes.data) {
          const menuItems = Array.isArray(menuRes.data) ? menuRes.data : menuRes.data.items || [];
          setItems(menuItems);

          // Extract distinct categories
          const catMap = new Map();
          menuItems.forEach((it) => {
            if (it.categoryId && !catMap.has(it.categoryId)) {
              catMap.set(it.categoryId, {
                id: it.categoryId,
                name: it.categoryName || `Category ${it.categoryId}`,
              });
            }
          });
          setCategories(Array.isArray(menuRes.data.categories) ? menuRes.data.categories : Array.from(catMap.values()));
        }
      } catch (err) {
        if (!isCancelled) {
          console.warn('API error fetching restaurant, applying fallback:', err);
          setError(err.message || 'Failed to load restaurant');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    if (restaurantId) {
      fetchRestaurantData();
    }

    return () => {
      isCancelled = true;
    };
  }, [restaurantId]);

  // Filter items based on active category, veg switch, and search query
  const filteredItems = items.filter((it) => {
    if (activeCategory && it.categoryId !== activeCategory) return false;
    if (vegOnly && !it.veg && !it.isVeg) return false;
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const nameMatch = it.name?.toLowerCase().includes(q);
      const descMatch = it.description?.toLowerCase().includes(q);
      if (!nameMatch && !descMatch) return false;
    }
    return true;
  });

  const openCustomizer = (dish) => {
    setCustomizingDish(dish);
    setShowCustomizer(true);
  };

  const closeCustomizer = () => {
    setCustomizingDish(null);
    setShowCustomizer(false);
  };

  return {
    restaurant,
    categories,
    items,
    filteredItems,
    loading,
    error,
    activeCategory,
    setActiveCategory,
    searchFilter,
    setSearchFilter,
    vegOnly,
    setVegOnly,
    customizingDish,
    showCustomizer,
    openCustomizer,
    closeCustomizer,
  };
}

export default useRestaurantDetail;
