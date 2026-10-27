import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { RealtimeProvider } from './context/RealtimeContext';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';

// Customer Pages
import CustomerLayout from './pages/customer/CustomerLayout';
import CustomerHome from './pages/customer/CustomerHome';
import RestaurantDetail from './pages/customer/RestaurantDetail';
import CheckoutPage from './pages/customer/CheckoutPage';
import OrderTracking from './pages/customer/OrderTracking';
import CustomerOrders from './pages/customer/CustomerOrders';
import CustomerProfile from './pages/customer/CustomerProfile';
import CustomerAuth from './pages/customer/CustomerAuth';
import AboutPage from './pages/customer/AboutPage';
import ContactPage from './pages/customer/ContactPage';
import CareersPage from './pages/customer/CareersPage';
import JobDetailPage from './pages/customer/JobDetailPage';
import HelpCenterPage from './pages/customer/HelpCenterPage';
import OffersPage from './pages/customer/OffersPage';
import CitiesPage from './pages/customer/CitiesPage';
import LegalTermsPage from './pages/customer/LegalTermsPage';
import PrivacyPolicyPage from './pages/customer/PrivacyPolicyPage';
import InvoicePage from './pages/customer/InvoicePage';

// Restaurant Partner Pages
import PartnerLayout from './pages/partner/PartnerLayout';
import FoodAnalyticsDashboard from './pages/partner/FoodAnalyticsDashboard';
import KitchenKanban from './pages/partner/KitchenKanban';
import MenuManagement from './pages/partner/MenuManagement';
import PartnerOrders from './pages/partner/PartnerOrders';
import PartnerSettings from './pages/partner/PartnerSettings';
import PartnerAuth from './pages/partner/PartnerAuth';

// Delivery Rider Pages
import RiderLayout from './pages/rider/RiderLayout';
import RiderActiveJob from './pages/rider/RiderActiveJob';
import RiderEarnings from './pages/rider/RiderEarnings';
import RiderHistory from './pages/rider/RiderHistory';
import RiderProfile from './pages/rider/RiderProfile';
import RiderAuth from './pages/rider/RiderAuth';

// Admin Ops Pages
import AdminLayout from './pages/admin/AdminLayout';
import OpsDashboard from './pages/admin/OpsDashboard';
import DisputeQueue from './pages/admin/DisputeQueue';
import ApprovalsPage from './pages/admin/ApprovalsPage';
import AdminRestaurants from './pages/admin/AdminRestaurants';
import AdminRiders from './pages/admin/AdminRiders';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCoupons from './pages/admin/AdminCoupons';
import AdminSettings from './pages/admin/AdminSettings';
import AdminAuditLogs from './pages/admin/AdminAuditLogs';
import AdminJobs from './pages/admin/AdminJobs';
import AdminAuth from './pages/admin/AdminAuth';

