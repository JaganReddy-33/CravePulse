import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { getPreference } from "../../services/preferences";
import { RestaurantCardSkeleton } from "../../components/Skeleton";
import ScrollCarousel from "../../components/common/ScrollCarousel";
import ErrorState from "../../components/states/ErrorState";
import EmptyState from "../../components/states/EmptyState";
import Pagination from "../../components/common/Pagination";
import { DEFAULT_HUB } from "../../config/panIndiaLocations";

const RESTAURANT_PAGE_SIZE = 20;
const ALL_CATEGORY = {
  id: "all",
  name: "All",
};

const RestaurantCardImage = ({ src, name, closed, offer }) => {
  const [failed, setFailed] = useState(!src);

  return (
    <div
      className="restaurant-card-img-wrap"
      style={{ minHeight: 150, background: "#f3eee8" }}
    >
      {src && !failed ? (
        <img
          src={src}
          alt={name}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          style={closed ? { filter: "grayscale(70%)" } : undefined}
        />
      ) : (
        <div
          className="h-100 d-flex flex-column align-items-center justify-content-center gap-2 text-secondary"
          role="img"
          aria-label={`${name}: restaurant image unavailable`}
        >
          <i className="bi bi-shop-window fs-2" aria-hidden="true"></i>
          <span className="small">Image unavailable</span>
        </div>
      )}
      {!closed && offer && (
        <div
          className="restaurant-card-offer-overlay"
          aria-label={`Offer: ${offer}`}
        >
          <span aria-hidden="true">🏷️</span>
          <span>{offer}</span>
        </div>
      )}
      {closed && (
        <div
          className="position-absolute top-0 start-0 w-100 d-flex align-items-center justify-content-center p-2"
          style={{
            zIndex: 3,
            background: "rgba(25, 30, 35, 0.78)",
            color: "#fff",
            letterSpacing: ".06em",
          }}
        >
          <span className="small fw-bold">CLOSED</span>
        </div>
      )}
    </div>
  );
};

