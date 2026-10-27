import React from 'react';

export const RestaurantCardSkeleton = () => (
  <div className="card border-0 rounded-4 shadow-sm p-3 mb-4" style={{ background: '#fff' }}>
    <div className="shimmer-skeleton rounded-4 mb-3" style={{ height: 180, width: '100%' }}></div>
    <div className="d-flex justify-content-between mb-2">
      <div className="shimmer-skeleton" style={{ height: 22, width: '60%' }}></div>
      <div className="shimmer-skeleton" style={{ height: 22, width: '15%' }}></div>
    </div>
    <div className="shimmer-skeleton mb-2" style={{ height: 16, width: '40%' }}></div>
    <div className="d-flex gap-2">
      <div className="shimmer-skeleton" style={{ height: 14, width: '30%' }}></div>
      <div className="shimmer-skeleton" style={{ height: 14, width: '25%' }}></div>
    </div>
  </div>
);

export const MenuItemSkeleton = () => (
  <div className="card border-0 rounded-4 shadow-sm p-3 mb-3 d-flex flex-row justify-content-between align-items-center" style={{ background: '#fff' }}>
    <div style={{ flex: 1, paddingRight: 16 }}>
      <div className="shimmer-skeleton mb-2" style={{ height: 20, width: '50%' }}></div>
      <div className="shimmer-skeleton mb-2" style={{ height: 16, width: '80%' }}></div>
      <div className="shimmer-skeleton" style={{ height: 18, width: '20%' }}></div>
    </div>
    <div className="shimmer-skeleton rounded-3" style={{ width: 100, height: 100 }}></div>
  </div>
);

export default RestaurantCardSkeleton;
