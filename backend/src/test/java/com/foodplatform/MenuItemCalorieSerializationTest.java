package com.foodplatform;

import com.foodplatform.model.MenuItem;
import com.foodplatform.util.JsonUtil;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class MenuItemCalorieSerializationTest {
    @Test
    void calorieCountRequestAndResponseUseThePersistedFieldName() {
        MenuItem created = JsonUtil.fromJson("{\"calorieCount\":425}", MenuItem.class);

        assertEquals(425, created.getCalorieCount());
        var response = JsonUtil.getGson().toJsonTree(created).getAsJsonObject();
        assertEquals(425, response.get("calorieCount").getAsInt());
        assertFalse(response.has("calories"));
    }

    @Test
    void missingCaloriesRemainNullInsteadOfBecomingFalseZeroValues() {
        MenuItem item = JsonUtil.fromJson("{}", MenuItem.class);

        assertNull(item.getCalorieCount());
        assertTrue(JsonUtil.getGson().toJsonTree(item).getAsJsonObject()
                .get("calorieCount").isJsonNull());
    }

    @Test
    void blankOptionalMenuMetadataSerializesAsNull() {
        MenuItem item = JsonUtil.fromJson(
                "{\"imageUrl\":null,\"prepTimeMinutes\":null}", MenuItem.class);

        var response = JsonUtil.getGson().toJsonTree(item).getAsJsonObject();
        assertTrue(response.get("imageUrl").isJsonNull());
        assertTrue(response.get("prepTimeMinutes").isJsonNull());
    }
}
