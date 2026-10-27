package com.foodplatform.dao;

import com.foodplatform.model.AdminAuditLog;
import java.util.List;

public interface AdminAuditDao {
    void logAction(long adminUserId, String adminName, String action, String targetType, String targetId, String details, String ipAddress);
    List<AdminAuditLog> listRecentLogs(int limit, int offset);
}
