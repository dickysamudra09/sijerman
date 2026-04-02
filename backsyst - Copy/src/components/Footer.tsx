import { GraduationCap, Mail, MapPin, Phone, Facebook, Twitter, Instagram, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-primary" />
              <span className="font-bold">EduPlatform</span>
            </div>
            <p className="text-muted-foreground text-sm">
              Platform pembelajaran online terbaik untuk siswa Indonesia. 
              Dengan metode interaktif dan materi berkualitas tinggi.
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm">
                <Facebook className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Twitter className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Instagram className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Youtube className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Courses */}
          <div>
            <h4 className="font-medium mb-4">Course</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Button variant="link" className="p-0 h-auto text-sm text-muted-foreground">
                  Kelas A-1
                </Button>
              </li>
              <li>
                <Button variant="link" className="p-0 h-auto text-sm text-muted-foreground">
                  Kelas A-2
                </Button>
              </li>
              <li>
                <Button variant="link" className="p-0 h-auto text-sm text-muted-foreground">
                  Course Gratis
                </Button>
              </li>
              <li>
                <Button variant="link" className="p-0 h-auto text-sm text-muted-foreground">
                  Sertifikasi
                </Button>
              </li>
              <li>
                <Button variant="link" className="p-0 h-auto text-sm text-muted-foreground">
                  Webinar
                </Button>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-medium mb-4">Dukungan</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Button variant="link" className="p-0 h-auto text-sm text-muted-foreground">
                  FAQ
                </Button>
              </li>
              <li>
                <Button variant="link" className="p-0 h-auto text-sm text-muted-foreground">
                  Bantuan
                </Button>
              </li>
              <li>
                <Button variant="link" className="p-0 h-auto text-sm text-muted-foreground">
                  Kontak
                </Button>
              </li>
              <li>
                <Button variant="link" className="p-0 h-auto text-sm text-muted-foreground">
                  Forum Komunitas
                </Button>
              </li>
              <li>
                <Button variant="link" className="p-0 h-auto text-sm text-muted-foreground">
                  Status Sistem
                </Button>
              </li>
            </ul>
          </div>

          {/* Contact & Newsletter */}
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-4">Kontak</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>support@eduplatform.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>+62 21 1234 5678</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>Jakarta, Indonesia</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-4">Newsletter</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Dapatkan update terbaru tentang course baru dan tips belajar
              </p>
              <div className="flex gap-2">
                <Input 
                  placeholder="Email Anda" 
                  className="flex-1"
                />
                <Button size="sm">
                  Subscribe
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            &copy; 2025 EduPlatform. Semua hak dilindungi.
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Button variant="link" className="p-0 h-auto text-sm text-muted-foreground">
              Kebijakan Privasi
            </Button>
            <Button variant="link" className="p-0 h-auto text-sm text-muted-foreground">
              Syarat & Ketentuan
            </Button>
            <Button variant="link" className="p-0 h-auto text-sm text-muted-foreground">
              Cookies
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}