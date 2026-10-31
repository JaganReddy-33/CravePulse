package com.foodplatform.servlet;

import com.foodplatform.model.MenuItem;
import com.foodplatform.util.JsonUtil;
import com.google.gson.JsonObject;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class MenuItemUpdateTest {
    @Test
    void explicitNullClearsCaloriesWhileOmittedFieldRetainsExistingValue() {
        MenuItem existing = new MenuItem();
        existing.setId(41L);
        existing.setCalorieCount(350);

        JsonObject clearCalories = JsonUtil.fromJson(
                "{\"calorieCount\":null}", JsonObject.class);
        MenuItem cleared = MenuServlet.applyUpdateDefaults(clearCalories, existing, 41L);
        assertNull(cleared.getCalorieCount());

        JsonObject leaveCaloriesUnchanged = JsonUtil.fromJson("{}", JsonObject.class);
        MenuItem unchanged = MenuServlet.applyUpdateDefaults(leaveCaloriesUnchanged, existing, 41L);
        assertEquals(350, unchanged.getCalorieCount());
    }
}
