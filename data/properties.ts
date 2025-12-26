export interface Property {
  id: string;
  type: 'house' | 'investment' | 'plot';
  title: string;
  price: number;
  location: string;
  images: string[];
  badge?: string;
  description?: string;
  features?: string[];
  sourceUrl?: string;
  priceHistory?: { date: string; price: number }[];
  coordinates?: { lat: number; lng: number };
  specs: {
    bedrooms?: number;
    bathrooms?: number;
    size: number;
    plotSize?: number;
    roi?: number;
    zone?: string;
    buildable?: boolean;
  };
}

// Sample properties for "Casas y Pisos"
export const houses: Property[] = [
  {
    id: 'h1',
    type: 'house',
    title: 'Villa moderna con vistas al mar',
    price: 450000,
    location: 'Jávea, Portichol',
    images: [
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=500&fit=crop',
    ],
    badge: 'Destacado',
    description: 'Espectacular villa de diseño contemporáneo con impresionantes vistas panorámicas al Mediterráneo. Acabados de primera calidad, amplios espacios luminosos y jardín privado con piscina infinity.',
    features: ['Piscina', 'Vistas al mar', 'Jardín', 'Aire acondicionado', 'Calefacción', 'Parking'],
    sourceUrl: 'https://idealista.com/inmueble/98765432',
    coordinates: { lat: 38.7650, lng: 0.1950 },
    specs: {
      bedrooms: 4,
      bathrooms: 3,
      size: 220,
    },
  },
  {
    id: 'h2',
    type: 'house',
    title: 'Apartamento en primera línea',
    price: 320000,
    location: 'Jávea, Arenal',
    images: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=500&fit=crop',
    ],
    badge: 'Nuevo',
    description: 'Moderno apartamento recién reformado a escasos metros de la playa del Arenal. Terraza con vistas al mar, cocina equipada y plaza de garaje incluida.',
    features: ['Vistas al mar', 'Terraza', 'Garaje', 'Aire acondicionado', 'Cerca de la playa'],
    sourceUrl: 'https://idealista.com/inmueble/87654321',
    coordinates: { lat: 38.7897, lng: 0.1767 },
    specs: {
      bedrooms: 2,
      bathrooms: 2,
      size: 95,
    },
  },
  {
    id: 'h3',
    type: 'house',
    title: 'Casa de campo tradicional',
    price: 890000,
    location: 'Jávea, Gràcia',
    images: [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=500&fit=crop',
    ],
    description: 'Encantadora casa de campo de estilo mediterráneo tradicional rodeada de naturaleza. Amplia parcela con árboles frutales, piscina y zona de barbacoa. Ideal para familias.',
    features: ['Piscina', 'Jardín', 'Barbacoa', 'Chimenea', 'Zona tranquila', 'Parking'],
    sourceUrl: 'https://idealista.com/inmueble/76543210',
    coordinates: { lat: 38.7800, lng: 0.1600 },
    specs: {
      bedrooms: 5,
      bathrooms: 4,
      size: 380,
      plotSize: 2000,
    },
  },
  {
    id: 'h4',
    type: 'house',
    title: 'Bungalow cerca del puerto',
    price: 275000,
    location: 'Jávea, Puerto',
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&h=500&fit=crop',
    ],
    description: 'Acogedor bungalow a pocos minutos del puerto deportivo. Perfecto para segunda residencia o inversión. Comunidad con piscina y zonas verdes.',
    features: ['Piscina comunitaria', 'Terraza', 'Aire acondicionado', 'Cerca del puerto', 'Amueblado'],
    sourceUrl: 'https://idealista.com/inmueble/65432109',
    coordinates: { lat: 38.7950, lng: 0.1850 },
    specs: {
      bedrooms: 3,
      bathrooms: 2,
      size: 110,
    },
  },
  {
    id: 'h5',
    type: 'house',
    title: 'Villa de lujo con piscina',
    price: 510000,
    location: 'Jávea, Cap Martí',
    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800&h=500&fit=crop',
    ],
    coordinates: { lat: 38.7600, lng: 0.1900 },
    badge: 'Destacado',
    description: 'Lujosa villa de obra nueva con acabados premium y diseño exclusivo. Piscina infinita con cascada, jardín mediterráneo y vistas despejadas. Domótica integrada.',
    features: ['Piscina', 'Jardín', 'Domótica', 'Aire acondicionado', 'Garaje', 'Trastero'],
    sourceUrl: 'https://idealista.com/inmueble/54321098',
    specs: {
      bedrooms: 4,
      bathrooms: 3,
      size: 285,
      plotSize: 1200,
    },
  },
  {
    id: 'h6',
    type: 'house',
    title: 'Ático con terraza panorámica',
    price: 650000,
    location: 'Jávea, Balcón al Mar',
    images: [
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800&h=500&fit=crop',
    ],
    description: 'Espectacular ático con amplia terraza de 80m² y vistas panorámicas de 360° al mar y montaña. Cocina de lujo totalmente equipada, climatización integral.',
    features: ['Terraza', 'Vistas panorámicas', 'Aire acondicionado', 'Ascensor', 'Garaje doble', 'Jacuzzi'],
    sourceUrl: 'https://idealista.com/inmueble/43210987',
    specs: {
      bedrooms: 3,
      bathrooms: 2,
      size: 140,
    },
  },
];

