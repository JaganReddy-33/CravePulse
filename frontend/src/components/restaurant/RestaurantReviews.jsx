import React, { useState } from 'react';

/**
 * RestaurantReviews: Verified customer reviews section with multi-criteria sort.
 */
const RestaurantReviews = ({ reviews = [], rating = '4.8', totalReviews = 1420 }) => {
  const [reviewSort, setReviewSort] = useState('recent');

  const defaultReviews = [
    {
      id: 1,
      customerName: 'Ananya Sharma',
      rating: 5,
      date: '2 days ago',
      comment: 'Absolutely authentic! The dum biryani was piping hot, fragrant, and 100% dine-in price verified on the bill!',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    },
    {
      id: 2,
      customerName: 'Vikram Mehta',
      rating: 5,
      date: '5 days ago',
      comment: 'Super fast delivery. Dal Makhani had that rich charcoal smoky flavor. CravePulse zero inflation is a breath of fresh air.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    },
    {
      id: 3,
      customerName: 'Priya Sundaram',
      rating: 4,
      date: '1 week ago',
      comment: 'Generous portions, crisp garlic naan and very courteous delivery captain. Highly recommend!',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    },
  ];

  const activeReviews = reviews.length > 0 ? reviews : defaultReviews;

  const sortedReviews = [...activeReviews].sort((a, b) => {
    if (reviewSort === 'highest') return b.rating - a.rating;
    if (reviewSort === 'lowest') return a.rating - b.rating;
    return b.id - a.id;
  });

  return (
    <div className="card border-0 rounded-4 shadow-sm p-4 bg-white mt-5">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <div>
          <h4 className="fw-extrabold text-dark mb-1">Customer Reviews & Ratings</h4>
          <div className="d-flex align-items-center gap-2 small text-muted">
            <span className="badge bg-success px-2 py-1">★ {rating}</span>
            <span>Based on {totalReviews}+ verified diner orders</span>
          </div>
        </div>

        {/* Multi-Criteria Sort Selector */}
        <div className="d-flex align-items-center gap-2">
          <label htmlFor="reviewSortSelect" className="small text-muted fw-bold text-nowrap">
            Sort by:
          </label>
          <select
            id="reviewSortSelect"
            className="form-select form-select-sm rounded-pill border"
            value={reviewSort}
            onChange={(e) => setReviewSort(e.target.value)}
          >
            <option value="recent">Most Recent</option>
            <option value="highest">Highest Rated</option>
            <option value="lowest">Lowest Rated</option>
          </select>
        </div>
      </div>

      {/* Review List */}
      <div className="d-flex flex-column gap-3">
        {sortedReviews.map((rev) => (
          <div key={rev.id} className="p-3 bg-light rounded-4 border border-light">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="d-flex align-items-center gap-2">
                <img
                  src={rev.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                  alt={rev.customerName}
                  className="rounded-circle object-fit-cover shadow-xs"
                  style={{ width: 34, height: 34 }}
                />
                <div>
                  <strong className="d-block small text-dark">{rev.customerName}</strong>
                  <small className="text-muted" style={{ fontSize: 11 }}>{rev.date}</small>
                </div>
              </div>
              <div className="text-warning small">
                {'★'.repeat(rev.rating)}
                {'☆'.repeat(5 - rev.rating)}
              </div>
            </div>
            <p className="small text-secondary mb-0">{rev.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RestaurantReviews;
