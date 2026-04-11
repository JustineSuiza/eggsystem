import { useEffect, useState } from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router";
import { useApp } from "../context/app-context";
import { Button } from "./ui/button";
import { LayoutDashboard, Package, TrendingUp, TrendingDown, Users, LogOut, Egg, Menu, X, Database } from "lucide-react";

export function Layout() {
  const { currentUser, setCurrentUser } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  if (!currentUser) {
    return null;
  }

  const handleLogout = () => {
    setCurrentUser(null);
    navigate("/login");
  };

  const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/products", label: "Products", icon: Package },
    { path: "/stock-in", label: "Stock In", icon: TrendingUp },
    { path: "/sales", label: "Sales", icon: TrendingDown },
    ...(currentUser?.role === "Admin" ? [
      { path: "/users", label: "Users", icon: Users },
    ] : []),
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-white text-[#3c2f25] shadow-lg shadow-[#d4a574]/30 rounded-tr-xl rounded-br-xl
          flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        {/* Close button for mobile */}
        <div className="lg:hidden absolute top-4 right-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 bg-[#d4a574]/25 rounded-tr-xl rounded-br-xl shadow-inner shadow-[#c67c4e]/30">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#c67c4e] flex items-center justify-center overflow-hidden ring-2 ring-[#d4a574]">
              <img 
                src="//images/egg-logo.png/logo.png" 
                alt="Egg Logo" 
                className="h-full w-full object-cover rounded-full"
              />
            </div>
            <div>
              <h1 className="font-bold text-lg text-[#3c2f25]">Egg Inventory</h1>
              <p className="text-xs text-[#3c2f25]/80">Management System</p>
            </div>
          </div>
          <div className="mt-4 h-px bg-[#a55b35] opacity-90" />
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={`w-full justify-start transition-all border-l-4 ${isActive ? "bg-[#d4a574] text-[#2b1b13] font-semibold border-l-[#c67c4e]" : "text-[#3c2f25]/85 border-l-transparent hover:bg-[#d4a574]/30 hover:text-[#2b1b13]"}`}
                >
                  <Icon className="h-4 w-4 mr-3" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="mb-3 px-3">
            <p className="text-sm font-medium">{currentUser.name}</p>
            <p className="text-xs text-gray-500">{currentUser.role}</p>
          </div>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-3" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto w-full">
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-amber-500 flex items-center justify-center">
                <Egg className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold">Egg Inventory</span>
            </div>
          </div>
        </div>

        <Outlet />
      </main>
    </div>
  );
}