// Sample properties for "Oportunidades de Inversión"
export const investments: Property[] = [
  {
    id: 'i1',
    type: 'investment',
    title: 'Edificio de apartamentos turísticos',
    price: 1200000,
    location: 'Jávea, Arenal',
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=500&fit=crop',
    ],
    badge: 'Alta Rentabilidad',
    description: 'Edificio completo de 8 apartamentos con licencia turística activa. Excelente ubicación cerca de la playa. Rentabilidad probada con alta ocupación anual.',
    features: ['Licencia turística', 'Piscina', 'Ascensor', 'Parking', 'Cerca de la playa', 'Gestión incluida'],
    sourceUrl: 'https://idealista.com/inmueble/32109876',
    specs: {
      bedrooms: 8,
      bathrooms: 8,
      size: 450,
      roi: 8,
    },
  },
  {
    id: 'i2',
    type: 'investment',
    title: 'Local comercial en zona turística',
    price: 385000,
    location: 'Jávea, Centro',
    images: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&h=500&fit=crop',
    ],
    description: 'Amplio local comercial en la zona más transitada del centro. Ideal para restaurante, tienda o negocio turístico. Con terraza exterior incluida.',
    features: ['Terraza', 'Escaparate', 'Aseo', 'Zona de paso', 'Licencia de actividad', 'Aire acondicionado'],
    sourceUrl: 'https://idealista.com/inmueble/21098765',
    specs: {
      size: 180,
      roi: 6,
    },
  },
  {
    id: 'i3',
    type: 'investment',
    title: 'Complejo de villas en construcción',
    price: 2500000,
    location: 'Jávea, Tosalet',
    images: [
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=500&fit=crop',
    ],
    badge: 'Preventa',
    description: 'Proyecto exclusivo de 5 villas de lujo en preventa. Diseño contemporáneo con acabados premium. Piscinas privadas y vistas al mar garantizadas. Entrega en 18 meses.',
    features: ['Piscina privada', 'Vistas al mar', 'Parking', 'Jardín', 'Domótica', 'Alta rentabilidad'],
    sourceUrl: 'https://idealista.com/inmueble/10987654',
    specs: {
      bedrooms: 15,
      bathrooms: 15,
      size: 950,
      roi: 10,
    },
  },
  {
    id: 'i4',
    type: 'investment',
    title: 'Apartamentos de obra nueva',
    price: 280000,
    location: 'Jávea, Pinosol',
    images: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=500&fit=crop',
    ],
    badge: 'Nuevo',
    description: 'Apartamentos de obra nueva listos para entrega. Calidades superiores, piscina comunitaria y zonas ajardinadas. Posibilidad de licencia turística.',
    features: ['Piscina comunitaria', 'Parking', 'Trastero', 'Aire acondicionado', 'Terraza', 'Zona verde'],
    sourceUrl: 'https://idealista.com/inmueble/19876543',
    specs: {
      bedrooms: 2,
      bathrooms: 2,
      size: 85,
      roi: 7,
    },
  },
  {
    id: 'i5',
    type: 'investment',
    title: 'Hotel boutique en el casco antiguo',
    price: 1850000,
    location: 'Jávea, Casco Antiguo',
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1596436889106-be35e843f974?w=800&h=500&fit=crop',
    ],
    description: 'Encantador hotel boutique completamente renovado en el corazón del casco antiguo. 12 habitaciones con baño privado, restaurante y terraza panorámica. Negocio en funcionamiento.',
    features: ['Restaurante', 'Terraza', 'Licencia hotelera', 'Recepción', 'Cocina profesional', 'Parking cercano'],
    sourceUrl: 'https://idealista.com/inmueble/18765432',
    specs: {
      bedrooms: 12,
      bathrooms: 12,
      size: 650,
      roi: 9,
    },
  },
  {
    id: 'i6',
    type: 'investment',
    title: 'Restaurante con licencia activa',
    price: 420000,
    location: 'Jávea, Puerto',
    images: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&h=500&fit=crop',
    ],
    description: 'Restaurante totalmente equipado y operativo en primera línea del puerto deportivo. Terraza exterior con vistas, cocina profesional completa y clientela establecida.',
    features: ['Terraza', 'Vistas al puerto', 'Cocina equipada', 'Licencia activa', 'Clientela fija', 'Parking público'],
    sourceUrl: 'https://idealista.com/inmueble/17654321',
    specs: {
      size: 220,
      roi: 8,
    },
  },
];

