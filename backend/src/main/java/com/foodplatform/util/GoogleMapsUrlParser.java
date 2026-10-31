package com.foodplatform.util;

import java.math.BigDecimal;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class GoogleMapsUrlParser {
    private static final Pattern AT_COORDINATES =
            Pattern.compile("@(-?\\d{1,2}(?:\\.\\d+)?),(-?\\d{1,3}(?:\\.\\d+)?)");
    private static final Pattern DATA_COORDINATES =
            Pattern.compile("!3d(-?\\d{1,2}(?:\\.\\d+)?)!4d(-?\\d{1,3}(?:\\.\\d+)?)");
    private static final Pattern COORDINATE_PAIR =
            Pattern.compile("(-?\\d{1,2}(?:\\.\\d+)?)\\s*,\\s*(-?\\d{1,3}(?:\\.\\d+)?)");

    private GoogleMapsUrlParser() {}

    public static Coordinates parse(String mapsUrl) {
        if (mapsUrl == null || mapsUrl.isBlank() || mapsUrl.length() > 500) {
            throw invalidMapsUrl();
        }

        final URI uri;
        try {
            uri = URI.create(mapsUrl.trim());
        } catch (IllegalArgumentException e) {
            throw invalidMapsUrl();
        }

        if (!isSafeGoogleMapsUrl(uri)) {
            throw invalidMapsUrl();
        }

        String path = uri.getPath() == null ? "" : uri.getPath();
        Coordinates coordinates = findCoordinates(AT_COORDINATES, path);
        if (coordinates == null) coordinates = findCoordinates(DATA_COORDINATES, path);
        if (coordinates == null && uri.getRawQuery() != null) {
            coordinates = findCoordinatesInQuery(uri.getRawQuery());
        }

        if (coordinates == null) {
            throw new IllegalArgumentException(
                    "The Google Maps link must contain coordinates in its map pin or q parameter. Shortened links without coordinates are not supported.");
        }
        return coordinates;
    }

    private static Coordinates findCoordinatesInQuery(String rawQuery) {
        for (String parameter : rawQuery.split("&")) {
            int separator = parameter.indexOf('=');
            if (separator < 0) continue;

            String name = URLDecoder.decode(parameter.substring(0, separator), StandardCharsets.UTF_8);
            String value = URLDecoder.decode(parameter.substring(separator + 1), StandardCharsets.UTF_8);
            if ("data".equalsIgnoreCase(name)) {
                Coordinates coordinates = findCoordinates(DATA_COORDINATES, value);
                if (coordinates != null) return coordinates;
            } else if ("q".equalsIgnoreCase(name)) {
                Matcher matcher = COORDINATE_PAIR.matcher(value);
                if (matcher.find()) {
                    Coordinates coordinates = toCoordinates(matcher);
                    if (coordinates != null) return coordinates;
                }
            }
        }
        return null;
    }

    public static boolean isSafeGoogleMapsUrl(String value) {
        if (value == null || value.isBlank() || value.length() > 500) return false;
        try {
            return isSafeGoogleMapsUrl(URI.create(value.trim()));
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    private static boolean isSafeGoogleMapsUrl(URI uri) {
        if (!"https".equalsIgnoreCase(uri.getScheme()) ||
                uri.getRawUserInfo() != null ||
                (uri.getPort() != -1 && uri.getPort() != 443) ||
                uri.getHost() == null) {
            return false;
        }

        String host = uri.getHost().toLowerCase(Locale.ROOT);
        boolean googleHost = host.matches("(?:[a-z0-9-]+\\.)*google\\.(?:com|[a-z]{2}|(?:co|com)\\.[a-z]{2})");
        boolean shortMapsHost = "maps.app.goo.gl".equals(host);
        boolean mapsPath = "maps.google.com".equals(host) ||
                shortMapsHost ||
                (uri.getPath() != null && uri.getPath().startsWith("/maps"));
        return (googleHost || shortMapsHost) && mapsPath;
    }

    private static Coordinates findCoordinates(Pattern pattern, String value) {
        Matcher matcher = pattern.matcher(value);
        return matcher.find() ? toCoordinates(matcher) : null;
    }

    private static Coordinates toCoordinates(Matcher matcher) {
        try {
            BigDecimal latitude = new BigDecimal(matcher.group(1));
            BigDecimal longitude = new BigDecimal(matcher.group(2));
            if (latitude.abs().compareTo(BigDecimal.valueOf(90)) > 0 ||
                    longitude.abs().compareTo(BigDecimal.valueOf(180)) > 0) {
                return null;
            }
            return new Coordinates(latitude, longitude);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static IllegalArgumentException invalidMapsUrl() {
        return new IllegalArgumentException("Enter a valid HTTPS Google Maps link.");
    }

    public record Coordinates(BigDecimal latitude, BigDecimal longitude) {}
}
