package com.foodplatform.servlet;

import com.foodplatform.config.DatabaseConfig;
import com.foodplatform.util.JsonUtil;
import com.google.gson.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.sql.*;
import java.util.*;

/** Authenticated persistence for customer state, favourites and support. */
public class UserDataServlet extends BaseServlet {
    private String path(HttpServletRequest r) { return r.getPathInfo() == null ? "" : r.getPathInfo(); }
    private String stateKey(String path) {
        return switch (path) { case "/cart" -> "cart"; case "/preferences" -> "preferences"; default -> null; };
    }
    @Override protected void doGet(HttpServletRequest req, HttpServletResponse res) throws IOException {
        if (!requireAuthenticated(req, res)) return;
        long uid = getAuthenticatedUserId(req);
        try (Connection c = DatabaseConfig.getConnection()) {
            String key = stateKey(path(req));
            if (key != null) {
                try (PreparedStatement ps = c.prepareStatement("SELECT state_json FROM user_app_state WHERE user_id=? AND state_key=?")) {
                    ps.setLong(1, uid); ps.setString(2, key);
                    try (ResultSet rs = ps.executeQuery()) {
                        JsonUtil.sendSuccess(res, 200, "Saved state", rs.next() ? JsonParser.parseString(rs.getString(1)) : null);
                    }
                }
            } else if (path(req).equals("/favorites")) {
                List<Long> ids = new ArrayList<>();
                try (PreparedStatement ps = c.prepareStatement("SELECT restaurant_id FROM favorites WHERE user_id=? ORDER BY created_at DESC")) {
                    ps.setLong(1, uid); try (ResultSet rs = ps.executeQuery()) { while(rs.next()) ids.add(rs.getLong(1)); }
                }
                JsonUtil.sendSuccess(res, 200, "Favourites", ids);
            } else if (path(req).equals("/support/inbox")) {
                if(!requireAdmin(req,res)) return;
                List<Map<String,Object>> tickets=new ArrayList<>();
                try(Statement st=c.createStatement();ResultSet rs=st.executeQuery("SELECT t.*,u.full_name,u.email FROM support_tickets t JOIN users u ON u.id=t.user_id ORDER BY t.created_at DESC LIMIT 200")) {
                    while(rs.next()) tickets.add(Map.of("id",rs.getLong("id"),"ticketNumber",rs.getString("ticket_number"),"subject",rs.getString("subject"),"message",rs.getString("description"),"status",rs.getString("status"),"name",rs.getString("full_name"),"email",rs.getString("email")));
                }
                JsonUtil.sendSuccess(res,200,"Support inbox",tickets);
            } else if (path(req).equals("/support")) {
                List<Map<String,Object>> tickets = new ArrayList<>();
                try (PreparedStatement ps = c.prepareStatement("SELECT ticket_number, subject, status, created_at FROM support_tickets WHERE user_id=? ORDER BY created_at DESC LIMIT 100")) {
                    ps.setLong(1, uid); try (ResultSet rs = ps.executeQuery()) {
                        while(rs.next()) tickets.add(Map.of("ticketNumber",rs.getString(1),"subject",rs.getString(2),"status",rs.getString(3),"createdAt",rs.getTimestamp(4).toInstant().toString()));
                    }
                }
                JsonUtil.sendSuccess(res,200,"Support tickets",tickets);
            } else JsonUtil.sendError(res,404,"Endpoint not found");
        } catch (SQLException e) { JsonUtil.sendError(res,503,"Unable to load account data. Please retry."); }
    }
    @Override protected void doPut(HttpServletRequest req, HttpServletResponse res) throws IOException {
        if (!requireAuthenticated(req,res)) return;
        String key=stateKey(path(req));
        if(key==null) { JsonUtil.sendError(res,404,"Endpoint not found"); return; }
        if(req.getContentLengthLong()>100000) { JsonUtil.sendError(res,413,"Payload too large"); return; }
        try {
            JsonObject body=JsonUtil.readRequestBody(req,JsonObject.class);
            if(body==null || body.toString().length()>100000) throw new IllegalArgumentException("Valid state payload required");
            if(key.equals("cart") && (!body.has("items") || !body.get("items").isJsonArray() || body.getAsJsonArray("items").size()>100)) throw new IllegalArgumentException("Cart items required (maximum 100)");
            if(key.equals("cart")) {
                var menus=new com.foodplatform.daoImpl.MenuDaoImpl();
                if(body.getAsJsonArray("items").size()>0) {
                    var restaurant=new com.foodplatform.daoImpl.RestaurantDaoImpl().findById(body.get("restaurantId").getAsLong());
                    if(restaurant==null) throw new IllegalArgumentException("Restaurant no longer available");
                    body.addProperty("restaurantName",restaurant.getName());
                }
                for(JsonElement element:body.getAsJsonArray("items")) {
                    JsonObject entry=element.getAsJsonObject();
                    var item=menus.getItemById(entry.get("id").getAsLong());
                    int quantity=entry.get("quantity").getAsInt();
                    if(item==null || quantity<1 || quantity>20 || !body.has("restaurantId") || body.get("restaurantId").getAsLong()!=item.getRestaurantId()) throw new IllegalArgumentException("Invalid cart item or quantity");
                    entry.addProperty("name",item.getName());entry.addProperty("platformPrice",item.getPlatformPrice());entry.addProperty("dineInPrice",item.getDineInPrice());entry.addProperty("imageUrl",item.getImageUrl());
                }
            }
            // Saved cart display snapshots are never trusted for prices: calculate/order APIs reprice from DB.
            try(Connection c=DatabaseConfig.getConnection(); PreparedStatement ps=c.prepareStatement("INSERT INTO user_app_state(user_id,state_key,state_json) VALUES(?,?,?) ON DUPLICATE KEY UPDATE state_json=VALUES(state_json)")) {
                ps.setLong(1,getAuthenticatedUserId(req)); ps.setString(2,key); ps.setString(3,body.toString()); ps.executeUpdate();
            }
            JsonUtil.sendSuccess(res,200,"Saved",body);
        } catch(IllegalArgumentException e) { JsonUtil.sendError(res,400,e.getMessage()); }
        catch(SQLException e) { JsonUtil.sendError(res,503,"Unable to save. Please retry."); }
    }
    @Override protected void doPost(HttpServletRequest req, HttpServletResponse res) throws IOException {
        if(!requireAuthenticated(req,res)) return;
        long uid=getAuthenticatedUserId(req);
        try(Connection c=DatabaseConfig.getConnection()) {
            JsonObject body=JsonUtil.readRequestBody(req,JsonObject.class);
            if(body==null) throw new IllegalArgumentException("Request body required");
            if(path(req).equals("/support/status")) {
                if(!requireAdmin(req,res)) return;
                String status=text(body,"status",30);
                if(!Set.of("OPEN","IN_PROGRESS","RESOLVED","CLOSED").contains(status)) throw new IllegalArgumentException("Invalid ticket status");
                try(PreparedStatement ps=c.prepareStatement("UPDATE support_tickets SET status=?,resolved_at=CASE WHEN ? IN ('RESOLVED','CLOSED') THEN CURRENT_TIMESTAMP ELSE NULL END WHERE id=?")) {
                    ps.setString(1,status);ps.setString(2,status);ps.setLong(3,body.get("id").getAsLong());
                    if(ps.executeUpdate()!=1) throw new IllegalArgumentException("Ticket not found");
                }
                JsonUtil.sendSuccess(res,200,"Ticket status updated",null);
            } else if(path(req).equals("/favorites")) {
                long id=body.get("restaurantId").getAsLong();
                boolean favorite=body.get("favorite").getAsBoolean();
                try(PreparedStatement ps=c.prepareStatement(favorite ? "INSERT IGNORE INTO favorites(user_id,restaurant_id) SELECT ?,id FROM restaurant_profiles WHERE id=? AND is_kyc_approved=TRUE" : "DELETE FROM favorites WHERE user_id=? AND restaurant_id=?")) {
                    ps.setLong(1,uid); ps.setLong(2,id); ps.executeUpdate();
                }
                JsonUtil.sendSuccess(res,200,"Favourite updated",null);
            } else if(path(req).equals("/support")) {
                String category=text(body,"category",50), message=text(body,"message",10000);
                if(message.length()<10) throw new IllegalArgumentException("Describe your issue in at least 10 characters");
                String number="TKT-"+UUID.randomUUID().toString();
                Long orderId=null;
                String orderNumber=body.has("orderNumber")?body.get("orderNumber").getAsString().trim():"";
                if(!orderNumber.isEmpty()) {
                    try(PreparedStatement ps=c.prepareStatement("SELECT id FROM orders WHERE order_number=? AND customer_id=?")) {
                        ps.setString(1,orderNumber); ps.setLong(2,uid); try(ResultSet rs=ps.executeQuery()) {
                            if(!rs.next()) throw new IllegalArgumentException("Order not found in your account");
                            orderId=rs.getLong(1);
                        }
                    }
                }
                try(PreparedStatement ps=c.prepareStatement("INSERT INTO support_tickets(ticket_number,user_id,order_id,category,subject,description) VALUES(?,?,?,?,?,?)")) {
                    ps.setString(1,number); ps.setLong(2,uid); ps.setObject(3,orderId); ps.setString(4,category); ps.setString(5,category.replace('_',' ')); ps.setString(6,message); ps.executeUpdate();
                }
                JsonUtil.sendSuccess(res,201,"Ticket saved",Map.of("ticketNumber",number));
            } else JsonUtil.sendError(res,404,"Endpoint not found");
        } catch(IllegalArgumentException | NullPointerException e) { JsonUtil.sendError(res,400,e.getMessage()==null?"Invalid request":e.getMessage()); }
        catch(SQLException e) { JsonUtil.sendError(res,503,"Unable to save account data. Please retry."); }
    }
    private String text(JsonObject b,String name,int max) {
        if(!b.has(name)||b.get(name).isJsonNull()) throw new IllegalArgumentException(name+" is required");
        String v=b.get(name).getAsString().trim();
        if(v.isEmpty()||v.length()>max) throw new IllegalArgumentException("Invalid "+name);
        return v;
    }
}
