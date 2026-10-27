import { describe, it, expect } from 'vitest';

// Cart Action types and Reducer implementation for unit validation
const initialCartState = {
  restaurantId: null,
  items: [],
};

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { item, restaurantId } = action.payload;
      // Single restaurant cart constraint
      if (state.restaurantId && state.restaurantId !== restaurantId && state.items.length > 0) {
        throw new Error('RESTAURANT_CONFLICT');
      }

      const existingIndex = state.items.findIndex(
        (i) => i.id === item.id && i.variantId === item.variantId
      );

      let newItems;
      if (existingIndex > -1) {
        newItems = [...state.items];
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: newItems[existingIndex].quantity + (item.quantity || 1),
        };
      } else {
        newItems = [...state.items, { ...item, quantity: item.quantity || 1 }];
      }

      return {
        restaurantId,
        items: newItems,
      };
    }

    case 'REMOVE_ITEM': {
      const { id, variantId } = action.payload;
      const newItems = state.items
        .map((i) => {
          if (i.id === id && i.variantId === variantId) {
            return { ...i, quantity: i.quantity - 1 };
          }
          return i;
        })
        .filter((i) => i.quantity > 0);

      return {
        restaurantId: newItems.length === 0 ? null : state.restaurantId,
        items: newItems,
      };
    }

    case 'CLEAR_CART':
      return initialCartState;

    default:
      return state;
  }
}

describe('Cart Reducer Tests', () => {
  it('adds item to empty cart and sets restaurantId', () => {
    const item = { id: 101, name: 'Paneer Butter Masala', platformPrice: 280, variantId: null };
    const state = cartReducer(initialCartState, {
      type: 'ADD_ITEM',
      payload: { item, restaurantId: 1 },
    });

    expect(state.restaurantId).toBe(1);
    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(1);
  });

  it('increments quantity when adding same item and variant', () => {
    const item = { id: 101, name: 'Paneer Butter Masala', platformPrice: 280, variantId: null };
    let state = cartReducer(initialCartState, {
      type: 'ADD_ITEM',
      payload: { item, restaurantId: 1 },
    });
    state = cartReducer(state, {
      type: 'ADD_ITEM',
      payload: { item, restaurantId: 1 },
    });

    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(2);
  });

  it('throws RESTAURANT_CONFLICT when adding item from a different restaurant', () => {
    const item1 = { id: 101, name: 'Biryani', platformPrice: 340 };
    const item2 = { id: 201, name: 'Pizza', platformPrice: 450 };

    const state = cartReducer(initialCartState, {
      type: 'ADD_ITEM',
      payload: { item: item1, restaurantId: 1 },
    });

    expect(() => {
      cartReducer(state, {
        type: 'ADD_ITEM',
        payload: { item: item2, restaurantId: 2 },
      });
    }).toThrow('RESTAURANT_CONFLICT');
  });

  it('decrements item quantity and clears restaurantId when cart becomes empty', () => {
    const item = { id: 101, name: 'Biryani', platformPrice: 340, variantId: null };
    let state = cartReducer(initialCartState, {
      type: 'ADD_ITEM',
      payload: { item, restaurantId: 1 },
    });

    state = cartReducer(state, {
      type: 'REMOVE_ITEM',
      payload: { id: 101, variantId: null },
    });

    expect(state.items).toHaveLength(0);
    expect(state.restaurantId).toBeNull();
  });
});
