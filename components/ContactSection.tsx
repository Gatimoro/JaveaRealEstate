'use client';

import { useLanguage } from '@/lib/i18n';
import { Mail, MapPin, Globe } from 'lucide-react';

export default function ContactSection() {
  const { locale } = useLanguage();

  const translations = {
    es: {
      title: 'Contacto',
      subtitle: 'Este es un proyecto de demostración',
      description:
        'Miraluna está actualmente en fase de desarrollo. Cuando lancemos la plataforma completa, podrás contactarnos para consultas sobre propiedades, colaboraciones o simplemente para saber más sobre nuestro servicio de agregación.',
      stayTuned: 'Mantente informado',
      stayTunedDesc: 'Próximamente anunciaremos el lanzamiento oficial y los canales de contacto.',
      placeholders: [
        {
          icon: Mail,
          label: 'Email',
          value: 'Próximamente',
        },
        {
          icon: MapPin,
          label: 'Ubicación',
          value: 'Jávea, Costa Blanca, España',
        },
        {
          icon: Globe,
          label: 'Cobertura',
          value: 'Jávea y alrededores',
        },
      ],
    },
    en: {
      title: 'Contact',
      subtitle: 'This is a demonstration project',
      description:
        'Miraluna is currently under development. When we launch the full platform, you will be able to contact us for property inquiries, partnerships, or simply to learn more about our aggregation service.',
      stayTuned: 'Stay tuned',
      stayTunedDesc: 'We will soon announce the official launch and contact channels.',
      placeholders: [
        {
          icon: Mail,
          label: 'Email',
          value: 'Coming soon',
        },
        {
          icon: MapPin,
          label: 'Location',
          value: 'Jávea, Costa Blanca, Spain',
        },
        {
          icon: Globe,
          label: 'Coverage',
          value: 'Jávea and surroundings',
        },
      ],
    },
    ru: {
      title: 'Контакты',
      subtitle: 'Это демонстрационный проект',
      description:
        'Miraluna находится в стадии разработки. Когда мы запустим полную платформу, вы сможете связаться с нами по вопросам недвижимости, партнерства или просто чтобы узнать больше о нашем сервисе агрегации.',
      stayTuned: 'Следите за обновлениями',
      stayTunedDesc: 'Скоро мы объявим об официальном запуске и каналах связи.',
      placeholders: [
        {
          icon: Mail,
          label: 'Email',
          value: 'Скоро',
        },
        {
          icon: MapPin,
          label: 'Местоположение',
          value: 'Хавеа, Коста-Бланка, Испания',
        },
        {
          icon: Globe,
          label: 'Покрытие',
          value: 'Хавеа и окрестности',
        },
      ],
    },
  };

  const t = translations[locale];

  return (
    <section id="contacto" className="py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">{t.title}</h2>
            <p className="text-xl text-primary font-semibold mb-4">{t.subtitle}</p>
            <p className="text-lg text-muted leading-relaxed max-w-2xl mx-auto">
              {t.description}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {t.placeholders.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className="bg-card border border-border rounded-xl p-6 text-center hover:border-primary transition-colors"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="font-bold mb-2">{item.label}</h4>
                  <p className="text-sm text-muted">{item.value}</p>
                </div>
              );
            })}
          </div>

          <div className="bg-gradient-to-r from-primary/10 to-orange-500/10 border border-primary/20 rounded-xl p-8 text-center">
            <h3 className="text-2xl font-bold mb-2">{t.stayTuned}</h3>
            <p className="text-muted">{t.stayTunedDesc}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
