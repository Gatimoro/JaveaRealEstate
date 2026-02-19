'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Globe,
  ChevronDown,
  User,
  LogOut,
  Building2,
  Home,
  Key,
  Heart,
  MoreHorizontal,
  Menu
} from 'lucide-react';
import { useLanguage, locales, languageNames, languageFlags, type Locale } from '@/lib/i18n';
import MiralunaLogo from './MiralunaLogo';
import { createClient } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface CategoryNavProps {
  showCategories?: boolean;
}

export default function CategoryNav({ showCategories = true }: CategoryNavProps) {
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { locale, setLocale } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();

  // Check auth status
  useEffect(() => {
    const supabase = createClient();

    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignIn = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) console.error('Error signing in:', error);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setShowUserMenu(false);
    router.refresh();
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowLangMenu(false);
      setShowUserMenu(false);
      setShowMoreMenu(false);
    };
    if (showLangMenu || showUserMenu || showMoreMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showLangMenu, showUserMenu, showMoreMenu]);

  const translations = {
    es: {
      newBuildings: 'Obra nueva',
      sale: 'Venta',
      rent: 'Alquiler',
      saved: 'Guardados',
      more: 'Más',
      signIn: 'Iniciar sesión',
      signOut: 'Cerrar sesión',
      myProfile: 'Mi Perfil',
      about: 'Nosotros',
      contact: 'Contacto',
      search: 'Buscar',
      filters: 'Filtros',
      map: 'Mapa',
      categories: 'Categorías',
    },
    en: {
      newBuildings: 'New Buildings',
      sale: 'Sale',
      rent: 'Rent',
      saved: 'Saved',
      more: 'More',
      signIn: 'Sign in',
      signOut: 'Sign out',
      myProfile: 'My Profile',
      about: 'About',
      contact: 'Contact',
      search: 'Search',
      filters: 'Filters',
      map: 'Map',
      categories: 'Categories',
    },
    ru: {
      newBuildings: 'Новостройки',
      sale: 'Продажа',
      rent: 'Аренда',
      saved: 'Сохраненные',
      more: 'Еще',
      signIn: 'Войти',
      signOut: 'Выйти',
      myProfile: 'Мой профиль',
      about: 'О нас',
      contact: 'Контакты',
      search: 'Поиск',
      filters: 'Фильтры',
      map: 'Карта',
      categories: 'Категории',
    },
  };

  const t = translations[locale];

  const categories = [
    { id: 'new-buildings', label: t.newBuildings, icon: Building2, href: '/categoria/obra-nueva' },
    { id: 'sale', label: t.sale, icon: Home, href: '/categoria/venta' },
    { id: 'rent', label: t.rent, icon: Key, href: '/categoria/alquiler' },
    { id: 'saved', label: t.saved, icon: Heart, href: '/profile' },
  ];

  const isActiveCategory = (href: string) => pathname?.startsWith(href);

  return (
    <nav className="sticky top-0 left-0 right-0 z-50 bg-background border-b border-border">
      {/* Top bar - Logo + Location + Auth + Language */}
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo + Location */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <MiralunaLogo className="w-8 h-8 flex-shrink-0" />
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
              <span className="text-xl font-bold">
                mira<span className="text-primary">luna</span>
              </span>
              <span className="text-xs sm:text-sm text-muted-foreground">Valencia</span>
            </div>
          </Link>

          {/* Right side: Auth + Language */}
          <div className="flex items-center gap-2">
            {/* User Auth */}
            {loading ? (
              <div className="w-10 h-10 rounded-full bg-card animate-pulse" />
            ) : user ? (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowUserMenu(!showUserMenu);
                  }}
                  className="flex items-center gap-1 px-2 py-2 rounded-lg border border-border hover:border-primary transition-colors"
                >
                  <User className="w-4 h-4" />
                  <ChevronDown className={`w-3 h-3 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-sm font-medium truncate">{user.user_metadata?.full_name || user.email}</p>
                      <p className="text-xs text-muted truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        router.push('/profile');
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-primary/10 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      <span>{t.myProfile}</span>
                    </button>
                    <button
                      onClick={handleSignOut}
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
                onClick={handleSignIn}
                className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-orange-500 transition-colors font-semibold text-sm"
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
                className="flex items-center gap-1 px-2 py-2 rounded-lg border border-border hover:border-primary transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span className="text-xs font-medium">{locale.toUpperCase()}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showLangMenu ? 'rotate-180' : ''}`} />
              </button>

              {showLangMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50">
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

      {/* Category quick access buttons - Show/hide based on prop */}
      {showCategories && (
        <>
          {/* Mobile: Expandable menu */}
          <div className="md:hidden border-t border-border">
            <button
              onClick={() => setShowCategoryMenu(!showCategoryMenu)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-primary/5 transition-colors"
            >
              <span className="font-medium flex items-center gap-2">
                <Menu className="w-4 h-4" />
                {t.categories}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showCategoryMenu ? 'rotate-180' : ''}`} />
            </button>

            {showCategoryMenu && (
              <div className="border-t border-border bg-muted/30">
                <div className="container mx-auto px-4 py-2 space-y-2">
                  {categories.map((category) => {
                    const Icon = category.icon;
                    const isActive = isActiveCategory(category.href);

                    return (
                      <Link
                        key={category.id}
                        href={category.href}
                        onClick={() => setShowCategoryMenu(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-primary text-white'
                            : 'hover:bg-primary/10 text-foreground'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{category.label}</span>
                      </Link>
                    );
                  })}

                  {/* More menu items */}
                  <div className="border-t border-border pt-2">
                    <a
                      href="#nosotros"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary/10 transition-colors"
                      onClick={() => setShowCategoryMenu(false)}
                    >
                      <span>{t.about}</span>
                    </a>
                    <a
                      href="#contacto"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary/10 transition-colors"
                      onClick={() => setShowCategoryMenu(false)}
                    >
                      <span>{t.contact}</span>
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Desktop: Always visible */}
          <div className="hidden md:block border-t border-border">
            <div className="container mx-auto px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                {/* Main categories */}
                {categories.map((category) => {
                  const Icon = category.icon;
                  const isActive = isActiveCategory(category.href);

                  return (
                    <Link
                      key={category.id}
                      href={category.href}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-primary text-white'
                          : 'hover:bg-primary/10 text-foreground'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{category.label}</span>
                    </Link>
                  );
                })}

                {/* More menu */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMoreMenu(!showMoreMenu);
                    }}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg hover:bg-primary/10 transition-colors"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                    <span className="text-sm font-medium">{t.more}</span>
                  </button>

                  {showMoreMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                      <a
                        href="#nosotros"
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-primary/10 transition-colors"
                        onClick={() => setShowMoreMenu(false)}
                      >
                        <span>{t.about}</span>
                      </a>
                      <a
                        href="#contacto"
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-primary/10 transition-colors"
                        onClick={() => setShowMoreMenu(false)}
                      >
                        <span>{t.contact}</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
