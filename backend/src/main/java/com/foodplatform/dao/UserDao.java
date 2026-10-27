package com.foodplatform.dao;

import com.foodplatform.model.Address;
import com.foodplatform.model.User;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.List;

public interface UserDao {

    User findByEmail(String email);

    User findById(long id);

    Long createUser(User user);

    void updateFailedAttempts(long userId, int attempts, Timestamp lockedUntil);

    void resetFailedAttempts(long userId);

    void storeRefreshToken(long userId, String token, Timestamp expiresAt);

    Long findUserIdByValidRefreshToken(String token);

    void revokeRefreshToken(String token);

    void updateWalletBalance(Connection conn, long userId, BigDecimal newBalance) throws SQLException;

    List<Address> getUserAddresses(long userId);

    Long addAddress(Address addr);

    List<User> listAllUsers(int limit, int offset);
}
