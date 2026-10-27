package com.foodplatform.dao;

import com.foodplatform.model.OrderMessage;

import java.util.List;

public interface OrderMessageDao {

    Long saveMessage(OrderMessage message);

    List<OrderMessage> getOrderMessages(long orderId);

    boolean isUserAllowedInOrderChat(long orderId, long userId, String role);
}
