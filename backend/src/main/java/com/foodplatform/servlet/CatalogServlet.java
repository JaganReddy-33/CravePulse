package com.foodplatform.servlet;
import com.foodplatform.config.DatabaseConfig;
import com.foodplatform.util.JsonUtil;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.sql.*;
import java.util.*;
public class CatalogServlet extends BaseServlet {
    @Override protected void doPost(HttpServletRequest req,HttpServletResponse res) throws IOException {
        if(!requireAdmin(req,res)) return;
        if(!"/locations".equals(req.getPathInfo())) {JsonUtil.sendError(res,404,"Endpoint not found");return;}
        try {
            var b=JsonUtil.readRequestBody(req,com.google.gson.JsonObject.class);
            String city=b.get("city").getAsString().trim(), name=b.get("name").getAsString().trim();
            double lat=b.get("latitude").getAsDouble(),lng=b.get("longitude").getAsDouble(),radius=b.get("radiusKm").getAsDouble();
            if(city.isEmpty()||city.length()>100||name.isEmpty()||name.length()>100||!Double.isFinite(lat)||!Double.isFinite(lng)||Math.abs(lat)>90||Math.abs(lng)>180||!Double.isFinite(radius)||radius<=0||radius>100) throw new IllegalArgumentException("Provide a city, zone name, valid coordinates and radius up to 100 km");
            try(Connection c=DatabaseConfig.getConnection();PreparedStatement ps=c.prepareStatement("INSERT INTO delivery_zones(zone_name,city,center_lat,center_lng,radius_km) VALUES(?,?,?,?,?)")) {
                ps.setString(1,name);ps.setString(2,city);ps.setDouble(3,lat);ps.setDouble(4,lng);ps.setDouble(5,radius);ps.executeUpdate();
            }
            JsonUtil.sendSuccess(res,201,"Delivery zone created",null);
        } catch(IllegalArgumentException|NullPointerException e) {JsonUtil.sendError(res,400,"Valid delivery zone details are required");}
        catch(SQLException e) {JsonUtil.sendError(res,503,"Unable to save delivery zone");}
    }
    @Override protected void doGet(HttpServletRequest req,HttpServletResponse res) throws IOException {
        String path=req.getPathInfo()==null?"":req.getPathInfo();
        try(Connection c=DatabaseConfig.getConnection()) {
            if(path.equals("/offers")) {
                List<Map<String,Object>> offers=new ArrayList<>();
                String sql="SELECT * FROM coupons WHERE is_active=TRUE AND times_used<usage_limit AND (valid_from IS NULL OR valid_from<=CURRENT_TIMESTAMP) AND (valid_until IS NULL OR valid_until>=CURRENT_TIMESTAMP)";
                try(Statement st=c.createStatement();ResultSet rs=st.executeQuery(sql)) {
                    while(rs.next()) {
                        long restaurantId=rs.getLong("restaurant_id"); boolean global=rs.wasNull();
                        String requested=req.getParameter("restaurantId");
                        if(requested!=null && !global && !requested.equals(String.valueOf(restaurantId))) continue;
                        Map<String,Object> offer=new HashMap<>();
                        offer.put("code",rs.getString("code"));offer.put("title",rs.getString("description"));offer.put("description",rs.getString("description"));
                        offer.put("minOrder",rs.getBigDecimal("min_order_amount"));offer.put("restaurantId",global?null:restaurantId);
                        offer.put("discount",rs.getBigDecimal("discount_value").toPlainString()+("PERCENTAGE".equals(rs.getString("discount_type"))?"% OFF":" INR OFF"));
                        offer.put("details",rs.getString("description"));offer.put("color","var(--c-primary)");offer.put("tag",rs.getBoolean("first_order_only")?"FIRST ORDER":"AVAILABLE");
                        offers.add(offer);
                    }
                }
                JsonUtil.sendSuccess(res,200,"Available offers",offers);
            } else if(path.equals("/locations")) {
                Map<String,Map<String,Object>> cities=new LinkedHashMap<>();
                try(Statement st=c.createStatement();ResultSet rs=st.executeQuery("SELECT id,zone_name,city,center_lat,center_lng FROM delivery_zones WHERE is_active=TRUE ORDER BY city,zone_name")) {
                    while(rs.next()) {
                        String city=rs.getString("city");
                        Map<String,Object> entry=cities.computeIfAbsent(city,key -> {
                            Map<String,Object> m=new HashMap<>();m.put("id",key);m.put("name",key);m.put("hubs",new ArrayList<Map<String,Object>>());return m;
                        });
                        @SuppressWarnings("unchecked") List<Map<String,Object>> hubs=(List<Map<String,Object>>)entry.get("hubs");
                        hubs.add(Map.of("id",rs.getLong("id"),"name",rs.getString("zone_name"),"area",city,"cityName",city,"coords",List.of(rs.getDouble("center_lat"),rs.getDouble("center_lng"))));
                    }
                }
                JsonUtil.sendSuccess(res,200,"Configured delivery locations",cities.values());
            } else if(path.equals("/categories")) {
                List<Map<String,Object>> categories = new com.foodplatform.daoImpl.DiscoveryCategoryDaoImpl().listCategories(false);
                JsonUtil.sendSuccess(res,200,"Restaurant discovery categories",categories);
            } else JsonUtil.sendError(res,404,"Endpoint not found");
        } catch(SQLException e) { JsonUtil.sendError(res,503,"Catalog unavailable. Please retry."); }
    }
}
