import { TrendingUp, Home, MapPin, Euro } from 'lucide-react';
import { houses, investments, plots } from '@/data/properties';

export default function AnalyticsSection() {
  // Calculate analytics
  const totalProperties = houses.length + investments.length + plots.length;

  const avgHousePrice = Math.round(
    houses.reduce((sum, p) => sum + p.price, 0) / houses.length
  );

  const avgInvestmentPrice = Math.round(
    investments.reduce((sum, p) => sum + p.price, 0) / investments.length
  );

  const avgPlotPrice = Math.round(
    plots.reduce((sum, p) => sum + p.price, 0) / plots.length
  );

  const avgOverallPrice = Math.round(
    (houses.reduce((sum, p) => sum + p.price, 0) +
      investments.reduce((sum, p) => sum + p.price, 0) +
      plots.reduce((sum, p) => sum + p.price, 0)) /
      totalProperties
  );

  const avgHouseSize = Math.round(
    houses.reduce((sum, p) => sum + p.specs.size, 0) / houses.length
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const stats = [
    {
      icon: Home,
      title: 'Precio Medio Casas',
      value: formatPrice(avgHousePrice),
      change: '+5.2%',
      description: 'vs. mes anterior',
    },
    {
      icon: TrendingUp,
      title: 'Precio Medio Inversiones',
      value: formatPrice(avgInvestmentPrice),
      change: '+8.1%',
      description: 'vs. mes anterior',
    },
    {
      icon: MapPin,
      title: 'Precio Medio Parcelas',
      value: formatPrice(avgPlotPrice),
      change: '+3.4%',
      description: 'vs. mes anterior',
    },
    {
      icon: Euro,
      title: 'Precio Medio General',
      value: formatPrice(avgOverallPrice),
      change: '+6.2%',
      description: `${avgHouseSize}m² tamaño medio`,
    },
  ];

  return (
    <section className="py-16 gradient-border">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Mercado Inmobiliario en Jávea
          </h2>
          <p className="text-muted text-lg max-w-2xl mx-auto">
            Datos actualizados del mercado local de propiedades
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bg-card border border-border rounded-xl p-6 hover:border-primary transition-all duration-300 hover-glow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-orange-400/10 to-orange-600/10 rounded-lg">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-sm font-semibold text-green-500">
                    {stat.change}
                  </span>
                </div>
                <h3 className="text-sm text-muted mb-2">{stat.title}</h3>
                <p className="text-2xl font-bold gradient-text mb-1">{stat.value}</p>
                <p className="text-xs text-muted">{stat.description}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-8 p-6 bg-card/50 border border-border rounded-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-1">
                ¿Quieres conocer el valor de tu propiedad?
              </h3>
              <p className="text-sm text-muted">
                Obtén una valoración gratuita de tu propiedad en Jávea
              </p>
            </div>
            <button className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-orange-500 transition-colors font-semibold whitespace-nowrap">
              Solicitar Valoración
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
