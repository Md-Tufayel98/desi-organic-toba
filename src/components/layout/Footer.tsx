import { Link } from "react-router-dom";
import { Leaf, Phone, Mail, MapPin, Facebook, Instagram, Youtube } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border">
      {/* Main Footer */}
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full gradient-organic flex items-center justify-center">
                <Leaf className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-primary">অর্গানিক স্টোর</h2>
                <p className="text-[10px] text-muted-foreground">প্রকৃতির স্পর্শে স্বাস্থ্যকর জীবন</p>
              </div>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              আমরা সরাসরি কৃষকদের কাছ থেকে সংগ্রহ করা ১০০% খাঁটি ও অর্গানিক পণ্য সরবরাহ করি। কোনো রাসায়নিক বা ভেজাল নেই।
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-3">
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="Youtube"
              >
                <Youtube className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">দ্রুত লিংক</h3>
            <ul className="space-y-2.5">
              {[
                { name: "সকল পণ্য", href: "/products" },
                { name: "আমাদের সম্পর্কে", href: "/about" },
                { name: "যোগাযোগ", href: "/contact" },
                { name: "ব্লগ", href: "/blog" },
                { name: "FAQ", href: "/faq" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">গ্রাহক সেবা</h3>
            <ul className="space-y-2.5">
              {[
                { name: "আমার অর্ডার", href: "/account/orders" },
                { name: "রিটার্ন পলিসি", href: "/return-policy" },
                { name: "শিপিং পলিসি", href: "/shipping-policy" },
                { name: "প্রাইভেসি পলিসি", href: "/privacy-policy" },
                { name: "টার্মস & কন্ডিশন", href: "/terms" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">যোগাযোগ</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="tel:+8801XXXXXXXXX"
                  className="flex items-start gap-3 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Phone className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>+880 1XXX-XXXXXX</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@organicstore.com"
                  className="flex items-start gap-3 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>info@organicstore.com</span>
                </a>
              </li>
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>ঢাকা, বাংলাদেশ</span>
              </li>
            </ul>
            
            {/* Payment Methods */}
            <div className="mt-6">
              <h4 className="text-sm font-medium text-foreground mb-2">পেমেন্ট পদ্ধতি</h4>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="px-2 py-1 bg-muted rounded">ক্যাশ অন ডেলিভারি</span>
                <span className="px-2 py-1 bg-muted rounded">bKash</span>
                <span className="px-2 py-1 bg-muted rounded">Nagad</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border bg-muted/30">
        <div className="container py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} অর্গানিক স্টোর। সর্বস্বত্ব সংরক্ষিত।</p>
            <p className="text-xs">ডেভলাপার - ইফতিকার রহমান</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
