import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Filter, Grid3X3, List, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import TopNotificationBar from "@/components/layout/TopNotificationBar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/home/ProductCard";

interface Category {
  id: string;
  name_bn: string;
  slug: string;
  image_url: string | null;
}

interface Product {
  id: string;
  name_bn: string;
  slug: string;
  images: string[] | null;
  base_price: number;
  sale_price: number | null;
  is_featured: boolean;
  category_id: string | null;
  stock_quantity: number | null;
}

const Shop = () => {
  const { getItemCount } = useCart();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [categoriesRes, productsRes] = await Promise.all([
        supabase.from("categories").select("id, name_bn, slug, image_url").eq("is_active", true).order("sort_order"),
        supabase.from("products").select("id, name_bn, slug, images, base_price, sale_price, is_featured, category_id, stock_quantity").eq("is_active", true),
      ]);

      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (productsRes.data) setProducts(productsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const filteredProducts = products
    .filter((product) =>
      selectedCategories.length === 0 || (product.category_id && selectedCategories.includes(product.category_id))
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return (a.sale_price || a.base_price) - (b.sale_price || b.base_price);
        case "price-high":
          return (b.sale_price || b.base_price) - (a.sale_price || a.base_price);
        case "featured":
          return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
        default:
          return 0;
      }
    });

  const FilterSidebar = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-foreground mb-4">ক্যাটাগরি</h3>
        <div className="space-y-3">
          {categories.map((category) => (
            <label
              key={category.id}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <Checkbox
                checked={selectedCategories.includes(category.id)}
                onCheckedChange={() => toggleCategory(category.id)}
              />
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                {category.name_bn}
              </span>
            </label>
          ))}
        </div>
      </div>

      {selectedCategories.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedCategories([])}
          className="w-full"
        >
          ফিল্টার রিসেট করুন
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <TopNotificationBar />
      <Header cartCount={getItemCount()} />

      <main className="flex-1 py-6 md:py-10">
        <div className="container">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              সকল পণ্য
            </h1>
            <p className="text-muted-foreground">
              আমাদের সংগ্রহ থেকে আপনার পছন্দের পণ্য বেছে নিন
            </p>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              variant={selectedCategories.length === 0 ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategories([])}
              className="rounded-full"
            >
              সব
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategories.includes(category.id) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleCategory(category.id)}
                className="rounded-full"
              >
                {category.name_bn}
              </Button>
            ))}
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar - Desktop */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-6 bg-card rounded-xl p-6 border border-border">
                <FilterSidebar />
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1">
              {/* Toolbar */}
              <div className="flex items-center justify-between gap-4 mb-6 bg-card rounded-xl p-4 border border-border">
                <div className="flex items-center gap-2">
                  {/* Mobile Filter */}
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className="lg:hidden">
                        <Filter className="h-4 w-4 mr-2" />
                        ফিল্টার
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left">
                      <SheetHeader>
                        <SheetTitle>ফিল্টার</SheetTitle>
                      </SheetHeader>
                      <div className="mt-6">
                        <FilterSidebar />
                      </div>
                    </SheetContent>
                  </Sheet>

                  <span className="text-sm text-muted-foreground hidden sm:inline">
                    {filteredProducts.length}টি পণ্য
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Sort */}
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="সাজান" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">নতুন</SelectItem>
                      <SelectItem value="featured">বিশেষ</SelectItem>
                      <SelectItem value="price-low">দাম: কম থেকে বেশি</SelectItem>
                      <SelectItem value="price-high">দাম: বেশি থেকে কম</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* View Mode */}
                  <div className="hidden sm:flex items-center border border-border rounded-lg">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"} transition-colors rounded-l-lg`}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2 ${viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"} transition-colors rounded-r-lg`}
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Products Grid */}
              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="bg-muted animate-pulse rounded-xl aspect-[3/4]" />
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">কোনো পণ্য পাওয়া যায়নি</p>
                </div>
              ) : (
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6"
                      : "space-y-4"
                  }
                >
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      name_bn={product.name_bn}
                      slug={product.slug}
                      image_url={product.images?.[0] || "/placeholder.svg"}
                      base_price={product.base_price}
                      sale_price={product.sale_price}
                      is_featured={product.is_featured}
                      stock_quantity={product.stock_quantity || 0}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Shop;
