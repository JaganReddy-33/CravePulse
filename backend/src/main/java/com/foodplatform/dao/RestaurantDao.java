package com.foodplatform.dao;

import com.foodplatform.model.Restaurant;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.List;

public interface RestaurantDao {

    List<Restaurant> listOpenRestaurants(Double userLat, Double userLng, String cuisine, String search, Boolean vegOnly, int limit, int offset);

    Restaurant findById(long id);

    Restaurant findByUserId(long userId);

    void updateOpenStatus(long id, boolean isOpen);

    void updateAutoThrottle(long id, boolean throttled);

    void incrementCurrentLoad(Connection conn, long id) throws SQLException;

    void decrementCurrentLoad(Connection conn, long id) throws SQLException;

    void updateKyc(long id, boolean approved);

    List<Restaurant> listAllRestaurants(int limit, int offset);
}
