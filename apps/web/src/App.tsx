import { Navigate, Route, Routes } from 'react-router-dom';
import { Shell } from './components/Shell';
import { RequireAuth } from './components/RequireAuth';
import { ToastProvider } from './components/ui/Toast';

import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ListingDetailPage } from './pages/ListingDetailPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { SellerOrdersPage } from './pages/SellerOrdersPage';
import { CreateListingPage } from './pages/CreateListingPage';
import { AdminModerationPage } from './pages/AdminModerationPage';
import { AdminRevenueDashboardPage } from './pages/AdminRevenueDashboardPage';
import { AdminSoldListingsPage } from './pages/AdminSoldListingsPage';
import { SellerMyListingsPage } from './pages/SellerMyListingsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { UserProfilePage } from './pages/UserProfilePage';

export function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route element={<Shell />}>
          <Route index element={<HomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="listings/:id" element={<ListingDetailPage />} />

          <Route path="profile" element={
            <RequireAuth>
              <UserProfilePage />
            </RequireAuth>
          } />
          <Route path="favorites" element={
            <RequireAuth>
              <FavoritesPage />
            </RequireAuth>
          } />
          <Route path="seller/listings" element={
            <RequireAuth roles={['seller']}>
              <SellerMyListingsPage />
            </RequireAuth>
          } />
          <Route path="seller/orders" element={
            <RequireAuth roles={['seller']}>
              <SellerOrdersPage />
            </RequireAuth>
          } />
          <Route path="seller/listing/new" element={
            <RequireAuth roles={['seller']}>
              <CreateListingPage />
            </RequireAuth>
          } />
          <Route path="admin/moderation" element={
            <RequireAuth roles={['admin']}>
              <AdminModerationPage />
            </RequireAuth>
          } />
          <Route path="admin/sold" element={
            <RequireAuth roles={['admin']}>
              <AdminSoldListingsPage />
            </RequireAuth>
          } />
          <Route path="admin/dashboard" element={
            <RequireAuth roles={['admin']}>
              <AdminRevenueDashboardPage />
            </RequireAuth>
          } />

          <Route path="404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Route>
      </Routes>
    </ToastProvider>
  );
}
