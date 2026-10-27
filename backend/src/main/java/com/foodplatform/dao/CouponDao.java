package com.foodplatform.dao;

import com.foodplatform.model.Coupon;
import java.util.List;

public interface CouponDao {
    List<Coupon> listAllCoupons();
    List<Coupon> listActiveCoupons();
    Coupon findById(long id);
    Coupon findByCode(String code);
    Long createCoupon(Coupon coupon);
    void updateCoupon(Coupon coupon);
    void toggleCoupon(long id, boolean isActive);
    void deleteCoupon(long id);
}
