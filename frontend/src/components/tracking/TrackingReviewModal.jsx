import React, { useState } from 'react';
import ModalPortal from '../ModalPortal';

/**
 * TrackingReviewModal: Post-delivery multi-criteria review form (food, packaging, delivery).
 */
const TrackingReviewModal = ({
  show,
  onClose,
  onSubmitReview,
  restaurantName,
}) => {
  const [foodRating, setFoodRating] = useState(5);
  const [packagingRating, setPackagingRating] = useState(5);
  const [deliveryRating, setDeliveryRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!show) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await onSubmitReview({
      foodRating,
      packagingRating,
      deliveryRating,
      reviewText: reviewText.trim(),
    });
    setSubmitting(false);
    onClose();
  };

  const renderStarInput = (val, setVal, label) => (
    <div className="d-flex justify-content-between align-items-center mb-2">
      <span className="small fw-semibold text-dark">{label}</span>
      <div className="d-flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="btn btn-link p-0 text-decoration-none touch-target"
            style={{ width: 32, height: 32 }}
            onClick={() => setVal(star)}
            aria-label={`${star} stars for ${label}`}
          >
            <i
              className={`bi ${star <= val ? 'bi-star-fill text-warning' : 'bi-star text-muted'} fs-5`}
            ></i>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <ModalPortal isOpen={show}>
      <div 
        className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center p-3"
        style={{ zIndex: 10050, backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      >
        <div 
          className="bg-white rounded-4 shadow-2xl p-4 w-100 animate-slide-left"
          style={{ maxWidth: 460 }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="review-title"
        >
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-extrabold text-dark mb-0" id="review-title">
              Rate Your Experience
            </h5>
            <button type="button" className="btn-close touch-target" onClick={onClose} aria-label="Close dialog"></button>
          </div>

          <p className="text-muted small mb-3">
            Help other food lovers find the best meals from <strong>{restaurantName}</strong>.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="p-3 bg-light rounded-4 mb-3">
              {renderStarInput(foodRating, setFoodRating, 'Food Taste & Freshness')}
              {renderStarInput(packagingRating, setPackagingRating, 'Packaging & Spill Protection')}
              {renderStarInput(deliveryRating, setDeliveryRating, 'Delivery Partner Speed & Courteousness')}
            </div>

            <div className="mb-3">
              <label htmlFor="reviewFeedbackText" className="form-label small fw-bold">Comments & Feedback</label>
              <textarea
                id="reviewFeedbackText"
                className="form-control rounded-3"
                rows={3}
                placeholder="What did you love about this meal?"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
              ></textarea>
            </div>

            <div className="d-flex justify-content-end gap-2 pt-2 border-top">
              <button
                type="button"
                className="btn btn-sm btn-light border rounded-pill px-3 touch-target"
                onClick={onClose}
              >
                Skip
              </button>
              <button
                type="submit"
                className="btn btn-sm btn-primary rounded-pill px-4 fw-bold touch-target text-white"
                style={{ background: '#ff5722', borderColor: '#ff5722' }}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
};

export default TrackingReviewModal;