// Sample properties for "Parcelas"
export const plots: Property[] = [
  {
    id: 'p1',
    type: 'plot',
    title: 'Parcela edificable con vistas',
    price: 195000,
    location: 'Jávea, Adsubia',
    images: [
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1516905041604-7935af78f572?w=800&h=500&fit=crop',
    ],
    badge: 'Oportunidad',
    description: 'Parcela edificable plana con impresionantes vistas al valle y montaña. Todos los servicios en pie de parcela. Orientación sur, muy soleada.',
    features: ['Vistas', 'Servicios en parcela', 'Zona tranquila', 'Orientación sur', 'Acceso asfaltado'],
    sourceUrl: 'https://idealista.com/inmueble/16543210',
    specs: {
      size: 1200,
      buildable: true,
      zone: 'Residencial',
    },
  },
  {
    id: 'p2',
    type: 'plot',
    title: 'Terreno urbanizable costero',
    price: 340000,
    location: 'Jávea, Cap de la Nao',
    images: [
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=500&fit=crop',
    ],
    description: 'Exclusiva parcela en zona premium cerca del faro. Vistas panorámicas al mar Mediterráneo. Ubicación privilegiada en una de las zonas más cotizadas de Jávea.',
    features: ['Vistas al mar', 'Zona premium', 'Orientación este', 'Servicios disponibles', 'Cerca del mar'],
    sourceUrl: 'https://idealista.com/inmueble/15432109',
    specs: {
      size: 800,
      buildable: true,
      zone: 'Residencial Premium',
    },
  },
  {
    id: 'p3',
    type: 'plot',
    title: 'Parcela rústica con olivos',
    price: 125000,
    location: 'Jávea, Rafol',
    images: [
      'https://images.unsplash.com/photo-1516905041604-7935af78f572?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1547514701-42782101795e?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&h=500&fit=crop',
    ],
    description: 'Preciosa finca rústica con olivos centenarios en producción. Ideal para proyecto agrícola o de autoconsumo. Pozo de agua y caseta de aperos.',
    features: ['Olivos', 'Pozo de agua', 'Caseta', 'Zona tranquila', 'Vistas a la montaña'],
    sourceUrl: 'https://idealista.com/inmueble/14321098',
    specs: {
      size: 2000,
      buildable: false,
      zone: 'Agrícola',
    },
  },
  {
    id: 'p4',
    type: 'plot',
    title: 'Terreno urbano céntrico',
    price: 280000,
    location: 'Jávea, Centro',
    images: [
      'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=500&fit=crop',
    ],
    badge: 'Exclusivo',
    description: 'Excepcional terreno urbano en pleno centro de Jávea. Ideal para vivienda unifamiliar o edificio de apartamentos. Todos los servicios disponibles.',
    features: ['Ubicación céntrica', 'Todos los servicios', 'Alta demanda', 'Fácil acceso', 'Comercios cercanos'],
    sourceUrl: 'https://idealista.com/inmueble/13210987',
    specs: {
      size: 600,
      buildable: true,
      zone: 'Residencial',
    },
  },
  {
    id: 'p5',
    type: 'plot',
    title: 'Gran parcela con proyecto incluido',
    price: 520000,
    location: 'Jávea, Balcón al Mar',
    images: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=500&fit=crop',
    ],
    badge: 'Con Proyecto',
    description: 'Magnífica parcela de 1500m² con proyecto de villa de lujo aprobado. Licencia de obras lista para tramitar. Vistas espectaculares al mar y montaña.',
    features: ['Proyecto aprobado', 'Vistas al mar', 'Zona premium', 'Orientación sur', 'Licencia lista'],
    sourceUrl: 'https://idealista.com/inmueble/12109876',
    specs: {
      size: 1500,
      buildable: true,
      zone: 'Residencial Premium',
    },
  },
  {
    id: 'p6',
    type: 'plot',
    title: 'Parcela en zona tranquila',
    price: 165000,
    location: 'Jávea, Pueblo',
    images: [
      'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1516905041604-7935af78f572?w=800&h=500&fit=crop',
    ],
    description: 'Parcela edificable en zona residencial tranquila cerca del pueblo. Perfecta para construir vivienda unifamiliar. Acceso por camino asfaltado.',
    features: ['Zona tranquila', 'Cerca del pueblo', 'Servicios disponibles', 'Acceso asfaltado', 'Orientación sur'],
    sourceUrl: 'https://idealista.com/inmueble/11098765',
    specs: {
      size: 950,
      buildable: true,
      zone: 'Residencial',
    },
  },
];

export const allProperties: Property[] = [...houses, ...investments, ...plots];
