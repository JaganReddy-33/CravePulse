package com.foodplatform.dao;

import com.foodplatform.model.Dispute;

import java.util.List;

public interface DisputeDao {

    Long createDispute(Dispute dispute);

    Dispute findById(long disputeId);

    List<Dispute> listPendingDisputes();

    List<Dispute> listAllDisputes(String status, int limit, int offset);

    List<Dispute> listCustomerDisputes(long customerId);

    void resolveDispute(long disputeId, String adminStatus, String resolutionNotes, Long resolvedByUserId);

    boolean existsForOrder(long orderId);

    int countCustomerDisputesInWindow(long customerId, int days);
}
