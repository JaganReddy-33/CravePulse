import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { RealtimeProvider } from './context/RealtimeContext';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingState from './components/states/LoadingState';

// Styles
import './theme/variables.css';
import './theme/portals.css';
import './App.css';

// Layouts (Eagerly loaded for instant shell rendering)
import CustomerLayout from './pages/customer/CustomerLayout';
const PartnerLayout = lazy(() => import('./pages/partner/PartnerLayout'));
const RiderLayout = lazy(() => import('./pages/rider/RiderLayout'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));

// Lazy-Loaded Customer Pages
const CustomerHome = lazy(() => import('./pages/customer/CustomerHome'));
const RestaurantDetail = lazy(() => import('./pages/customer/RestaurantDetail'));
const CheckoutPage = lazy(() => import('./pages/customer/CheckoutPage'));
const OrderTracking = lazy(() => import('./pages/customer/OrderTracking'));
const CustomerOrders = lazy(() => import('./pages/customer/CustomerOrders'));
const CustomerProfile = lazy(() => import('./pages/customer/CustomerProfile'));
const CustomerAuth = lazy(() => import('./pages/customer/CustomerAuth'));
const AboutPage = lazy(() => import('./pages/customer/AboutPage'));
const ContactPage = lazy(() => import('./pages/customer/ContactPage'));
const CareersPage = lazy(() => import('./pages/customer/CareersPage'));
const JobDetailPage = lazy(() => import('./pages/customer/JobDetailPage'));
const HelpCenterPage = lazy(() => import('./pages/customer/HelpCenterPage'));
const OffersPage = lazy(() => import('./pages/customer/OffersPage'));
const CitiesPage = lazy(() => import('./pages/customer/CitiesPage'));
const LegalTermsPage = lazy(() => import('./pages/customer/LegalTermsPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/customer/PrivacyPolicyPage'));
const InvoicePage = lazy(() => import('./pages/customer/InvoicePage'));
const NotFound = lazy(() => import('./pages/customer/NotFound'));

// Lazy-Loaded Restaurant Partner Pages
const FoodAnalyticsDashboard = lazy(() => import('./pages/partner/FoodAnalyticsDashboard'));
const KitchenKanban = lazy(() => import('./pages/partner/KitchenKanban'));
const MenuManagement = lazy(() => import('./pages/partner/MenuManagement'));
const PartnerOrders = lazy(() => import('./pages/partner/PartnerOrders'));
const PartnerSettings = lazy(() => import('./pages/partner/PartnerSettings'));
const PartnerAuth = lazy(() => import('./pages/partner/PartnerAuth'));

// Lazy-Loaded Delivery Rider Pages
const RiderActiveJob = lazy(() => import('./pages/rider/RiderActiveJob'));
const RiderEarnings = lazy(() => import('./pages/rider/RiderEarnings'));
const RiderHistory = lazy(() => import('./pages/rider/RiderHistory'));
const RiderProfile = lazy(() => import('./pages/rider/RiderProfile'));
const RiderAuth = lazy(() => import('./pages/rider/RiderAuth'));

// Lazy-Loaded Platform Ops Admin Pages
const OpsDashboard = lazy(() => import('./pages/admin/OpsDashboard'));
const DisputeQueue = lazy(() => import('./pages/admin/DisputeQueue'));
const ApprovalsPage = lazy(() => import('./pages/admin/ApprovalsPage'));
const AdminRestaurants = lazy(() => import('./pages/admin/AdminRestaurants'));
const AdminRiders = lazy(() => import('./pages/admin/AdminRiders'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminCoupons = lazy(() => import('./pages/admin/AdminCoupons'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminAuditLogs = lazy(() => import('./pages/admin/AdminAuditLogs'));
const AdminJobs = lazy(() => import('./pages/admin/AdminJobs'));
const AdminServiceAreas = lazy(() => import('./pages/admin/AdminServiceAreas'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'));
const AdminSupport = lazy(() => import('./pages/admin/AdminSupport'));
const AdminPayouts = lazy(() => import('./pages/admin/AdminPayouts'));
const AdminAuth = lazy(() => import('./pages/admin/AdminAuth'));

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          <CartProvider>
            <RealtimeProvider>
              <Suspense fallback={<LoadingState message="Loading portal module..." minHeight={380} />}>
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
                    <Route path="city/:city/:slug" element={<RestaurantDetail />} />
                    <Route path="city/:city/:slug/menu" element={<RestaurantDetail />} />
                    <Route path="restaurants/:city/:slug" element={<RestaurantDetail />} />
                    <Route path="restaurant/:id" element={<RestaurantDetail />} />
                    <Route path="restaurants/:id" element={<RestaurantDetail />} />

                    {/* Protected Customer Operations (Authentication Gate with returnTo) */}
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
                    <Route path="support" element={<AdminSupport />} />
                    <Route path="payouts" element={<AdminPayouts />} />
                    <Route path="service-areas" element={<AdminServiceAreas />} />
                    <Route path="categories" element={<AdminCategories />} />
                    <Route path="audit-logs" element={<AdminAuditLogs />} />
                    <Route path="console/audit-trail-and-exports" element={<AdminAuditLogs />} />
                    <Route path="careers" element={<AdminJobs />} />
                    <Route path="console/talent-and-job-postings" element={<AdminJobs />} />
                  </Route>

                  {/* 404 Not Found Page */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </RealtimeProvider>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
