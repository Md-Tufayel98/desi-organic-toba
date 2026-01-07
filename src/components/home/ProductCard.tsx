import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { trackAddToCart } from "@/lib/tracking";

interface ProductCardProps {
  id: string;
  name_bn: string;
  slug: string;
  image_url?: string;
  base_price: number;
  sale_price?: number | null;
  rating?: number;
  reviews_count?: number;
  is_featured?: boolean;
  stock_quantity?: number;
  onAddToCart?: () => void;
}

const ProductCard = ({
  id,
  name_bn,
  slug,
  image_url,
  base_price,
  sale_price,
  rating = 0,
  reviews_count = 0,
  is_featured = false,
  stock_quantity = 0,
  onAddToCart,
}: ProductCardProps) => {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { toast } = useToast();
  
  const hasDiscount = sale_price && sale_price < base_price;
  const discountPercentage = hasDiscount
    ? Math.round(((base_price - sale_price) / base_price) * 100)
    : 0;
  const isOutOfStock = stock_quantity <= 0;

  const formatPrice = (price: number) => {
    return `৳${price.toLocaleString("bn-BD")}`;
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isOutOfStock) return;

    addItem({
      productId: id,
      name_bn: name_bn,
      image_url: image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=300&fit=crop",
      price: sale_price || base_price,
      quantity: 1,
      stock_quantity: stock_quantity,
    });

    // Track AddToCart event
    trackAddToCart({
      content_name: name_bn,
      content_ids: [id],
      content_type: 'product',
      value: sale_price || base_price,
      currency: 'BDT',
    });

    toast({
      title: "কার্টে যোগ হয়েছে",
      description: name_bn,
    });

    // Navigate to cart page
    navigate("/cart");
  };

  return (
    <div className="group bg-card rounded-xl overflow-hidden border border-border shadow-card hover:shadow-hover transition-all duration-300">
      {/* Image */}
      <Link to={`/product/${slug}`} className="block relative aspect-square overflow-hidden">
        <img
          src={image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=300&fit=crop"}
          alt={name_bn}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {is_featured && (
            <Badge className="bg-accent text-accent-foreground text-xs">
              বিশেষ
            </Badge>
          )}
          {hasDiscount && (
            <Badge className="bg-destructive text-destructive-foreground text-xs">
              {discountPercentage}% ছাড়
            </Badge>
          )}
        </div>

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-foreground/60 flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">স্টক শেষ</span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Rating */}
        {rating > 0 && (
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-medium text-foreground">{rating.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">({reviews_count})</span>
          </div>
        )}

        {/* Name */}
        <Link to={`/product/${slug}`}>
          <h3 className="font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
            {name_bn}
          </h3>
        </Link>

        {/* Price & Cart - Desktop */}
        <div className="hidden md:flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-primary">
              {formatPrice(sale_price || base_price)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(base_price)}
              </span>
            )}
          </div>

          <Button
            size="icon"
            variant="outline"
            className="h-9 w-9 rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>

        {/* Price & Cart - Mobile */}
        <div className="md:hidden space-y-3">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-primary">
              {formatPrice(sale_price || base_price)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(base_price)}
              </span>
            )}
          </div>

          <Button
            variant="outline"
            className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            কার্টে যোগ করুন
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
