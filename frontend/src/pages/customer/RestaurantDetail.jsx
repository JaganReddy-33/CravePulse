import React from 'react';
import { useParams, useSearchParams, useOutletContext } from 'react-router-dom';
import RestaurantHeader from '../../components/restaurant/RestaurantHeader';
import RestaurantOffersStrip from '../../components/restaurant/RestaurantOffersStrip';
import RestaurantCategoryNav from '../../components/restaurant/RestaurantCategoryNav';
import DishCard from '../../components/restaurant/DishCard';
import ItemCustomizerModal from '../../components/restaurant/ItemCustomizerModal';
import RestaurantReviews from '../../components/restaurant/RestaurantReviews';
import LoadingState from '../../components/states/LoadingState';
import EmptyState from '../../components/states/EmptyState';
import ErrorState from '../../components/states/ErrorState';
import useRestaurantDetail from '../../hooks/useRestaurantDetail';

/**
 * RestaurantDetail: Focused container orchestrating restaurant banner, category scroll-spy,
 * live menu catalog, dish customization sheets, and reviews carousel.
 */
const RestaurantDetail = () => {
  const { id: routeId, slug } = useParams();
  const [searchParams] = useSearchParams();
  const outletCtx = useOutletContext();
  const openPriceExplainer = outletCtx?.openPriceExplainer;

  // Resolve restaurant ID from route params, query params, or slug rest suffix
  let restaurantId = searchParams.get('restaurant_id') || routeId;
  if (!restaurantId && slug) {
    const match = slug.match(/rest(\d+)/);
    if (match) restaurantId = match[1];
  }
  if (!restaurantId) restaurantId = '1';

  const {
    restaurant,
    categories,
    filteredItems,
    items,
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
  } = useRestaurantDetail(restaurantId);

  if (loading && !restaurant) {
    return (
      <div className="container py-5">
        <LoadingState message="Loading restaurant kitchen catalog..." />
      </div>
    );
  }

  if (error && !restaurant) {
    return (
      <div className="container py-5">
        <ErrorState
          title="Restaurant Not Available"
          message={typeof error === 'string' ? error : "We couldn't retrieve menu information for this outlet. It may be offline or undergoing maintenance."}
          actionText="Retry"
          onAction={() => window.location.reload()}
        />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="container py-5">
        <EmptyState
          icon="🍽️"
          title="Restaurant Not Found"
          description="The kitchen or outlet you are looking for could not be found."
          actionText="Go to Restaurants"
          onAction={() => window.location.href = '/'}
        />
      </div>
    );
  }

  const displayItems = filteredItems;

  return (
    <div className="container py-4 customer-content-container">
      {/* 1. Hero Header Banner with Breadcrumbs & 100% Price Parity Assurance */}
      <RestaurantHeader restaurant={restaurant} openPriceExplainer={openPriceExplainer} />

      {/* 2. Active Promotional Offers Carousel */}
      <RestaurantOffersStrip restaurantId={restaurant.id} />

      {/* 3. Sticky Category Navigation & Filters */}
      <RestaurantCategoryNav
        categories={categories}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        searchFilter={searchFilter}
        setSearchFilter={setSearchFilter}
        vegOnly={vegOnly}
        setVegOnly={setVegOnly}
      />

      {/* 4. Menu Items Grid */}
      {displayItems.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No dishes found"
          description={
            searchFilter
              ? `No dishes match "${searchFilter}". Try searching for biryani, curry, or bread.`
              : 'No items match your dietary preferences or category selection.'
          }
          actionText={searchFilter || vegOnly || activeCategory ? 'Reset Filters' : null}
          onAction={() => {
            setSearchFilter('');
            setVegOnly(false);
            setActiveCategory(null);
          }}
        />
      ) : (
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-2 g-3">
          {displayItems.map((dish) => (
            <div key={dish.id} className="col">
              <DishCard
                dish={dish}
                restaurantName={restaurant.name}
                onCustomize={openCustomizer}
                isStoreClosed={restaurant.isOpen === false}
              />
            </div>
          ))}
        </div>
      )}

      {/* 5. Verified Diner Reviews with Horizontal Carousel */}
      <RestaurantReviews
        restaurantId={restaurant.id}
        rating={restaurant.rating}
        totalReviews={restaurant.totalReviews}
      />

      {/* 6. Item Customization Modal */}
      <ItemCustomizerModal
        dish={customizingDish}
        restaurantName={restaurant.name}
        show={showCustomizer}
        onClose={closeCustomizer}
      />
    </div>
  );
};

export default RestaurantDetail;
