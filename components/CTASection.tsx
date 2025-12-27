'use client';

import { useLanguage } from '@/lib/i18n';

export default function CTASection() {
  const { locale } = useLanguage();

  const translations = {
    es: {
      question: '¿Tienes una propiedad en',
      subtitle: 'Publica tu propiedad de forma gratuita y conecta con miles de compradores potenciales',
      publishFree: 'Publicar gratis',
      noCommissions: 'Sin comisiones',
      immediatePublishing: 'Publicación inmediata',
      maxVisibility: 'Máxima visibilidad',
    },
    en: {
      question: 'Do you have a property in',
      subtitle: 'List your property for free and connect with thousands of potential buyers',
      publishFree: 'List for free',
      noCommissions: 'No commissions',
      immediatePublishing: 'Immediate publishing',
      maxVisibility: 'Maximum visibility',
    },
    ru: {
      question: 'У вас есть недвижимость в',
      subtitle: 'Разместите свою недвижимость бесплатно и свяжитесь с тысячами потенциальных покупателей',
      publishFree: 'Опубликовать бесплатно',
      noCommissions: 'Без комиссий',
      immediatePublishing: 'Немедленная публикация',
      maxVisibility: 'Максимальная видимость',
    },
  };

  const t = translations[locale];

  return (
    <section className="py-20 gradient-border">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-4xl md:text-5xl font-bold">
            {t.question}{' '}
            <span className="gradient-text">Jávea</span>?
          </h2>

          <p className="text-xl text-muted">
            {t.subtitle}
          </p>

          <div className="pt-4">
            <button className="px-8 py-4 bg-white text-background font-semibold rounded-lg hover-glow transition-all text-lg">
              {t.publishFree}
            </button>
          </div>

          <div className="pt-8 flex flex-wrap justify-center gap-8 text-sm text-muted">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <span>{t.noCommissions}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <span>{t.immediatePublishing}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <span>{t.maxVisibility}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
