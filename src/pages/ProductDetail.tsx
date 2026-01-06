import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Star, Minus, Plus, ShoppingCart, Truck, Shield, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import TopNotificationBar from "@/components/layout/TopNotificationBar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MiniCartPopup from "@/components/cart/MiniCartPopup";

interface ProductVariant {
  id: string;
  name_bn: string;
  weight_value: number;
  weight_unit: string;
  price: number;
  sale_price?: number | null;
  stock_quantity: number;
  is_default: boolean;
}

const ProductDetail = () => {
  const { slug } = useParams();
  const { addItem, getItemCount, getSubtotal } = useCart();
  const { toast } = useToast();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showMiniCart, setShowMiniCart] = useState(false);
  const [addedItem, setAddedItem] = useState<{
    name_bn: string;
    variant_name_bn?: string;
    image_url: string;
    price: number;
    quantity: number;
  } | null>(null);

  // Demo product data - will be replaced with Supabase fetch
  const product = {
    id: "2",
    name: "Pure Deshi Ghee",
    name_bn: "খাঁটি গাওয়া ঘি",
    slug: "pure-deshi-ghee",
    description_bn: "গ্রামের খাঁটি গাওয়া ঘি। দুধের সর থেকে তৈরি। কোনো ভেজাল বা রাসায়নিক নেই। রান্নায় অতুলনীয় স্বাদ এবং সুগন্ধ যোগ করে। শিশু থেকে বয়স্ক সবার জন্য নিরাপদ।",
    images: [
      "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1612187376442-b9a4899d2bf4?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&h=600&fit=crop",
    ],
    category: { name_bn: "ঘি", slug: "ghee" },
    base_price: 1200,
    sale_price: null,
    rating: 4.9,
    reviews_count: 89,
    stock_quantity: 30,
    is_featured: true,
    variants: [
      { id: "v1", name_bn: "২৫০ গ্রাম", weight_value: 250, weight_unit: "g", price: 350, sale_price: null, stock_quantity: 50, is_default: false },
      { id: "v2", name_bn: "৫০০ গ্রাম", weight_value: 500, weight_unit: "g", price: 650, sale_price: 600, stock_quantity: 30, is_default: true },
      { id: "v3", name_bn: "১ কেজি", weight_value: 1000, weight_unit: "g", price: 1200, sale_price: null, stock_quantity: 20, is_default: false },
    ],
  };

  // Demo reviews
  const reviews = [
    { id: "1", customer_name: "রহিম উদ্দিন", rating: 5, comment: "অসাধারণ মানের ঘি। রান্নায় আলাদা স্বাদ।", created_at: "2024-01-15" },
    { id: "2", customer_name: "ফাতেমা বেগম", rating: 5, comment: "খুবই ভালো। পরিবারের সবাই পছন্দ করেছে।", created_at: "2024-01-10" },
    { id: "3", customer_name: "করিম সাহেব", rating: 4, comment: "ডেলিভারি দ্রুত হয়েছে। মান ভালো।", created_at: "2024-01-05" },
  ];

  // Set default variant
  useState(() => {
    const defaultVariant = product.variants.find((v) => v.is_default) || product.variants[0];
    setSelectedVariant(defaultVariant);
  });

  const currentPrice = selectedVariant?.sale_price || selectedVariant?.price || product.sale_price || product.base_price;
  const originalPrice = selectedVariant?.price || product.base_price;
  const hasDiscount = selectedVariant?.sale_price || product.sale_price;
  const discountPercentage = hasDiscount ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0;
  const stockQuantity = selectedVariant?.stock_quantity || product.stock_quantity;
  const isOutOfStock = stockQuantity <= 0;

  const formatPrice = (price: number) => `৳${price.toLocaleString("bn-BD")}`;

  const handleAddToCart = () => {
    if (isOutOfStock) return;

    addItem({
      productId: product.id,
      variantId: selectedVariant?.id,
      name_bn: product.name_bn,
      variant_name_bn: selectedVariant?.name_bn,
      image_url: product.images[0],
      price: currentPrice,
      quantity: quantity,
      stock_quantity: stockQuantity,
    });

    setAddedItem({
      name_bn: product.name_bn,
      variant_name_bn: selectedVariant?.name_bn,
      image_url: product.images[0],
      price: currentPrice,
      quantity: quantity,
    });
    setShowMiniCart(true);
  };

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % product.images.length);
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <TopNotificationBar />
      <Header cartCount={getItemCount()} />

      <main className="flex-1 py-6">
        <div className="container">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link to="/" className="hover:text-primary">হোম</Link>
            <span>/</span>
            <Link to={`/category/${product.category.slug}`} className="hover:text-primary">
              {product.category.name_bn}
            </Link>
            <span>/</span>
            <span className="text-foreground">{product.name_bn}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted">
                <img
                  src={product.images[selectedImageIndex]}
                  alt={product.name_bn}
                  className="w-full h-full object-cover"
                />
                
                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  {product.is_featured && (
                    <Badge className="bg-accent text-accent-foreground">বিশেষ</Badge>
                  )}
                  {hasDiscount && (
                    <Badge className="bg-destructive text-destructive-foreground">
                      {discountPercentage}% ছাড়
                    </Badge>
                  )}
                </div>
              </div>

              {/* Thumbnails */}
              {product.images.length > 1 && (
                <div className="flex gap-3">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                        idx === selectedImageIndex ? "border-primary" : "border-border"
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  {product.name_bn}
                </h1>
                
                {/* Rating */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(product.rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium">{product.rating}</span>
                  <span className="text-sm text-muted-foreground">
                    ({product.reviews_count} রিভিউ)
                  </span>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-primary">
                  {formatPrice(currentPrice)}
                </span>
                {hasDiscount && (
                  <span className="text-xl text-muted-foreground line-through">
                    {formatPrice(originalPrice)}
                  </span>
                )}
              </div>

              {/* Variants */}
              {product.variants.length > 0 && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">
                    পরিমাণ বেছে নিন
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => {
                          setSelectedVariant(variant);
                          setQuantity(1);
                        }}
                        disabled={variant.stock_quantity <= 0}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                          selectedVariant?.id === variant.id
                            ? "border-primary bg-primary text-primary-foreground"
                            : variant.stock_quantity <= 0
                            ? "border-border bg-muted text-muted-foreground cursor-not-allowed"
                            : "border-border hover:border-primary"
                        }`}
                      >
                        {variant.name_bn}
                        {variant.sale_price && (
                          <span className="ml-1 text-xs">
                            ({formatPrice(variant.sale_price)})
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">
                  পরিমাণ
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-border rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-3 hover:bg-muted transition-colors"
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(stockQuantity, quantity + 1))}
                      className="p-3 hover:bg-muted transition-colors"
                      disabled={quantity >= stockQuantity}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {stockQuantity > 0 ? `${stockQuantity}টি স্টকে আছে` : "স্টক শেষ"}
                  </span>
                </div>
              </div>

              {/* Add to Cart */}
              <div className="flex gap-3">
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {isOutOfStock ? "স্টক শেষ" : "কার্টে যোগ করুন"}
                </Button>
                <Link to="/checkout" className="flex-1">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                    disabled={isOutOfStock}
                    onClick={handleAddToCart}
                  >
                    এখনই কিনুন
                  </Button>
                </Link>
              </div>

              {/* Benefits */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Truck className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">দ্রুত ডেলিভারি</p>
                    <p className="text-muted-foreground">২৪-৪৮ ঘণ্টা</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">মানি ব্যাক</p>
                    <p className="text-muted-foreground">গ্যারান্টি</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Check className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">১০০% খাঁটি</p>
                    <p className="text-muted-foreground">অর্গানিক</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs: Description & Reviews */}
          <div className="mt-12">
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent p-0">
                <TabsTrigger
                  value="description"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                >
                  বিবরণ
                </TabsTrigger>
                <TabsTrigger
                  value="reviews"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                >
                  রিভিউ ({product.reviews_count})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="description" className="mt-6">
                <div className="prose max-w-none">
                  <p className="text-foreground leading-relaxed">
                    {product.description_bn}
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="reviews" className="mt-6">
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="bg-card rounded-xl p-5 border border-border">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-primary font-bold">
                              {review.customer_name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{review.customer_name}</p>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${
                                    i < review.rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-muted"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">{review.created_at}</span>
                      </div>
                      <p className="text-foreground">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      <Footer />

      <MiniCartPopup
        isOpen={showMiniCart}
        onClose={() => setShowMiniCart(false)}
        addedItem={addedItem}
        cartTotal={getSubtotal()}
        cartItemCount={getItemCount()}
      />
    </div>
  );
};

export default ProductDetail;
