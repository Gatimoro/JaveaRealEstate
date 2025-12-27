'use client';

import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';
import MiralunaLogo from './MiralunaLogo';
import { useLanguage } from '@/lib/i18n';

export default function Footer() {
  const { locale } = useLanguage();

  const translations = {
    es: {
      tagline: 'Tu portal de confianza para encontrar propiedades en la Costa Blanca',
      navigation: 'Navegación',
      home: 'Inicio',
      about: 'Nosotros',
      contact: 'Contacto',
      listProperty: 'Publicar propiedad',
      categories: 'Categorías',
      houses: 'Casas y Pisos',
      investments: 'Inversiones',
      plots: 'Parcelas',
      contactUs: 'Contacto',
      location: 'Jávea, Alicante, España',
      rights: '© 2025 miraluna. Todos los derechos reservados.',
    },
    en: {
      tagline: 'Your trusted portal for finding properties on the Costa Blanca',
      navigation: 'Navigation',
      home: 'Home',
      about: 'About',
      contact: 'Contact',
      listProperty: 'List property',
      categories: 'Categories',
      houses: 'Houses & Apartments',
      investments: 'Investments',
      plots: 'Plots',
      contactUs: 'Contact',
      location: 'Jávea, Alicante, Spain',
      rights: '© 2025 miraluna. All rights reserved.',
    },
    ru: {
      tagline: 'Ваш надежный портал для поиска недвижимости на Коста Бланка',
      navigation: 'Навигация',
      home: 'Главная',
      about: 'О нас',
      contact: 'Контакты',
      listProperty: 'Разместить объявление',
      categories: 'Категории',
      houses: 'Дома и квартиры',
      investments: 'Инвестиции',
      plots: 'Участки',
      contactUs: 'Контакты',
      location: 'Хавеа, Аликанте, Испания',
      rights: '© 2025 miraluna. Все права защищены.',
    },
  };

  const t = translations[locale];

  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Logo & Description */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <MiralunaLogo className="w-10 h-10" />
              <span className="text-xl font-bold">
                mira<span className="text-primary">luna</span>
              </span>
            </div>
            <p className="text-sm text-muted">
              {t.tagline}
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-semibold mb-4">{t.navigation}</h3>
            <ul className="space-y-2 text-sm text-muted">
              <li>
                <a href="#inicio" className="hover:text-primary transition-colors">
                  {t.home}
                </a>
              </li>
              <li>
                <a href="#nosotros" className="hover:text-primary transition-colors">
                  {t.about}
                </a>
              </li>
              <li>
                <a href="#contacto" className="hover:text-primary transition-colors">
                  {t.contact}
                </a>
              </li>
              <li>
                <a href="#publicar" className="hover:text-primary transition-colors">
                  {t.listProperty}
                </a>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold mb-4">{t.categories}</h3>
            <ul className="space-y-2 text-sm text-muted">
              <li>
                <a href="#casas" className="hover:text-primary transition-colors">
                  {t.houses}
                </a>
              </li>
              <li>
                <a href="#inversiones" className="hover:text-primary transition-colors">
                  {t.investments}
                </a>
              </li>
              <li>
                <a href="#parcelas" className="hover:text-primary transition-colors">
                  {t.plots}
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4">{t.contactUs}</h3>
            <ul className="space-y-3 text-sm text-muted">
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{t.location}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>+34 XXX XXX XXX</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>info@miraluna.es</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted">
            {t.rights}
          </p>

          {/* Social Icons */}
          <div className="flex items-center gap-4">
            <a
              href="#"
              className="text-muted hover:text-primary transition-colors"
              aria-label="Facebook"
            >
              <Facebook className="w-5 h-5" />
            </a>
            <a
              href="#"
              className="text-muted hover:text-primary transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href="#"
              className="text-muted hover:text-primary transition-colors"
              aria-label="Twitter"
            >
              <Twitter className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