const CustomerHome = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [restaurants, setRestaurants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoriesError, setCategoriesError] = useState("");
  const [totalRestaurantCount, setTotalRestaurantCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(() => {
    const page = Number(searchParams.get("page"));
    return Number.isInteger(page) && page > 0 ? page : 1;
  });
  const lastUrlPage = useRef(searchParams.get("page") || "1");
  const restaurantRequestId = useRef(0);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  useEffect(() => {
    let active = true;
    setFavorites([]);
    if (user)
      api
        .get("/account/favorites")
        .then((res) => {
          if (active) setFavorites(res.data || []);
        })
        .catch(() => {});
    return () => {
      active = false;
    };
  }, [user?.id]);
  const toggleFavorite = async (e, restId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      window.alert("Sign in to save your favourite restaurants.");
      return;
    }
    try {
      const favorite = !favorites.includes(restId);
      await api.post("/account/favorites", { restaurantId: restId, favorite });
      setFavorites((prev) =>
        favorite
          ? [...new Set([...prev, restId])]
          : prev.filter((id) => id !== restId),
      );
    } catch (err) {
      window.alert(err.message);
    }
  };

  // Real-time URL query parameter bindings
  const [search, setSearch] = useState(
    () => searchParams.get("query") || searchParams.get("search") || "",
  );
  const [selectedCuisine, setSelectedCuisine] = useState(
    () => searchParams.get("cuisine") || "",
  );
  const [vegOnly, setVegOnly] = useState(
    () =>
      searchParams.get("veg_only") === "true" ||
      searchParams.get("veg") === "true",
  );
  const [minRating, setMinRating] = useState(() =>
    searchParams.get("rating") ? Number(searchParams.get("rating")) : null,
  );
  const [maxDeliveryTime, setMaxDeliveryTime] = useState(() =>
    searchParams.get("time") ? Number(searchParams.get("time")) : null,
  );
  const [selectedPriceTier, setSelectedPriceTier] = useState(
    () => searchParams.get("price") || "",
  );
  const [sortBy, setSortBy] = useState(
    () => searchParams.get("sort") || "relevance",
  );

  const [currentHub, setCurrentHub] = useState(() => {
    const saved = getPreference("hub");
    return saved || DEFAULT_HUB;
  });

  useEffect(() => {
    let active = true;
    api
      .get("/catalog/categories")
      .then((response) => {
        if (active && Array.isArray(response.data))
          setCategories(response.data);
      })
      .catch((error) => {
        if (active)
          setCategoriesError(
            error.message || "Cuisine filters are temporarily unavailable.",
          );
      });
    return () => {
      active = false;
    };
  }, []);

  // Sync state to URL search parameters
  useEffect(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("query", search.trim());
    if (selectedCuisine && selectedCuisine !== "All")
      params.set("cuisine", selectedCuisine);
    if (vegOnly) params.set("veg_only", "true");
    if (minRating) params.set("rating", String(minRating));
    if (maxDeliveryTime) params.set("time", String(maxDeliveryTime));
    if (selectedPriceTier) params.set("price", selectedPriceTier);
    if (sortBy && sortBy !== "relevance") params.set("sort", sortBy);
    if (currentPage > 1) params.set("page", String(currentPage));

    setSearchParams(params, { replace: true });
  }, [
    search,
    selectedCuisine,
    vegOnly,
    minRating,
    maxDeliveryTime,
    selectedPriceTier,
    sortBy,
    currentPage,
    setSearchParams,
  ]);

  useEffect(() => {
    const urlPage = searchParams.get("page") || "1";
    if (urlPage === lastUrlPage.current) return;
    lastUrlPage.current = urlPage;
    const page = Number(searchParams.get("page"));
    const nextPage = Number.isInteger(page) && page > 0 ? page : 1;
    setCurrentPage((current) => (current === nextPage ? current : nextPage));
  }, [searchParams]);

  useEffect(() => {
    const handleStorage = () => {
      const saved = getPreference("hub");
      setCurrentHub(saved || DEFAULT_HUB);
      setCurrentPage(1);
    };
    window.addEventListener("preferences-changed", handleStorage);
    return () =>
      window.removeEventListener("preferences-changed", handleStorage);
  }, []);

  const loadRestaurants = useCallback(async () => {
    const requestId = ++restaurantRequestId.current;
    setLoading(true);
    setFetchError(null);
    try {
      const params = {};
      if (currentHub?.coords) {
        params.lat = currentHub.coords[0];
        params.lng = currentHub.coords[1];
      }
      if (search) params.search = search;
      if (selectedCuisine && selectedCuisine !== "All")
        params.cuisine = selectedCuisine;
      if (vegOnly) params.vegOnly = true;
      if (minRating) params.rating = minRating;
      if (maxDeliveryTime) params.time = maxDeliveryTime;
      if (selectedPriceTier) params.price = selectedPriceTier;
      if (sortBy !== "relevance") params.sort = sortBy;
      params.limit = RESTAURANT_PAGE_SIZE;
      params.offset = (currentPage - 1) * RESTAURANT_PAGE_SIZE;

      const res = await api.get("/restaurants", { params });
      if (requestId !== restaurantRequestId.current) return;
      if (res.success && Array.isArray(res.data)) {
        setRestaurants(res.data);
        setTotalRestaurantCount(
          Number(res.pagination?.totalCount ?? params.offset + res.data.length),
        );
        setFetchError(null);
      } else {
        setFetchError(
          res.message || "Unable to load restaurants. Please try again.",
        );
      }
    } catch (e) {
      if (requestId !== restaurantRequestId.current) return;
      console.error("Error fetching restaurants from backend:", e);
      setFetchError(e.message || "Unable to connect to CravePulse servers.");
    } finally {
      if (requestId === restaurantRequestId.current) setLoading(false);
    }
  }, [
    search,
    selectedCuisine,
    vegOnly,
    minRating,
    maxDeliveryTime,
    selectedPriceTier,
    sortBy,
    currentHub,
    currentPage,
  ]);

  useEffect(() => {
    const timer = setTimeout(loadRestaurants, 200);
    return () => {
      clearTimeout(timer);
      restaurantRequestId.current += 1;
    };
  }, [loadRestaurants]);

  const filteredAndSortedRestaurants = restaurants;

  useEffect(() => {
    const totalPages = Math.max(
      1,
      Math.ceil(totalRestaurantCount / RESTAURANT_PAGE_SIZE),
    );
    if (!loading && currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, loading, totalRestaurantCount]);

  const activeFiltersCount = [
    vegOnly,
    minRating !== null,
    maxDeliveryTime !== null,
    selectedPriceTier !== "",
    selectedCuisine !== "" && selectedCuisine !== "All",
    search !== "",
  ].filter(Boolean).length;

  const handleResetFilters = () => {
    setSearch("");
    setSelectedCuisine("");
    setVegOnly(false);
    setMinRating(null);
    setMaxDeliveryTime(null);
    setSelectedPriceTier("");
    setSortBy("relevance");
    setCurrentPage(1);
    setSearchParams({}, { replace: true });
  };

  const handleRestaurantPageChange = (page) => {
    setLoading(true);
    setCurrentPage(page);
  };

  const featuredRestaurant = restaurants.find(
    (restaurant) => restaurant.bannerImage,
  );

  return (
    <div className="container-fluid px-3 px-md-4 py-3 customer-content-container">
      <div className="row g-4">
        {/* Left Sidebar Navigation (Desktop >= 992px) */}
        <div className="col-xl-2 col-lg-3 d-none d-lg-block">
          <div
            className="card border-0 rounded-4 shadow-sm p-3 bg-white sticky-top"
            style={{ top: 90 }}
          >
            <div className="list-group list-group-flush border-0">
              <Link
                to="/"
                className="list-group-item list-group-item-action border-0 rounded-3 py-2 fw-bold text-primary bg-primary-subtle d-flex align-items-center gap-2 mb-1"
              >
                <i className="bi bi-house-door-fill"></i> Home
              </Link>
              <a
                href="#restaurants-grid"
                className="list-group-item list-group-item-action border-0 rounded-3 py-2 text-secondary d-flex align-items-center gap-2 mb-1"
              >
                <i className="bi bi-shop"></i> Kitchens
              </a>
              <a
                href="#categories-section"
                className="list-group-item list-group-item-action border-0 rounded-3 py-2 text-secondary d-flex align-items-center gap-2 mb-1"
              >
                <i className="bi bi-grid-fill"></i> Categories
              </a>
              <Link
                to="/orders"
                className="list-group-item list-group-item-action border-0 rounded-3 py-2 text-secondary d-flex align-items-center gap-2 mb-1"
              >
                <i className="bi bi-receipt"></i> Orders
              </Link>
              <Link
                to="/offers"
                className="list-group-item list-group-item-action border-0 rounded-3 py-2 text-secondary d-flex align-items-center gap-2 mb-1"
              >
                <i className="bi bi-tag-fill text-danger"></i> Offers &amp;
                Deals
              </Link>
              <Link
                to="/help"
                className="list-group-item list-group-item-action border-0 rounded-3 py-2 text-secondary d-flex align-items-center gap-2 mb-1"
              >
                <i className="bi bi-question-circle-fill text-primary"></i> Help
                &amp; Support
              </Link>
              <Link
                to="/cities"
                className="list-group-item list-group-item-action border-0 rounded-3 py-2 text-secondary d-flex align-items-center gap-2"
              >
                <i className="bi bi-geo-alt-fill text-warning"></i> Delivery
                Cities
              </Link>
            </div>

            <div className="mt-4 p-3 rounded-4 bg-light border">
              <h6 className="fw-bold">Find your next favourite</h6>
              <p className="small text-muted">
                Browse menus and current offers from restaurants near you.
              </p>
              <Link
                to="/offers"
                className="btn btn-sm btn-outline-primary rounded-pill"
              >
                View available offers
              </Link>
            </div>
          </div>
        </div>

        {/* Main Center Content */}
        <div className="col-12 col-xl-10 col-lg-9">
          {/* Hero Banner with Radical Price Parity Assurance */}
          <div
            className="hero-banner-card card border-0 rounded-4 shadow-sm overflow-hidden mb-4 p-3 p-md-5 position-relative"
            style={{
              background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
              border: "1px solid #fed7aa",
            }}
          >
            <div className="row align-items-center">
              <div className="col-md-7 z-1">
                <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                  <span className="badge bg-light text-dark border rounded-pill px-3 py-2">
                    Explore local kitchens
                  </span>
                  <span className="badge bg-success rounded-pill px-3 py-2 fw-bold d-none d-sm-inline">
                    <i className="bi bi-patch-check-fill me-1"></i> 100% Price
                    Parity
                  </span>
                </div>
                <h1
                  className="display-6 fw-extrabold text-dark mb-2"
                  style={{ fontSize: "clamp(1.5rem, 3.2vw, 2.25rem)" }}
                >
                  Delicious food,{" "}
                  <span style={{ color: "var(--c-primary)" }}>
                    zero menu markups
                  </span>
                </h1>
                <p className="text-secondary mb-4" style={{ maxWidth: 440 }}>
                  Order from verified neighborhood kitchens at exact dining room
                  prices with guaranteed honest ETA tracking.
                </p>
                <div className="d-flex flex-wrap gap-2">
                  <a
                    href="#restaurants-grid"
                    className="btn btn-primary px-4 py-2 rounded-pill fw-bold shadow-sm transition hover-lift"
                    style={{
                      background: "var(--c-primary)",
                      borderColor: "var(--c-primary)",
                    }}
                  >
                    Order Now →
                  </a>
                  <button
                    className="btn btn-outline-dark px-4 py-2 rounded-pill fw-semibold bg-white text-black transition hover-lift"
                    onClick={handleResetFilters}
                  >
                    Explore All ({restaurants.length})
                  </button>
                </div>
              </div>
              <div className="col-md-5 text-center mt-3 mt-md-0">
                <img
                  src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600"
                  alt="Plated Food Banner"
                  className="img-fluid rounded-4 shadow-lg object-fit-cover"
                  style={{ maxHeight: 220, width: "100%" }}
                  loading="lazy"
                />
              </div>
            </div>
          </div>

          <div className="mb-4" id="categories-section">
            <ScrollCarousel
              ariaLabel="Cuisine categories"
              sectionHeader={
                <div>
                  <h5
                    className="fw-bold mb-0"
                    style={{ fontSize: "clamp(1.1rem, 2vw, 1.3rem)" }}
                  >
                    What's on your mind?
                  </h5>
                  <small className="text-muted">Browse by cuisine</small>
                </div>
              }
            >
              {[ALL_CATEGORY, ...categories].map((cat) => {
                const isActive =
                  selectedCuisine === cat.name ||
                  (!selectedCuisine && cat.name === "All");
                return (
                  <button
                    key={cat.id}
                    type="button"
                    className={`cuisine-filter-button flex-shrink-0 transition ${isActive ? "active" : ""}`}
                    onClick={() => {
                      setSelectedCuisine(cat.name === "All" ? "" : cat.name);
                      setCurrentPage(1);
                    }}
                    aria-label={`Select ${cat.name} cuisine`}
                    aria-pressed={isActive}
                  >
                    {cat.imageUrl ? (
                      <img
                        className="cuisine-filter-image"
                        src={cat.imageUrl}
                        alt=""
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.hidden = true;
                        }}
                      />
                    ) : (
                      <span
                        className="cuisine-filter-image d-flex align-items-center justify-content-center"
                        aria-hidden="true"
                      >
                        <i className="bi bi-grid"></i>
                      </span>
                    )}
                    <span className="fw-semibold small text-dark w-100 text-truncate">
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </ScrollCarousel>
            {categoriesError && (
              <p className="small text-warning mt-2 mb-0" role="status">
                {categoriesError}
              </p>
            )}
          </div>

          {/* Dynamic Filter Controls Bar */}
          <div className="card border-0 rounded-4 shadow-sm p-3 mb-4 bg-white">
            <div className="filter-sort-row d-flex flex-wrap align-items-center justify-content-between gap-2">
              {/* Left Filters Group */}
              <div className="filter-bar-pills d-flex flex-wrap align-items-center gap-2">
                {/* Pure Veg Switch */}
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill px-3 py-1 fw-bold d-flex align-items-center gap-1 border ${vegOnly ? "btn-success text-white" : "btn-light text-success"}`}
                  onClick={() => {
                    setVegOnly(!vegOnly);
                    setCurrentPage(1);
                  }}
                >
                  <span>🟢</span> Pure Veg
                </button>

                {/* Rating 4.5+ Filter */}
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill px-3 py-1 fw-semibold border ${minRating === 4.5 ? "btn-warning text-dark fw-bold" : "btn-light text-secondary"}`}
                  onClick={() => {
                    setMinRating(minRating === 4.5 ? null : 4.5);
                    setCurrentPage(1);
                  }}
                >
                  <i className="bi bi-star-fill text-warning me-1"></i> 4.5+
                  Rating
                </button>

                {/* Delivery Time < 30m Filter */}
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill px-3 py-1 fw-semibold border ${maxDeliveryTime === 30 ? "btn-info text-dark fw-bold" : "btn-light text-secondary"}`}
                  onClick={() => {
                    setMaxDeliveryTime(maxDeliveryTime === 30 ? null : 30);
                    setCurrentPage(1);
                  }}
                >
                  <i className="bi bi-stopwatch me-1"></i> Fast Delivery
                  (&lt;30m)
                </button>

                {/* Price Tier Filter */}
                <div className="dropdown">
                  <button
                    className={`btn btn-sm rounded-pill px-3 py-1 fw-semibold border dropdown-toggle ${selectedPriceTier ? "btn-primary text-white" : "btn-light text-secondary"}`}
                    type="button"
                    data-bs-toggle="dropdown"
                  >
                    <i className="bi bi-cash me-1"></i>{" "}
                    {selectedPriceTier
                      ? `Price: ${selectedPriceTier}`
                      : "Price Range"}
                  </button>
                  {/* Updated with Rupee Tiers */}
                  <ul className="dropdown-menu shadow border-0 rounded-3 p-1">
                    <li>
                      <button
                        className="dropdown-item rounded-2 small"
                        onClick={() => {
                          setSelectedPriceTier("");
                          setCurrentPage(1);
                        }}
                      >
                        All Prices
                      </button>
                    </li>
                    <li>
                      <button
                        className="dropdown-item rounded-2 small"
                        onClick={() => {
                          setSelectedPriceTier("BUDGET");
                          setCurrentPage(1);
                        }}
                      >
                        Budget (Under ₹400 for two)
                      </button>
                    </li>
                    <li>
                      <button
                        className="dropdown-item rounded-2 small"
                        onClick={() => {
                          setSelectedPriceTier("MID");
                          setCurrentPage(1);
                        }}
                      >
                        Mid-range (₹400 - ₹1000)
                      </button>
                    </li>
                    <li>
                      <button
                        className="dropdown-item rounded-2 small"
                        onClick={() => {
                          setSelectedPriceTier("PREMIUM");
                          setCurrentPage(1);
                        }}
                      >
                        Premium (₹1000+)
                      </button>
                    </li>
                  </ul>
                </div>

                {/* Reset Filters Pill */}
                {activeFiltersCount > 0 && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger rounded-pill px-3 py-1 small fw-bold"
                    onClick={handleResetFilters}
                  >
                    Reset All ({activeFiltersCount}) ✕
                  </button>
                )}
              </div>

              {/* Right Sort By Dropdown */}
              <div className="sort-group d-flex align-items-center gap-2">
                <span className="small text-muted fw-semibold d-none d-sm-inline">
                  Sort by:
                </span>
                <select
                  className="form-select form-select-sm rounded-pill border shadow-none"
                  style={{ minWidth: 160 }}
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setCurrentPage(1);
                  }}
                  aria-label="Sort restaurants by"
                >
                  <option value="relevance">Relevance &amp; Distance</option>
                  <option value="rating">Rating: High to Low</option>
                  <option value="time">Delivery Time: Fast First</option>
                  <option value="costAsc">Price: Low to High</option>
                  <option value="costDesc">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Kitchens & Restaurants Section */}
          <div id="restaurants-grid">
            <div className="cp-discovery-heading d-flex justify-content-between align-items-center mb-3">
              <div className="d-flex align-items-start gap-3">
                <span className="cp-pulse-mark" aria-hidden="true">
                  <svg
                    viewBox="0 0 32 32"
                    focusable="false"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M16 3C12.8 7 10 10.1 10 14.4c0 3.5 2.6 6.2 6 6.2s6-2.7 6-6.2C22 10.1 19.2 7 16 3Z"
                      fill="currentColor"
                      opacity=".9"
                    />
                    <path
                      d="M4 25h6l3-5 4 7 3-5h8"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <div>
                  <div className="cp-discovery-kicker">
                    CravePulse · Local tables
                  </div>
                  <h5
                    className="fw-bold mb-1"
                    style={{ fontSize: "clamp(1.15rem, 2vw, 1.4rem)" }}
                  >
                    {currentHub?.id && currentHub.id !== "unselected"
                      ? `Restaurants in ${currentHub.cityName || currentHub.name}`
                      : "Explore restaurants"}
                  </h5>
                  <p className="text-muted small mb-0">
                    100% Dine-In Menu Price Parity • Zero Delivery Markups
                  </p>
                </div>
              </div>
              <span className="badge bg-light text-dark border px-3 py-2 rounded-pill small">
                {totalRestaurantCount} places
              </span>
            </div>

            {fetchError && !loading && (
              <ErrorState
                title="Could not connect to CravePulse"
                message={
                  restaurants.length > 0
                    ? `${fetchError} Previously loaded restaurants remain visible.`
                    : fetchError
                }
                onRetry={loadRestaurants}
              />
            )}

            {loading ? (
              <div className="restaurant-card-grid">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <RestaurantCardSkeleton key={n} />
                ))}
              </div>
            ) : fetchError &&
              filteredAndSortedRestaurants.length ===
                0 ? null : filteredAndSortedRestaurants.length === 0 ? (
              <EmptyState
                icon="🔍"
                title="No restaurants match your filters"
                description="Try loosening your dietary filters, price tiers, or search term."
                actionText="Reset All Filters"
                onAction={handleResetFilters}
              />
            ) : (
              <div className="restaurant-card-grid">
                {filteredAndSortedRestaurants.map((rest) => {
                  const queryParam = search.trim()
                    ? `&query=${encodeURIComponent(search.trim())}`
                    : "";
                  const restaurantUrl = `/restaurant/${encodeURIComponent(rest.id)}?source=collection${queryParam}`;

                  const isFav = favorites.includes(rest.id);
                  const isClosed = rest.isOpen === false;
                  const discountOffer =
                    typeof rest.discountTag === "string"
                      ? rest.discountTag.trim()
                      : "";
                  const reviewCount = Number(rest.totalReviews);
                  const rating = Number(rest.rating);
                  const hasRating =
                    reviewCount > 0 &&
                    rest.rating != null &&
                    rest.rating !== "" &&
                    Number.isFinite(rating);
                  const deliveryMinValue =
                    rest.deliveryTimeMin ??
                    rest.etaMinMinutes ??
                    rest.estimatedDeliveryMin ??
                    rest.deliveryTimeMinutes;
                  const deliveryMaxValue =
                    rest.deliveryTimeMax ??
                    rest.etaMaxMinutes ??
                    rest.estimatedDeliveryMax ??
                    deliveryMinValue;
                  const deliveryMin = Number(deliveryMinValue);
                  const deliveryMax = Number(deliveryMaxValue);
                  const hasDeliveryTime =
                    deliveryMinValue != null &&
                    deliveryMinValue !== "" &&
                    Number.isFinite(deliveryMin) &&
                    deliveryMin > 0;
                  const deliveryLabel = hasDeliveryTime
                    ? `Delivery ${deliveryMin}${Number.isFinite(deliveryMax) && deliveryMax >= deliveryMin ? `–${deliveryMax}` : ""} min`
                    : null;
                  const prepMin = Number(rest.prepTimeMin);
                  const prepMax = Number(rest.prepTimeMax);
                  const hasPrepMin =
                    rest.prepTimeMin != null &&
                    rest.prepTimeMin !== "" &&
                    Number.isFinite(prepMin) &&
                    prepMin > 0;
                  const hasPrepMax =
                    rest.prepTimeMax != null &&
                    rest.prepTimeMax !== "" &&
                    Number.isFinite(prepMax) &&
                    prepMax > 0;
                  const prepLabel = !deliveryLabel && hasPrepMin
                    ? `Prep ${prepMin}${hasPrepMax && prepMax >= prepMin ? `–${prepMax}` : ""} min`
                    : null;
                  const locationLabel =
                    rest.locality ||
                    rest.localityName ||
                    rest.street ||
                    (typeof rest.address === "string"
                      ? rest.address.split(",")[0].trim()
                      : "");
                  const cuisines = Array.isArray(rest.cuisineTypes)
                    ? rest.cuisineTypes.join(" · ")
                    : rest.cuisineTypes;

                  return (
                    <div
                      key={rest.id}
                      className="restaurant-card position-relative"
                    >
                      <Link
                        to={restaurantUrl}
                        className="text-decoration-none d-block h-100"
                        aria-label={`View ${rest.name} menu`}
                      >
                        <div
                          className={`card border-0 rounded-4 shadow-sm overflow-hidden h-100 bg-white transition hover-lift ${isClosed ? "opacity-75" : ""}`}
                        >
                          <RestaurantCardImage
                            src={rest.bannerImage}
                            name={rest.name}
                            closed={isClosed}
                            offer={discountOffer}
                          />

                          <div className="card-body p-3 d-flex flex-column gap-2">
                            <div className="d-flex justify-content-between align-items-start gap-2">
                              <div className="min-w-0">
                                <h6
                                  className="fw-bold text-dark mb-1"
                                  style={{
                                    fontSize: "clamp(1rem, 1.7vw, 1.125rem)",
                                    lineHeight: 1.25,
                                    overflowWrap: "anywhere",
                                  }}
                                >
                                  {rest.name}
                                </h6>
                                {cuisines && (
                                  <p
                                    className="text-secondary small mb-0"
                                    style={{
                                      display: "-webkit-box",
                                      WebkitBoxOrient: "vertical",
                                      WebkitLineClamp: 2,
                                      overflow: "hidden",
                                    }}
                                  >
                                    {cuisines}
                                  </p>
                                )}
                              </div>
                              {hasRating ? (
                                <span
                                  className="rating-pill-green flex-shrink-0"
                                  aria-label={`${rating.toFixed(1)} out of 5 from ${reviewCount} reviews`}
                                >
                                  <span aria-hidden="true">★</span>{" "}
                                  {rating.toFixed(1)}{" "}
                                  <small className="fw-normal">
                                    ({reviewCount})
                                  </small>
                                </span>
                              ) : null}
                            </div>

                            <div
                              className="d-flex flex-wrap align-items-center gap-x-3 gap-y-1 text-secondary small"
                              aria-label="Restaurant details"
                              style={{
                                minHeight: "1.5rem",
                                gap: ".4rem .8rem",
                              }}
                            >
                              {(deliveryLabel || prepLabel) && (
                                <span className="d-inline-flex align-items-center gap-1">
                                  <i
                                    className="bi bi-clock"
                                    aria-hidden="true"
                                  ></i>
                                  {deliveryLabel || prepLabel}
                                </span>
                              )}
                            </div>

                            <div className="d-flex align-items-center gap-2 flex-wrap mt-auto pt-2 border-top">
                              {locationLabel && (
                                <span className="text-secondary small d-inline-flex align-items-center gap-1">
                                  <i
                                    className="bi bi-geo-alt"
                                    aria-hidden="true"
                                  ></i>
                                  {locationLabel}
                                </span>
                              )}
                              {rest.pureVeg === true && (
                                <span className="badge bg-success-subtle text-success border border-success-subtle">
                                  Pure vegetarian
                                </span>
                              )}
                              {rest.isAutoThrottled === true && (
                                <span className="badge bg-warning-subtle text-dark border border-warning-subtle">
                                  Busy
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>

                      {/* Favourite Heart Button */}
                      <button
                        type="button"
                        className={`restaurant-fav-btn ${isFav ? "active" : ""}`}
                        onClick={(e) => toggleFavorite(e, rest.id)}
                        aria-label={
                          isFav
                            ? `Remove ${rest.name} from favorites`
                            : `Add ${rest.name} to favorites`
                        }
                      >
                        <i
                          className={`bi ${isFav ? "bi-heart-fill text-danger" : "bi-heart"}`}
                        ></i>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            {totalRestaurantCount > 0 && (
              <Pagination
                currentPage={currentPage}
                pageSize={RESTAURANT_PAGE_SIZE}
                totalCount={totalRestaurantCount}
                itemLabel={
                  totalRestaurantCount === 1 ? "restaurant" : "restaurants"
                }
                onPageChange={handleRestaurantPageChange}
                isLoading={loading}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerHome;
