import { Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import { LoginPage } from "./modules/auth/LoginPage.jsx";
import { AdminLayout } from "./modules/admin/AdminLayout.jsx";
import { ProtectedRoute } from "./modules/auth/ProtectedRoute.jsx";
import { Dashboard } from "./modules/admin/pages/Dashboard.jsx";
import { Categories } from "./modules/admin/pages/Categories.jsx";
import { Products } from "./modules/admin/pages/Products.jsx";
import { Orders } from "./modules/admin/pages/Orders.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="categories" element={<Categories />} />
        <Route path="products" element={<Products />} />
        <Route path="orders" element={<Orders />} />
      </Route>
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}

export default App;
