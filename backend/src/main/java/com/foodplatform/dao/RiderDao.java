package com.foodplatform.dao;

import com.foodplatform.model.DeliveryDispatch;
import com.foodplatform.model.RiderProfile;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.List;

public interface RiderDao {

    RiderProfile findByUserId(long userId);

    RiderProfile findById(long riderId);

    List<RiderProfile> findNearestAvailableRiders(double restLat, double restLng, double maxDistanceKm, int limit);

    List<RiderProfile> findNearestAvailableRidersExcluding(double restLat, double restLng, double maxDistanceKm, int limit, List<Long> excludedRiderIds);

    List<Long> getExcludedRiderIdsForOrder(long orderId);

    List<DeliveryDispatch> getTimedOutOffers(int timeoutSeconds);

    List<DeliveryDispatch> getActiveOffersForRider(long riderId);

    DeliveryDispatch findDispatchByOrderId(long orderId);

    void recordRiderMilestoneTimestamp(Connection conn, long dispatchId, String milestoneColumn) throws SQLException;

    void updateRiderProfileDetails(long riderId, String vehicleType, String vehicleNumber, String drivingLicense);

    void recordCodCollection(Connection conn, long riderId, long orderId, BigDecimal amount) throws SQLException;

    BigDecimal recordCodDeposit(long riderId, BigDecimal amount, String referenceNumber, String notes);

    List<com.foodplatform.model.RiderCodSettlement> getCodSettlements(long riderId, int limit, int offset);

    java.util.Map<String, Object> getRiderEarningsSummary(long riderId);

    List<DeliveryDispatch> getRiderCompletedTrips(long riderId, int limit, int offset);

    void updateOnlineStatus(long riderId, boolean isOnline);

    void updateRiderLocation(long riderId, double lat, double lng, double speed, double heading, Long orderId);

    void updateRiderAvailability(Connection conn, long riderId, boolean isAvailable, Long activeOrderId) throws SQLException;

    Long createDispatchOffer(Connection conn, DeliveryDispatch dispatch) throws SQLException;

    DeliveryDispatch findDispatchOfferWithLock(Connection conn, long dispatchId) throws SQLException;

    void updateDispatchStatus(Connection conn, long dispatchId, String status, String reason) throws SQLException;

    void updateWaitTimeCompensation(Connection conn, long dispatchId, int minutes, BigDecimal pay) throws SQLException;

    DeliveryDispatch getRiderActiveDispatch(long riderId);

    Long createRiderProfile(RiderProfile profile);

    void updateKyc(long riderId, boolean approved);

    List<RiderProfile> listAllRiders(int limit, int offset);
}
