'use client';

import { useLanguage } from '@/lib/i18n';
import { TrendingUp, Globe, Zap, Shield } from 'lucide-react';

export default function AboutSection() {
  const { locale } = useLanguage();

  const translations = {
    es: {
      title: 'Sobre Miraluna',
      subtitle: 'Demo de agregador inmobiliario para Jávea y Costa Blanca',
      description:
        'Miraluna es un proyecto de demostración de una plataforma agregadora de inmuebles especializada en Jávea y la Costa Blanca. Este sitio muestra cómo funcionará el agregador definitivo, reuniendo propiedades de múltiples fuentes en un solo lugar para facilitar tu búsqueda del hogar perfecto.',
      comingSoon: 'Próximamente lanzaremos la versión completa con:',
      features: [
        {
          icon: TrendingUp,
          title: 'Datos en Tiempo Real',
          description: 'Actualizaciones diarias de precios y disponibilidad',
        },
        {
          icon: Globe,
          title: 'Múltiples Fuentes',
          description: 'Agregamos propiedades de todas las principales plataformas',
        },
        {
          icon: Zap,
          title: 'Búsqueda Avanzada',
          description: 'Filtros inteligentes y alertas personalizadas',
        },
        {
          icon: Shield,
          title: 'Verificación',
          description: 'Información verificada y actualizada constantemente',
        },
      ],
    },
    en: {
      title: 'About Miraluna',
      subtitle: 'Real Estate Aggregator Demo for Jávea and Costa Blanca',
      description:
        'Miraluna is a demonstration project of a property aggregator platform specialized in Jávea and Costa Blanca. This site showcases how the definitive aggregator will work, bringing together properties from multiple sources in one place to make finding your perfect home easier.',
      comingSoon: 'Coming soon with the full version:',
      features: [
        {
          icon: TrendingUp,
          title: 'Real-Time Data',
          description: 'Daily price and availability updates',
        },
        {
          icon: Globe,
          title: 'Multiple Sources',
          description: 'We aggregate properties from all major platforms',
        },
        {
          icon: Zap,
          title: 'Advanced Search',
          description: 'Smart filters and personalized alerts',
        },
        {
          icon: Shield,
          title: 'Verification',
          description: 'Constantly updated and verified information',
        },
      ],
    },
    ru: {
      title: 'О Miraluna',
      subtitle: 'Демо-агрегатор недвижимости для Хавеи и Коста-Бланки',
      description:
        'Miraluna - это демонстрационный проект платформы-агрегатора недвижимости, специализирующейся на Хавеи и Коста-Бланке. Этот сайт показывает, как будет работать окончательный агрегатор, объединяя объекты недвижимости из нескольких источников в одном месте, чтобы упростить поиск вашего идеального дома.',
      comingSoon: 'Скоро выйдет полная версия с:',
      features: [
        {
          icon: TrendingUp,
          title: 'Данные в реальном времени',
          description: 'Ежедневные обновления цен и доступности',
        },
        {
          icon: Globe,
          title: 'Множество источников',
          description: 'Мы агрегируем недвижимость со всех основных платформ',
        },
        {
          icon: Zap,
          title: 'Расширенный поиск',
          description: 'Умные фильтры и персонализированные оповещения',
        },
        {
          icon: Shield,
          title: 'Проверка',
          description: 'Постоянно обновляемая и проверенная информация',
        },
      ],
    },
  };

  const t = translations[locale];

  return (
    <section id="nosotros" className="py-20 bg-card/30">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">{t.title}</h2>
          <p className="text-xl text-primary font-semibold mb-6">{t.subtitle}</p>
          <p className="text-lg text-muted leading-relaxed">{t.description}</p>
        </div>

        <div className="max-w-5xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-12">{t.comingSoon}</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {t.features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-card border border-border rounded-xl p-6 text-center hover:border-primary transition-colors"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="font-bold mb-2">{feature.title}</h4>
                  <p className="text-sm text-muted">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
