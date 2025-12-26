'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'backdrop-blur-nav border-b border-border' : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg" />
            <span className="text-xl font-bold">Jávea Real Estate</span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="text-foreground hover:text-primary transition-colors"
            >
              Inicio
            </Link>
            <a
              href="#nosotros"
              className="text-foreground hover:text-primary transition-colors"
            >
              Nosotros
            </a>
            <a
              href="#contacto"
              className="text-foreground hover:text-primary transition-colors"
            >
              Contacto
            </a>
          </div>

          {/* CTA Button */}
          <button className="px-6 py-2 bg-white text-background font-semibold rounded-lg hover-glow transition-all">
            Publicar propiedad
          </button>
        </div>
      </div>
    </nav>
  );
}
