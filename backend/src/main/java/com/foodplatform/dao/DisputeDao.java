package com.foodplatform.dao;

import com.foodplatform.model.Dispute;

import java.util.List;

public interface DisputeDao {

    Long createDispute(Dispute dispute);

    Dispute findById(long disputeId);

    List<Dispute> listPendingDisputes();

    List<Dispute> listCustomerDisputes(long customerId);

    void resolveDispute(long disputeId, String adminStatus, String resolutionNotes, Long resolvedByUserId);
}
