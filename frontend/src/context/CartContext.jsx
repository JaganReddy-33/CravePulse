import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
  useRef,
} from "react";
import api from "../services/api";
import { useAuth } from "./AuthContext";
import { isValidBillQuote } from "../utils/address";

const CartContext = createContext(null);

const cartReducer = (state, action) => {
  switch (action.type) {
    case "ADD_ITEM": {
      const {
        restaurantId,
        restaurantName,
        item,
        variant,
        addons = [],
        specialInstructions = "",
      } = action.payload;

      // Single-restaurant cart validation
      if (
        state.restaurantId &&
        state.restaurantId !== restaurantId &&
        state.items.length > 0
      ) {
        if (
          !window.confirm(
            `Your cart already contains dishes from "${state.restaurantName}". Would you like to clear your cart and start a new order from "${restaurantName}"?`,
          )
        ) {
          return state;
        }
        const cartKey = `${item.id}-${variant?.id || "base"}-${addons
          .map((a) => a.id)
          .sort()
          .join(",")}-${specialInstructions || ""}`;
        return {
          restaurantId,
          restaurantName,
          items: [
            {
              ...item,
              selectedVariant: variant,
              selectedAddons: addons,
              specialInstructions,
              quantity: 1,
              cartKey,
            },
          ],
        };
      }

      const cartKey = `${item.id}-${variant?.id || "base"}-${addons
        .map((a) => a.id)
        .sort()
        .join(",")}-${specialInstructions || ""}`;
      const existingIdx = state.items.findIndex((i) => i.cartKey === cartKey);

      let newItems = [];
      if (existingIdx >= 0) {
        newItems = state.items.map((it, idx) =>
          idx === existingIdx ? { ...it, quantity: it.quantity + 1 } : it,
        );
      } else {
        newItems = [
          ...state.items,
          {
            ...item,
            selectedVariant: variant,
            selectedAddons: addons,
            specialInstructions,
            quantity: 1,
            cartKey,
          },
        ];
      }

      return {
        restaurantId,
        restaurantName: restaurantName || state.restaurantName,
        items: newItems,
      };
    }

    case "REMOVE_ITEM": {
      const { cartKey } = action.payload;
      const existing = state.items.find((i) => i.cartKey === cartKey);
      if (!existing) return state;

      let newItems = [];
      if (existing.quantity > 1) {
        newItems = state.items.map((i) =>
          i.cartKey === cartKey ? { ...i, quantity: i.quantity - 1 } : i,
        );
      } else {
        newItems = state.items.filter((i) => i.cartKey !== cartKey);
      }

      return {
        ...state,
        restaurantId: newItems.length === 0 ? null : state.restaurantId,
        restaurantName: newItems.length === 0 ? null : state.restaurantName,
        items: newItems,
      };
    }

    case "CLEAR_CART":
      return { restaurantId: null, restaurantName: null, items: [] };

    case "SET_CART":
      return {
        restaurantId: action.payload.restaurantId || null,
        restaurantName: action.payload.restaurantName || null,
        items: action.payload.items || [],
      };

    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const emptyCart = { restaurantId: null, restaurantName: null, items: [] };
  const [state, dispatch] = useReducer(cartReducer, emptyCart);
  const [hydratedFor, setHydratedFor] = useState(null);
  const saveQueue = useRef(Promise.resolve());
  useEffect(() => {
    let active = true;
    setHydratedFor(null);
    setCouponCode("");
    setRiderTip(0);
    dispatch({ type: "SET_CART", payload: emptyCart });
    if (!user) return;
    api
      .get("/account/cart")
      .then((res) => {
        if (active) {
          dispatch({ type: "SET_CART", payload: res.data || emptyCart });
          setHydratedFor(user.id);
        }
      })
      .catch((err) => {
        if (active) setCouponError(err.message);
      });
    return () => {
      active = false;
    };
  }, [user?.id]);
  useEffect(() => {
    if (!user || hydratedFor !== user.id) return;
    // Serialize updates so a slower earlier save cannot overwrite the latest cart.
    saveQueue.current = saveQueue.current
      .catch(() => {})
      .then(() => api.put("/account/cart", state))
      .catch((err) => setCouponError(`Cart not saved: ${err.message}`));
  }, [state, user?.id, hydratedFor]);

  const [deliveryCoordinates, setDeliveryCoordinates] = useState(null);
  const [deliveryAddressId, setDeliveryAddressId] = useState(null);
  const [checkoutQuoteEnabled, setCheckoutQuoteEnabled] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [riderTip, setRiderTip] = useState(0);
  const [billDetails, setBillDetails] = useState(null);
  const [billQuoteKey, setBillQuoteKey] = useState(null);
  const [billQuoteAddressId, setBillQuoteAddressId] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [couponError, setCouponError] = useState("");

  const currentBillQuoteKey = JSON.stringify({
    restaurantId: state.restaurantId,
    items: state.items.map((it) => ({
      menuItemId: it.id,
      quantity: it.quantity,
      variantId: it.selectedVariant?.id || null,
      addonIds: it.selectedAddons?.map((a) => a.id) || [],
    })),
    couponCode: couponCode ? couponCode.trim().toUpperCase() : null,
    tipAmount: riderTip || 0,
    deliveryAddressId,
    latitude: deliveryCoordinates?.latitude ?? null,
    longitude: deliveryCoordinates?.longitude ?? null,
  });

  useEffect(() => {
    let active = true;

    const recalculateBill = async () => {
      if (!checkoutQuoteEnabled) {
        setBillDetails(null);
        setBillQuoteKey(null);
        setBillQuoteAddressId(null);
        setCouponError("");
        setCalculating(false);
        return;
      }

      if (!state.restaurantId || state.items.length === 0) {
        setBillDetails(null);
        setBillQuoteKey(null);
        setBillQuoteAddressId(null);
        setCouponError("");
        setCalculating(false);
        return;
      }

      setBillDetails(null);
      setBillQuoteKey(null);
      setBillQuoteAddressId(null);
      if (!deliveryCoordinates) {
        setCalculating(false);
        setCouponError("");
        return;
      }
      setCouponError("");
      setCalculating(true);
      try {
        const payload = {
          restaurantId: state.restaurantId,
          userLat: deliveryCoordinates.latitude,
          userLng: deliveryCoordinates.longitude,
          items: state.items.map((it) => ({
            menuItemId: it.id,
            quantity: it.quantity,
            variantId: it.selectedVariant?.id || null,
            addonIds: it.selectedAddons?.map((a) => a.id) || [],
          })),
          couponCode: couponCode ? couponCode.trim().toUpperCase() : null,
          tipAmount: riderTip || 0,
        };
        const res = await api.post("/cart/calculate", payload);
        if (!res.success || !isValidBillQuote(res.data)) {
          throw new Error(
            res.message ||
              "The server did not return a valid price quote. Please try again.",
          );
        }
        if (active) {
          setBillDetails(res.data);
          setBillQuoteKey(currentBillQuoteKey);
          setBillQuoteAddressId(deliveryAddressId);
        }
      } catch (e) {
        if (active) {
          setBillDetails(null);
          setBillQuoteKey(null);
          setBillQuoteAddressId(null);
          setCouponError(e.message || "Unable to calculate price");
        }
      } finally {
        if (active) setCalculating(false);
      }
    };

    recalculateBill();
    return () => {
      active = false;
    };
  }, [
    checkoutQuoteEnabled,
    state,
    couponCode,
    riderTip,
    deliveryAddressId,
    deliveryCoordinates,
    currentBillQuoteKey,
  ]);

  const applyCoupon = (code) => {
    setCouponError("");
    setCouponCode(code);
  };

  const addItem = (payload) => dispatch({ type: "ADD_ITEM", payload });
  const removeItem = (cartKey) =>
    dispatch({ type: "REMOVE_ITEM", payload: { cartKey } });
  const clearCart = () => dispatch({ type: "CLEAR_CART" });
  const setCart = (payload) => dispatch({ type: "SET_CART", payload });

  const totalItemCount = state.items.reduce((sum, it) => sum + it.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart: state,
        setDeliveryCoordinates,
        setDeliveryAddressId,
        setCheckoutQuoteEnabled,
        billDetails,
        billQuoteAddressId,
        billQuoteFresh:
          checkoutQuoteEnabled &&
          isValidBillQuote(billDetails) &&
          billQuoteKey === currentBillQuoteKey,
        calculating,
        couponCode,
        couponError,
        setCouponCode: applyCoupon,
        riderTip,
        setRiderTip,
        addItem,
        removeItem,
        clearCart,
        setCart,
        totalItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
export default CartContext;
