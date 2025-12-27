'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Globe, ChevronDown, User, LogOut } from 'lucide-react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useLanguage, locales, languageNames, languageFlags, type Locale } from '@/lib/i18n';
import MiralunaLogo from './MiralunaLogo';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { locale, setLocale } = useLanguage();
  const { data: session, status } = useSession();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowLangMenu(false);
      setShowUserMenu(false);
    };
    if (showLangMenu || showUserMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showLangMenu, showUserMenu]);

  const translations = {
    es: {
      inicio: 'Inicio',
      nosotros: 'Nosotros',
      contacto: 'Contacto',
      signIn: 'Iniciar sesión',
      signOut: 'Cerrar sesión',
      myAccount: 'Mi cuenta',
    },
    en: {
      inicio: 'Home',
      nosotros: 'About',
      contacto: 'Contact',
      signIn: 'Sign in',
      signOut: 'Sign out',
      myAccount: 'My account',
    },
    ru: {
      inicio: 'Главная',
      nosotros: 'О нас',
      contacto: 'Контакты',
      signIn: 'Войти',
      signOut: 'Выйти',
      myAccount: 'Мой аккаунт',
    },
  };

  const t = translations[locale];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
        scrolled
          ? 'backdrop-blur-nav border-border'
          : 'bg-transparent border-transparent'
      }`}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <MiralunaLogo className="w-10 h-10 flex-shrink-0" />
            <span className="text-xl md:text-2xl font-bold">
              mira<span className="text-primary">luna</span>
            </span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="text-foreground hover:text-primary transition-colors"
            >
              {t.inicio}
            </Link>
            <a
              href="#nosotros"
              className="text-foreground hover:text-primary transition-colors"
            >
              {t.nosotros}
            </a>
            <a
              href="#contacto"
              className="text-foreground hover:text-primary transition-colors"
            >
              {t.contacto}
            </a>
          </div>

          {/* Right side: Auth + Language */}
          <div className="flex items-center gap-3">
            {/* User Auth */}
            {status === 'loading' ? (
              <div className="w-10 h-10 rounded-full bg-card animate-pulse" />
            ) : session?.user ? (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowUserMenu(!showUserMenu);
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:border-primary transition-colors"
                >
                  {session.user.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                  <span className="hidden md:inline text-sm font-medium">
                    {session.user.name?.split(' ')[0]}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* User Dropdown */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-sm font-medium">{session.user.name}</p>
                      <p className="text-xs text-muted truncate">{session.user.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        signOut();
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-primary/10 transition-colors text-red-600"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{t.signOut}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => signIn('google')}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-500 transition-colors font-semibold text-sm"
              >
                {t.signIn}
              </button>
            )}

            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowLangMenu(!showLangMenu);
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:border-primary transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">{languageFlags[locale]}</span>
                <span className="text-sm font-medium">{locale.toUpperCase()}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showLangMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Language Dropdown */}
              {showLangMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                  {locales.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        setLocale(lang);
                        setShowLangMenu(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-primary/10 transition-colors ${
                        locale === lang ? 'bg-primary/20 text-primary' : ''
                      }`}
                    >
                      <span className="text-xl">{languageFlags[lang]}</span>
                      <span className="font-medium">{languageNames[lang]}</span>
                      {locale === lang && (
                        <span className="ml-auto text-primary">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
