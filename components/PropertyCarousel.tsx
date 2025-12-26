'use client';

import { useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { Property } from '@/data/properties';
import PropertyCard from './PropertyCard';
import InvestmentCard from './InvestmentCard';
import PlotCard from './PlotCard';

interface PropertyCarouselProps {
  title: string;
  properties: Property[];
  id: string;
}

export default function PropertyCarousel({
  title,
  properties,
  id,
}: PropertyCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
    scrollRef.current.style.cursor = 'grabbing';
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (scrollRef.current) {
      scrollRef.current.style.cursor = 'grab';
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseLeave = () => {
    if (isDragging && scrollRef.current) {
      setIsDragging(false);
      scrollRef.current.style.cursor = 'grab';
    }
  };

  const renderCard = (property: Property) => {
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
    <section className="py-16 gradient-border" id={id}>
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">{title}</h2>
          <a
            href={`#${id}-all`}
            className="flex items-center gap-1 text-primary hover:text-orange-300 transition-colors group"
          >
            <span>Ver todo</span>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        {/* Horizontal Scrollable Row */}
        <div className="relative">
          <div
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="flex gap-6 overflow-x-auto scrollbar-hidden pb-4 snap-x snap-mandatory cursor-grab select-none"
          >
            {properties.map((property) => renderCard(property))}
          </div>

          {/* Fade gradient on sides */}
          <div className="absolute top-0 left-0 bottom-4 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none" />
          <div className="absolute top-0 right-0 bottom-4 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
        </div>
      </div>
    </section>
  );
}
