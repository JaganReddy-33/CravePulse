package com.foodplatform;

import com.foodplatform.model.Address;
import com.foodplatform.util.GoogleMapsUrlParser;
import com.foodplatform.util.JsonUtil;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

class GoogleMapsUrlParserTest {
    @Test
    void parsesCoordinatesFromMapAtPath() {
        var coordinates = GoogleMapsUrlParser.parse("https://www.google.com/maps/@12.9716,77.5946,17z");
        assertEquals(new BigDecimal("12.9716"), coordinates.latitude());
        assertEquals(new BigDecimal("77.5946"), coordinates.longitude());
    }

    @Test
    void parsesCoordinatesFromDataMarkers() {
        var coordinates = GoogleMapsUrlParser.parse(
                "https://www.google.com/maps/place/Pin/data=!3d-33.8688!4d151.2093");
        assertEquals(new BigDecimal("-33.8688"), coordinates.latitude());
        assertEquals(new BigDecimal("151.2093"), coordinates.longitude());
    }

    @Test
    void parsesCoordinatesFromDataMarkersInQueryParameter() {
        var coordinates = GoogleMapsUrlParser.parse(
                "https://www.google.com/maps/place/Pin?data=!3d-33.8688!4d151.2093");
        assertEquals(new BigDecimal("-33.8688"), coordinates.latitude());
        assertEquals(new BigDecimal("151.2093"), coordinates.longitude());
    }

    @Test
    void ignoresUnrelatedCoordinatePairsInQueryParameters() {
        assertThrows(IllegalArgumentException.class,
                () -> GoogleMapsUrlParser.parse(
                        "https://www.google.com/maps/place/Pin?other=12.9716,77.5946"));
    }

    @Test
    void parsesCoordinatesFromQueryParameter() {
        var coordinates = GoogleMapsUrlParser.parse(
                "https://maps.google.com/?q=12.9716%2C77.5946");
        assertEquals(new BigDecimal("12.9716"), coordinates.latitude());
        assertEquals(new BigDecimal("77.5946"), coordinates.longitude());
    }

    @Test
    void rejectsNonGoogleLinksLinksWithoutCoordinatesAndOutOfRangeValues() {
        assertThrows(IllegalArgumentException.class,
                () -> GoogleMapsUrlParser.parse("http://www.google.com/maps/@12,77"));
        assertThrows(IllegalArgumentException.class,
                () -> GoogleMapsUrlParser.parse("https://google.com.evil.example/maps/@12,77"));
        assertThrows(IllegalArgumentException.class,
                () -> GoogleMapsUrlParser.parse("https://maps.app.goo.gl/example"));
        assertThrows(IllegalArgumentException.class,
                () -> GoogleMapsUrlParser.parse("https://www.google.com/maps/@91,77"));
    }

    @Test
    void addressJsonUsesTheFrontendDefaultAndMapsUrlProperties() {
        Address address = new Address();
        address.setDefault(true);
        address.setMapsUrl("https://www.google.com/maps/@12.9716,77.5946");
        var json = JsonUtil.getGson().toJsonTree(address).getAsJsonObject();
        assertTrue(json.get("default").getAsBoolean());
        assertEquals(address.getMapsUrl(), json.get("mapsUrl").getAsString());
        assertFalse(json.has("isDefault"));
        assertTrue(JsonUtil.fromJson("{\"isDefault\":true}", Address.class).isDefault());
    }
}
