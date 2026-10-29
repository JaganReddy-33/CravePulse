package com.foodplatform.filter;
import com.foodplatform.util.JsonUtil;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import org.slf4j.LoggerFactory;
/** API failures remain JSON and never expose Tomcat stack traces to clients. */
public class ApiExceptionFilter implements Filter {
    @Override public void doFilter(ServletRequest request,ServletResponse response,FilterChain chain) throws IOException,ServletException {
        try { chain.doFilter(request,response); }
        catch(Exception e) {
            HttpServletResponse res=(HttpServletResponse)response;
            if(res.isCommitted()) throw new ServletException("Request failed after response was committed",e);
            LoggerFactory.getLogger(ApiExceptionFilter.class).error("API request failed: {}",((HttpServletRequest)request).getRequestURI(),e);
            res.resetBuffer();JsonUtil.sendError(res,e instanceof IllegalArgumentException?400:503,e instanceof IllegalArgumentException?e.getMessage():"The operation could not be completed. Please retry.");
        }
    }
}
