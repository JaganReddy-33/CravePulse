package com.foodplatform.util;

import java.io.IOException;
import java.math.BigDecimal;
import java.net.URI;
import java.net.URLDecoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class GoogleMapsUrlParser {

    private static final Pattern AT_COORDINATES = Pattern.compile(
        "@(-?\\d{1,2}(?:\\.\\d+)?),(-?\\d{1,3}(?:\\.\\d+)?)"
    );
    private static final Pattern DATA_COORDINATES = Pattern.compile(
        "!3d(-?\\d{1,2}(?:\\.\\d+)?)!4d(-?\\d{1,3}(?:\\.\\d+)?)"
    );
    private static final Pattern COORDINATE_PAIR = Pattern.compile(
        "(-?\\d{1,2}(?:\\.\\d+)?)\\s*,\\s*(-?\\d{1,3}(?:\\.\\d+)?)"
    );
    private static final HttpClient HTTP_CLIENT = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(2))
        .followRedirects(HttpClient.Redirect.NEVER)
        .build();

    private GoogleMapsUrlParser() {}

    public static Coordinates parse(String mapsUrl) {
        URI uri = parseSafeUri(mapsUrl);

        String path = uri.getPath() == null ? "" : uri.getPath();
        Coordinates coordinates = findCoordinates(AT_COORDINATES, path);
        if (coordinates == null) coordinates = findCoordinates(DATA_COORDINATES, path);
        if (coordinates == null && uri.getRawQuery() != null) {
            coordinates = findCoordinatesInQuery(uri.getRawQuery());
        }

        if (coordinates == null) {
            throw new IllegalArgumentException(
                "The Google Maps link must contain coordinates in its map pin or q parameter. Shortened links without coordinates are not supported."
            );
        }
        return coordinates;
    }

    public static Coordinates parseAndResolve(String mapsUrl) {
        URI uri = parseSafeUri(mapsUrl);
        try {
            return parse(mapsUrl);
        } catch (IllegalArgumentException e) {
            if (!"maps.app.goo.gl".equalsIgnoreCase(uri.getHost())) {
                throw e;
            }
        }

        URI currentUri = uri;
        for (int redirectCount = 0; redirectCount < 5; redirectCount++) {
            HttpRequest request = HttpRequest.newBuilder(currentUri)
                .timeout(Duration.ofSeconds(2))
                .header("User-Agent", "CravePulse/1.0")
                .GET()
                .build();
            try {
                HttpResponse<Void> response = HTTP_CLIENT.send(
                    request,
                    HttpResponse.BodyHandlers.discarding()
                );
                if (response.statusCode() >= 300 && response.statusCode() < 400) {
                    String location = response
                        .headers()
                        .firstValue("location")
                        .orElseThrow(() -> unresolvedShortLink());
                    URI redirectUri;
                    try {
                        redirectUri = currentUri.resolve(location);
                    } catch (IllegalArgumentException e) {
                        throw unresolvedShortLink();
                    }
                    if (!isSafeGoogleMapsUrl(redirectUri)) {
                        throw unresolvedShortLink();
                    }
                    currentUri = redirectUri;
                    try {
                        return parse(currentUri.toString());
                    } catch (IllegalArgumentException ignored) {
                        continue;
                    }
                }
                throw unresolvedShortLink();
            } catch (IOException e) {
                throw unresolvedShortLink();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw unresolvedShortLink();
            }
        }
        throw unresolvedShortLink();
    }

    private static Coordinates findCoordinatesInQuery(String rawQuery) {
        for (String parameter : rawQuery.split("&")) {
            int separator = parameter.indexOf('=');
            if (separator < 0) continue;

            String name = URLDecoder.decode(
                parameter.substring(0, separator),
                StandardCharsets.UTF_8
            );
            String value = URLDecoder.decode(
                parameter.substring(separator + 1),
                StandardCharsets.UTF_8
            );
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
        if (
            !"https".equalsIgnoreCase(uri.getScheme()) ||
            uri.getRawUserInfo() != null ||
            (uri.getPort() != -1 && uri.getPort() != 443) ||
            uri.getHost() == null
        ) {
            return false;
        }

        String host = uri.getHost().toLowerCase(Locale.ROOT);
        boolean googleHost = host.matches(
            "(?:[a-z0-9-]+\\.)*google\\.(?:com|[a-z]{2}|(?:co|com)\\.[a-z]{2})"
        );
        boolean shortMapsHost = "maps.app.goo.gl".equals(host);
        boolean mapsPath =
            "maps.google.com".equals(host) ||
            shortMapsHost ||
            (uri.getPath() != null && uri.getPath().startsWith("/maps"));
        return (googleHost || shortMapsHost) && mapsPath;
    }

    private static Coordinates findCoordinates(Pattern pattern, String value) {
        Matcher matcher = pattern.matcher(value);
        return matcher.find() ? toCoordinates(matcher) : null;
    }

    private static URI parseSafeUri(String mapsUrl) {
        if (mapsUrl == null || mapsUrl.isBlank() || mapsUrl.length() > 500) {
            throw invalidMapsUrl();
        }

        try {
            URI uri = URI.create(mapsUrl.trim());
            if (!isSafeGoogleMapsUrl(uri)) {
                throw invalidMapsUrl();
            }
            return uri;
        } catch (IllegalArgumentException e) {
            throw invalidMapsUrl();
        }
    }

    private static Coordinates toCoordinates(Matcher matcher) {
        try {
            BigDecimal latitude = new BigDecimal(matcher.group(1));
            BigDecimal longitude = new BigDecimal(matcher.group(2));
            if (
                latitude.abs().compareTo(BigDecimal.valueOf(90)) > 0 ||
                longitude.abs().compareTo(BigDecimal.valueOf(180)) > 0
            ) {
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

    private static IllegalArgumentException unresolvedShortLink() {
        return new IllegalArgumentException(
            "Could not read coordinates from that shortened Maps link. Copy the full Google Maps link and try again."
        );
    }

    public record Coordinates(BigDecimal latitude, BigDecimal longitude) {}
}
