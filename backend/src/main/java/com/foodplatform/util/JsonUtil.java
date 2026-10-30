package com.foodplatform.util;

import com.google.gson.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.BufferedReader;
import java.io.IOException;
import java.lang.reflect.Type;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

public final class JsonUtil {

    private static final Gson gson = new GsonBuilder()
            .registerTypeAdapter(Timestamp.class, (JsonSerializer<Timestamp>) (src, typeOfSrc, context) ->
                    new JsonPrimitive(src == null ? "" : src.toInstant().toString()))
            .registerTypeAdapter(Timestamp.class, (JsonDeserializer<Timestamp>) (json, typeOfT, context) -> {
                if (json == null || json.getAsString().isEmpty()) return null;
                return Timestamp.from(Instant.parse(json.getAsString()));
            })
            .serializeNulls()
            .disableHtmlEscaping()
            .create();

    private JsonUtil() {
    }

    public static Gson getGson() {
        return gson;
    }

    public static String toJson(Object obj) {
        return gson.toJson(obj);
    }

    public static <T> T fromJson(String json, Class<T> clazz) {
        return gson.fromJson(json, clazz);
    }

    public static <T> T fromJson(String json, Type typeOfT) {
        return gson.fromJson(json, typeOfT);
    }

    public static <T> T readRequestBody(HttpServletRequest request, Class<T> clazz) throws IOException {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = request.getReader()) {
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
        }
        String body = sb.toString().trim();
        if (body.isEmpty()) {
            return null;
        }
        return fromJson(body, clazz);
    }

    public static void sendSuccess(HttpServletResponse response, int statusCode, String message, Object data) throws IOException {
        sendSuccess(response, statusCode, message, data, null);
    }

    public static void sendSuccess(HttpServletResponse response, int statusCode, String message, Object data,
                                   Map<String, Object> metadata) throws IOException {
        response.setContentType("application/json;charset=UTF-8");
        response.setStatus(statusCode);
        Map<String, Object> map = new HashMap<>();
        map.put("success", true);
        map.put("message", message);
        map.put("data", data);
        if (metadata != null && !metadata.isEmpty()) {
            map.putAll(metadata);
        }
        map.put("timestamp", Instant.now().toString());
        response.getWriter().write(gson.toJson(map));
    }

    public static void sendError(HttpServletResponse response, int statusCode, String errorMessage) throws IOException {
        response.setContentType("application/json;charset=UTF-8");
        response.setStatus(statusCode);
        Map<String, Object> map = new HashMap<>();
        map.put("success", false);
        map.put("error", errorMessage);
        map.put("statusCode", statusCode);
        map.put("timestamp", Instant.now().toString());
        response.getWriter().write(gson.toJson(map));
    }
}
