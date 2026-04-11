import { createBrowserRouter } from "react-router";
import { Dashboard } from "./components/dashboard";
import { Products } from "./components/products";
import { StockIn } from "./components/stock-in";
import { Sales } from "./components/sales";
import { Users } from "./components/users";
import { SqlEditor } from "./components/sql-editor";
import { Login } from "./components/login";
import { Register } from "./components/register";
import { ForgotPassword } from "./components/forgot-password";
import { Layout } from "./components/layout";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/register",
    Component: Register,
  },
  {
    path: "/forgot-password",
    Component: ForgotPassword,
  },
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "products", Component: Products },
      { path: "stock-in", Component: StockIn },
      { path: "sales", Component: Sales },
      { path: "users", Component: Users },
      { path: "sql-editor", Component: SqlEditor },
    ],
  },
]);