// Styles
import './theme/variables.css';
import './theme/portals.css';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <CartProvider>
          <RealtimeProvider>
            <Routes>
              {/* Public & Customer Auth Routes */}
              <Route path="/login" element={<CustomerAuth initialMode="login" />} />
              <Route path="/register" element={<CustomerAuth initialMode="register" />} />

              {/* Partner Auth Routes */}
              <Route path="/partner/login" element={<PartnerAuth initialMode="login" />} />
              <Route path="/partner/register" element={<PartnerAuth initialMode="register" />} />

              {/* Rider Auth Routes */}
              <Route path="/rider/login" element={<RiderAuth initialMode="login" />} />
              <Route path="/rider/register" element={<RiderAuth initialMode="register" />} />

              {/* Admin Auth Route */}
              <Route path="/admin/login" element={<AdminAuth />} />

              {/* Customer Portal */}
              <Route path="/" element={<CustomerLayout />}>
                <Route index element={<CustomerHome />} />
                {/* Authentic Swiggy/Zomato Hyper-Local URL Patterns */}
                <Route path="city/:city/:slug" element={<RestaurantDetail />} />
                <Route path="city/:city/:slug/menu" element={<RestaurantDetail />} />
                <Route path="restaurants/:city/:slug" element={<RestaurantDetail />} />
                <Route path="restaurant/:id" element={<RestaurantDetail />} />
                <Route path="restaurants/:id" element={<RestaurantDetail />} />
                {/* Protected Customer Operations (Authentication Gate) */}
                <Route 
                  path="checkout" 
                  element={
                    <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN']}>
                      <CheckoutPage />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Orders & Tracking */}
                <Route 
                  path="account/orders-history" 
                  element={
                    <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN']}>
                      <CustomerOrders />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="orders" 
                  element={
                    <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN']}>
                      <CustomerOrders />
                    </ProtectedRoute>
                  } 
                />
                <Route path="orders/track/live-delivery-status/:orderNumber" element={<OrderTracking />} />
                <Route path="orders/:orderNumber" element={<OrderTracking />} />
                <Route path="account/tax-invoice/download/:id" element={<InvoicePage />} />
                <Route path="orders/:id/invoice" element={<InvoicePage />} />
                <Route path="invoice/:id" element={<InvoicePage />} />

                {/* Account & Profile */}
                <Route 
                  path="account/profile-settings" 
                  element={
                    <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN']}>
                      <CustomerProfile />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="profile" 
                  element={
                    <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN']}>
                      <CustomerProfile />
                    </ProtectedRoute>
                  } 
                />

                {/* Company & Support Content Pages */}
                <Route path="company/about-fair-food-network" element={<AboutPage />} />
                <Route path="about" element={<AboutPage />} />
                <Route path="company/contact-support-team" element={<ContactPage />} />
                <Route path="contact" element={<ContactPage />} />
                <Route path="company/careers-open-positions" element={<CareersPage />} />
                <Route path="careers" element={<CareersPage />} />
                <Route path="careers/openings/:slug" element={<JobDetailPage />} />
                <Route path="company/careers-open-positions/:id" element={<JobDetailPage />} />
                <Route path="careers/:id" element={<JobDetailPage />} />
                <Route path="support/help-center-faq" element={<HelpCenterPage />} />
                <Route path="help" element={<HelpCenterPage />} />
                <Route path="explore/active-deals-and-coupons" element={<OffersPage />} />
                <Route path="offers" element={<OffersPage />} />
                <Route path="network/serviceable-cities" element={<CitiesPage />} />
                <Route path="cities" element={<CitiesPage />} />
                <Route path="legal/terms-and-fair-pricing" element={<LegalTermsPage />} />
                <Route path="terms" element={<LegalTermsPage />} />
                <Route path="legal/privacy-and-data-protection" element={<PrivacyPolicyPage />} />
                <Route path="privacy" element={<PrivacyPolicyPage />} />
              </Route>

              {/* Restaurant Partner Portal (Protected: RESTAURANT_OWNER) */}
              <Route 
                path="/partner" 
                element={
                  <ProtectedRoute allowedRoles={['RESTAURANT_OWNER']}>
                    <PartnerLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<FoodAnalyticsDashboard />} />
                <Route path="kitchen/analytics-performance-insights" element={<FoodAnalyticsDashboard />} />
                <Route path="kanban" element={<KitchenKanban />} />
                <Route path="kitchen/live-kanban-terminal" element={<KitchenKanban />} />
                <Route path="menu" element={<MenuManagement />} />
                <Route path="kitchen/menu-catalog-management" element={<MenuManagement />} />
                <Route path="orders" element={<PartnerOrders />} />
                <Route path="kitchen/live-incoming-orders" element={<PartnerOrders />} />
                <Route path="settings" element={<PartnerSettings />} />
                <Route path="kitchen/outlet-profile-settings" element={<PartnerSettings />} />
              </Route>

              {/* Delivery Rider Portal (Protected: RIDER) */}
              <Route 
                path="/rider" 
                element={
                  <ProtectedRoute allowedRoles={['RIDER']}>
                    <RiderLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<RiderActiveJob />} />
                <Route path="fleet/live-active-delivery" element={<RiderActiveJob />} />
                <Route path="earnings" element={<RiderEarnings />} />
                <Route path="fleet/daily-earnings-incentives" element={<RiderEarnings />} />
                <Route path="history" element={<RiderHistory />} />
                <Route path="fleet/completed-trips-ledger" element={<RiderHistory />} />
                <Route path="profile" element={<RiderProfile />} />
                <Route path="fleet/captain-identity-compliance" element={<RiderProfile />} />
              </Route>

              {/* Platform Ops Admin Portal (Protected: ADMIN) */}
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<OpsDashboard />} />
                <Route path="console/system-overview-metrics" element={<OpsDashboard />} />
                <Route path="disputes" element={<DisputeQueue />} />
                <Route path="console/disputes-and-refunds" element={<DisputeQueue />} />
                <Route path="approvals" element={<ApprovalsPage />} />
                <Route path="console/merchant-onboarding-approvals" element={<ApprovalsPage />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="console/users-directory-moderation" element={<AdminUsers />} />
                <Route path="restaurants" element={<AdminRestaurants />} />
                <Route path="console/merchant-partners-directory" element={<AdminRestaurants />} />
                <Route path="riders" element={<AdminRiders />} />
                <Route path="console/fleet-captains-directory" element={<AdminRiders />} />
                <Route path="coupons" element={<AdminCoupons />} />
                <Route path="console/promotional-coupons" element={<AdminCoupons />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="console/platform-dynamic-settings" element={<AdminSettings />} />
                <Route path="audit-logs" element={<AdminAuditLogs />} />
                <Route path="console/audit-trail-and-exports" element={<AdminAuditLogs />} />
                <Route path="careers" element={<AdminJobs />} />
                <Route path="console/talent-and-job-postings" element={<AdminJobs />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </RealtimeProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
