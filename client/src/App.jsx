import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useGetMeQuery } from "./store/apiSlice.js";
import { userLoaded, loggedOut } from "./store/authSlice.js";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import EditorPage from "./pages/EditorPage.jsx";

export default function App() {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);

  // On refresh we have a token in localStorage but no user object yet.
  // Fetching /auth/me hydrates the user so the app knows who's logged in
  // without forcing a re-login on every page reload.
  const { data, isSuccess, isError } = useGetMeQuery(undefined, { skip: !token });

  useEffect(() => {
    if (isSuccess && data?.user) {
      dispatch(userLoaded(data.user));
    }
  }, [isSuccess, data, dispatch]);

  useEffect(() => {
    if (isError) {
      // Token is invalid/expired - clear it so the user is sent back to login.
      dispatch(loggedOut());
    }
  }, [isError, dispatch]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/documents/:id"
        element={
          <ProtectedRoute>
            <EditorPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
