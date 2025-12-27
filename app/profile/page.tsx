'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { User } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PropertyCard from '@/components/PropertyCard';
import InvestmentCard from '@/components/InvestmentCard';
import PlotCard from '@/components/PlotCard';
import { useSavedProperties } from '@/lib/savedProperties';
import { allProperties } from '@/data/properties';
import type { Property } from '@/data/properties';
import { useLanguage } from '@/lib/i18n';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { savedProperties } = useSavedProperties();
  const { locale } = useLanguage();

  const translations = {
    es: {
      myProfile: 'Mi Perfil',
      savedProperties: 'Propiedades Guardadas',
      noSaved: 'No tienes propiedades guardadas',
      noSavedDesc: 'Empieza a guardar propiedades que te interesen para verlas aquí.',
      browseProperties: 'Ver Propiedades',
      signInRequired: 'Inicia sesión para ver tu perfil',
      loading: 'Cargando...',
      property: 'propiedad',
      properties: 'propiedades',
    },
    en: {
      myProfile: 'My Profile',
      savedProperties: 'Saved Properties',
      noSaved: 'You have no saved properties',
      noSavedDesc: 'Start saving properties you\'re interested in to see them here.',
      browseProperties: 'Browse Properties',
      signInRequired: 'Sign in to view your profile',
      loading: 'Loading...',
      property: 'property',
      properties: 'properties',
    },
    ru: {
      myProfile: 'Мой Профиль',
      savedProperties: 'Сохраненные объекты',
      noSaved: 'У вас нет сохраненных объектов',
      noSavedDesc: 'Начните сохранять интересующие вас объекты, чтобы увидеть их здесь.',
      browseProperties: 'Просмотреть объекты',
      signInRequired: 'Войдите, чтобы просмотреть свой профиль',
      loading: 'Загрузка...',
      property: 'объект',
      properties: 'объектов',
    },
  };

  const t = translations[locale];

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-xl text-muted">{t.loading}</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-xl text-muted">{t.signInRequired}</p>
      </div>
    );
  }

  const savedPropertiesList = allProperties.filter(p => savedProperties.includes(p.id));

  const renderPropertyCard = (property: Property) => {
    switch (property.type) {
      case 'investment':
        return <InvestmentCard key={property.id} property={property} />;
      case 'plot':
        return <PlotCard key={property.id} property={property} />;
      default:
        return <PropertyCard key={property.id} property={property} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-24">
        {/* Profile Header */}
        <div className="mb-12">
          <div className="flex items-center gap-6">
            {session.user.image ? (
              <img
                src={session.user.image}
                alt={session.user.name || 'User'}
                className="w-24 h-24 rounded-full border-4 border-primary"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary/10 border-4 border-primary flex items-center justify-center">
                <User className="w-12 h-12 text-primary" />
              </div>
            )}
            <div>
              <h1 className="text-4xl font-bold mb-2">{t.myProfile}</h1>
              <p className="text-xl text-muted">{session.user.name}</p>
              <p className="text-muted">{session.user.email}</p>
            </div>
          </div>
        </div>

        {/* Saved Properties Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold">
              {t.savedProperties} ({savedPropertiesList.length}{' '}
              {savedPropertiesList.length === 1 ? t.property : t.properties})
            </h2>
          </div>

          {savedPropertiesList.length > 0 ? (
            <div
              className="grid gap-6"
              style={{
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))',
              }}
            >
              {savedPropertiesList.map(renderPropertyCard)}
            </div>
          ) : (
            <div className="text-center py-16 bg-card border border-border rounded-xl">
              <p className="text-xl font-semibold mb-2">{t.noSaved}</p>
              <p className="text-muted mb-6">{t.noSavedDesc}</p>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-orange-500 transition-colors font-semibold"
              >
                {t.browseProperties}
              </button>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
