package com.foodplatform.util;

import com.foodplatform.config.AppProperties;
import jakarta.servlet.http.*;
import java.util.Map;

/** Only the refresh credential is persistent; JavaScript cannot read it. */
public final class SessionCookie {
    private static final String NAME="cravepulse_refresh";
    public static String read(HttpServletRequest req) {
        if(req.getCookies()!=null) for(Cookie c:req.getCookies()) if(NAME.equals(c.getName())) return c.getValue();
        return null;
    }
    public static void write(HttpServletRequest req,HttpServletResponse res,Map<String,Object> data) {
        Object token=data.remove("refreshToken");
        if(token!=null) set(req,res,token.toString(),(int)(AppProperties.getRefreshTokenExpirationMillis()/1000));
    }
    public static void clear(HttpServletRequest req,HttpServletResponse res) { set(req,res,"",0); }
    private static void set(HttpServletRequest req,HttpServletResponse res,String value,int age) {
        boolean secure=req.isSecure() || "https".equalsIgnoreCase(req.getHeader("X-Forwarded-Proto"));
        // None requires HTTPS; local development remains same-site Lax.
        String site=secure?"None":"Lax";
        res.addHeader("Set-Cookie",NAME+"="+value+"; Path=/api/auth; HttpOnly; SameSite="+site+"; Max-Age="+age+(secure?"; Secure":""));
    }
    public static boolean allowedOrigin(HttpServletRequest req) {
        String origin=req.getHeader("Origin");
        if(origin==null) return true; // CLI clients must possess the refresh credential themselves.
        return java.util.Arrays.stream(AppProperties.getCorsAllowedOrigins().split(",")).map(String::trim).anyMatch(origin::equals);
    }
}
