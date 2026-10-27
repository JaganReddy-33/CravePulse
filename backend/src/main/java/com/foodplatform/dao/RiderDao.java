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

    void updateOnlineStatus(long riderId, boolean isOnline);

    void updateRiderLocation(long riderId, double lat, double lng, double speed, double heading, Long orderId);

    void updateRiderAvailability(Connection conn, long riderId, boolean isAvailable, Long activeOrderId) throws SQLException;

    Long createDispatchOffer(Connection conn, DeliveryDispatch dispatch) throws SQLException;

    DeliveryDispatch findDispatchOfferWithLock(Connection conn, long dispatchId) throws SQLException;

    void updateDispatchStatus(Connection conn, long dispatchId, String status, String reason) throws SQLException;

    void updateWaitTimeCompensation(Connection conn, long dispatchId, int minutes, BigDecimal pay) throws SQLException;

    DeliveryDispatch getRiderActiveDispatch(long riderId);

    List<RiderProfile> listAllRiders(int limit, int offset);
}
