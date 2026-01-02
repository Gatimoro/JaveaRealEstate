'use client';

import { useMemo } from 'react';
import { Home, Building2, TrendingUp, MapPin, Euro, BarChart3, Clock } from 'lucide-react';
import type { Property } from '@/data/properties';
import { useLanguage } from '@/lib/i18n';

interface ListingStatisticsProps {
  properties: Property[];
  timestamp?: Date;
}

export default function ListingStatistics({ properties, timestamp = new Date() }: ListingStatisticsProps) {
  const { locale } = useLanguage();

  const translations = {
    es: {
      title: 'Estadísticas del Mercado',
      subtitle: 'Análisis actual de nuestras propiedades',
      total: 'Total de Propiedades',
      houses: 'Casas',
      apartments: 'Apartamentos',
      investments: 'Inversiones',
      plots: 'Parcelas',
      avgPrice: 'Precio Medio',
      minPrice: 'Precio Mínimo',
      maxPrice: 'Precio Máximo',
      totalValue: 'Valor Total del Mercado',
      lastUpdated: 'Última actualización',
    },
    en: {
      title: 'Market Statistics',
      subtitle: 'Current analysis of our properties',
      total: 'Total Properties',
      houses: 'Houses',
      apartments: 'Apartments',
      investments: 'Investments',
      plots: 'Land Plots',
      avgPrice: 'Average Price',
      minPrice: 'Minimum Price',
      maxPrice: 'Maximum Price',
      totalValue: 'Total Market Value',
      lastUpdated: 'Last updated',
    },
    ru: {
      title: 'Статистика Рынка',
      subtitle: 'Текущий анализ наших объектов',
      total: 'Всего Объектов',
      houses: 'Дома',
      apartments: 'Квартиры',
      investments: 'Инвестиции',
      plots: 'Участки',
      avgPrice: 'Средняя Цена',
      minPrice: 'Минимальная Цена',
      maxPrice: 'Максимальная Цена',
      totalValue: 'Общая Стоимость',
      lastUpdated: 'Последнее обновление',
    },
  };

  const t = translations[locale];

  // Calculate statistics (memoized to avoid recalculation)
  const stats = useMemo(() => {
    const houses = properties.filter(p => p.type === 'house');
    const apartments = properties.filter(p => p.type === 'apartment');
    const investments = properties.filter(p => p.type === 'investment');
    const plots = properties.filter(p => p.type === 'plot');

    const calculateStats = (props: Property[]) => {
      if (props.length === 0) return { count: 0, avg: 0, min: 0, max: 0, total: 0 };
      const prices = props.map(p => p.price);
      return {
        count: props.length,
        avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
        min: Math.min(...prices),
        max: Math.max(...prices),
        total: prices.reduce((a, b) => a + b, 0),
      };
    };

    return {
      total: properties.length,
      totalValue: properties.reduce((sum, p) => sum + p.price, 0),
      houses: calculateStats(houses),
      apartments: calculateStats(apartments),
      investments: calculateStats(investments),
      plots: calculateStats(plots),
    };
  }, [properties]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(locale === 'ru' ? 'ru-RU' : locale === 'en' ? 'en-GB' : 'es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : locale === 'en' ? 'en-GB' : 'es-ES', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  const typeStats = [
    {
      type: 'houses',
      icon: Home,
      label: t.houses,
      data: stats.houses,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500/10',
    },
    {
      type: 'apartments',
      icon: Building2,
      label: t.apartments,
      data: stats.apartments,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-500/10',
    },
    {
      type: 'investments',
      icon: TrendingUp,
      label: t.investments,
      data: stats.investments,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-500/10',
    },
    {
      type: 'plots',
      icon: MapPin,
      label: t.plots,
      data: stats.plots,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-500/10',
    },
  ];

  // Calculate percentage for each type for the bar chart
  const maxCount = Math.max(...typeStats.map(s => s.data.count), 1);

  return (
    <section className="py-16 bg-gradient-to-b from-background to-card/50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">{t.title}</h2>
          <p className="text-muted text-lg">{t.subtitle}</p>
          <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted">
            <Clock className="w-4 h-4" />
            <span>{t.lastUpdated}: {formatDate(timestamp)}</span>
          </div>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-card border border-border rounded-xl p-6 text-center hover:border-primary transition-colors">
            <div className="inline-flex p-3 bg-primary/10 rounded-lg mb-3">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <div className="text-3xl font-bold gradient-text mb-1">{stats.total}</div>
            <div className="text-muted text-sm">{t.total}</div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 text-center hover:border-primary transition-colors">
            <div className="inline-flex p-3 bg-green-500/10 rounded-lg mb-3">
              <Euro className="w-6 h-6 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-green-500 mb-1">
              {formatPrice(Math.round(stats.totalValue / stats.total))}
            </div>
            <div className="text-muted text-sm">{t.avgPrice}</div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 text-center hover:border-primary transition-colors">
            <div className="inline-flex p-3 bg-blue-500/10 rounded-lg mb-3">
              <TrendingUp className="w-6 h-6 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-500 mb-1">
              {formatPrice(stats.totalValue)}
            </div>
            <div className="text-muted text-sm">{t.totalValue}</div>
          </div>
        </div>

        {/* Type Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {typeStats.map((stat) => {
            const Icon = stat.icon;
            const percentage = stats.total > 0 ? (stat.data.count / stats.total) * 100 : 0;

            return (
              <div key={stat.type} className="bg-card border border-border rounded-xl p-6 hover:border-primary transition-all hover-glow">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 ${stat.bgColor} rounded-lg`}>
                    <Icon className="w-5 h-5" style={{ color: stat.color.split(' ')[0].replace('from-', '') }} />
                  </div>
                  <h3 className="font-semibold">{stat.label}</h3>
                </div>

                {/* Count */}
                <div className="text-3xl font-bold gradient-text mb-1">{stat.data.count}</div>

                {/* Percentage Bar */}
                <div className="w-full bg-background rounded-full h-2 mb-4">
                  <div
                    className={`h-2 rounded-full bg-gradient-to-r ${stat.color}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                {/* Price Stats */}
                {stat.data.count > 0 && (
                  <div className="space-y-2 text-sm border-t border-border pt-4">
                    <div className="flex justify-between">
                      <span className="text-muted">{t.avgPrice}:</span>
                      <span className="font-semibold">{formatPrice(stat.data.avg)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">{t.minPrice}:</span>
                      <span className="font-semibold text-green-500">{formatPrice(stat.data.min)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">{t.maxPrice}:</span>
                      <span className="font-semibold text-orange-500">{formatPrice(stat.data.max)}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Simple Bar Chart */}
        <div className="bg-card border border-border rounded-xl p-8">
          <h3 className="text-xl font-bold mb-6 text-center">Distribución por Tipo</h3>
          <div className="flex items-end justify-center gap-4 h-64">
            {typeStats.map((stat) => {
              const height = stat.data.count > 0 ? (stat.data.count / maxCount) * 100 : 0;

              return (
                <div key={stat.type} className="flex flex-col items-center flex-1 max-w-24">
                  <div className="w-full flex flex-col justify-end h-full">
                    <div
                      className={`w-full bg-gradient-to-t ${stat.color} rounded-t-lg transition-all duration-500 hover:opacity-80 relative group`}
                      style={{ height: `${height}%`, minHeight: stat.data.count > 0 ? '20px' : '0' }}
                    >
                      {stat.data.count > 0 && (
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-background border border-border rounded px-2 py-1 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {stat.data.count}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 text-center">
                    <div className="text-sm font-semibold">{stat.label}</div>
                    <div className="text-xs text-muted">{stat.data.count}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
