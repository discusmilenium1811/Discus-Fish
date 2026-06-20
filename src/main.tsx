import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { LanguageProvider } from './i18n/LanguageContext'
import { AuthProvider } from './auth/AuthContext'
import { AdminLayout } from './admin/AdminLayout'
import { Dashboard } from './admin/pages/Dashboard'
import { Products } from './admin/pages/Products'
import {
  CategoriesPage,
  InventoryPage,
  ReviewsPage,
  OrdersPage,
  PaymentsPage,
  TrackingPage,
  InvoicesPage,
  ReturnsPage,
  CouponsPage,
  OffersPage,
  GiftCardsPage,
  ShippingPage,
} from './admin/pages/sections'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="products" element={<Products />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="reviews" element={<ReviewsPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="payments" element={<PaymentsPage />} />
              <Route path="tracking" element={<TrackingPage />} />
              <Route path="invoices" element={<InvoicesPage />} />
              <Route path="returns" element={<ReturnsPage />} />
              <Route path="coupons" element={<CouponsPage />} />
              <Route path="offers" element={<OffersPage />} />
              <Route path="gift-cards" element={<GiftCardsPage />} />
              <Route path="shipping" element={<ShippingPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  </StrictMode>,
)
