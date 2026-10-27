package com.foodplatform.model;

import java.math.BigDecimal;
import java.sql.Timestamp;

public class RiderLocationLog {
    private Long id;
    private Long riderId;
    private Long orderId;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private BigDecimal speed;
    private BigDecimal heading;
    private Timestamp recordedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getRiderId() { return riderId; }
    public void setRiderId(Long riderId) { this.riderId = riderId; }

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }

    public BigDecimal getLatitude() { return latitude; }
    public void setLatitude(BigDecimal latitude) { this.latitude = latitude; }

    public BigDecimal getLongitude() { return longitude; }
    public void setLongitude(BigDecimal longitude) { this.longitude = longitude; }

    public BigDecimal getSpeed() { return speed; }
    public void setSpeed(BigDecimal speed) { this.speed = speed; }

    public BigDecimal getHeading() { return heading; }
    public void setHeading(BigDecimal heading) { this.heading = heading; }

    public Timestamp getRecordedAt() { return recordedAt; }
    public void setRecordedAt(Timestamp recordedAt) { this.recordedAt = recordedAt; }
}
