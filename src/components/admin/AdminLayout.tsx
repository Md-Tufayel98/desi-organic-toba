import { useState } from "react";
import { Link, useNavigate, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FolderTree,
  Users,
  MessageCircle,
  Tag,
  Truck,
  Image,
  Settings,
  LogOut,
  Menu,
  X,
  Leaf,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, signOut, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { icon: LayoutDashboard, label: "ড্যাশবোর্ড", href: "/admin" },
    { icon: ShoppingCart, label: "অর্ডার", href: "/admin/orders" },
    { icon: Package, label: "পণ্য", href: "/admin/products" },
    { icon: FolderTree, label: "ক্যাটাগরি", href: "/admin/categories" },
    { icon: Users, label: "কাস্টমার", href: "/admin/customers" },
    { icon: Tag, label: "কুপন", href: "/admin/coupons" },
    { icon: Truck, label: "ডেলিভারি জোন", href: "/admin/delivery-zones" },
    { icon: Image, label: "ব্যানার", href: "/admin/banners" },
    { icon: MessageCircle, label: "লাইভ চ্যাট", href: "/admin/chat" },
    { icon: Settings, label: "সেটিংস", href: "/admin/settings" },
  ];

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p>লোড হচ্ছে...</p>
      </div>
    );
  }

  // Auth check
  if (!user || !isAdmin) {
    navigate("/auth");
    return null;
  }

  const isActive = (href: string) => {
    if (href === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-muted rounded-lg"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link to="/admin" className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-primary" />
            <span className="font-bold text-primary">অ্যাডমিন</span>
          </Link>
          <div className="w-10" />
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Overlay (Mobile) */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-foreground/50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-card border-r border-border transform transition-transform lg:transform-none ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <Link to="/admin" className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full gradient-organic flex items-center justify-center">
                    <Leaf className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-bold text-primary">অ্যাডমিন প্যানেল</p>
                    <p className="text-xs text-muted-foreground">অর্গানিক স্টোর</p>
                  </div>
                </Link>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden p-1 hover:bg-muted rounded"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-border space-y-2">
              <Link to="/">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <ChevronRight className="h-4 w-4 rotate-180" />
                  স্টোরে ফিরে যান
                </Button>
              </Link>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                onClick={() => {
                  signOut();
                  navigate("/");
                }}
              >
                <LogOut className="h-4 w-4" />
                লগআউট
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-screen lg:min-h-[calc(100vh)] p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
