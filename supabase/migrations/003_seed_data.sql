-- Jávea Real Estate - Seed Data
-- Initial data for features and areas

-- ============================================================================
-- FEATURES (Common property amenities and characteristics)
-- ============================================================================

INSERT INTO features (slug, name_es, name_en, name_ru, category) VALUES
  -- Exterior amenities
  ('pool', 'Piscina', 'Swimming pool', 'Бассейн', 'exterior'),
  ('private_pool', 'Piscina privada', 'Private pool', 'Частный бассейн', 'exterior'),
  ('community_pool', 'Piscina comunitaria', 'Community pool', 'Общественный бассейн', 'exterior'),
  ('garden', 'Jardín', 'Garden', 'Сад', 'exterior'),
  ('terrace', 'Terraza', 'Terrace', 'Терраса', 'exterior'),
  ('balcony', 'Balcón', 'Balcony', 'Балкон', 'exterior'),
  ('garage', 'Garaje', 'Garage', 'Гараж', 'exterior'),
  ('parking', 'Parking', 'Parking space', 'Парковка', 'exterior'),
  ('bbq', 'Barbacoa', 'BBQ area', 'Барбекю', 'exterior'),

  -- Views
  ('sea_view', 'Vistas al mar', 'Sea views', 'Вид на море', 'exterior'),
  ('mountain_view', 'Vistas a la montaña', 'Mountain views', 'Вид на горы', 'exterior'),
  ('panoramic_view', 'Vistas panorámicas', 'Panoramic views', 'Панорамный вид', 'exterior'),

  -- Interior amenities
  ('air_conditioning', 'Aire acondicionado', 'Air conditioning', 'Кондиционер', 'interior'),
  ('central_heating', 'Calefacción central', 'Central heating', 'Центральное отопление', 'interior'),
  ('fireplace', 'Chimenea', 'Fireplace', 'Камин', 'interior'),
  ('fitted_kitchen', 'Cocina equipada', 'Fitted kitchen', 'Оборудованная кухня', 'interior'),
  ('built_in_wardrobes', 'Armarios empotrados', 'Built-in wardrobes', 'Встроенные шкафы', 'interior'),
  ('furnished', 'Amueblado', 'Furnished', 'Меблирована', 'interior'),
  ('semi_furnished', 'Semi-amueblado', 'Semi-furnished', 'Частично меблирована', 'interior'),

  -- Building amenities
  ('elevator', 'Ascensor', 'Elevator', 'Лифт', 'amenities'),
  ('storage_room', 'Trastero', 'Storage room', 'Кладовая', 'amenities'),
  ('concierge', 'Portero', 'Concierge', 'Консьерж', 'amenities'),
  ('gym', 'Gimnasio', 'Gym', 'Спортзал', 'amenities'),
  ('sauna', 'Sauna', 'Sauna', 'Сауна', 'amenities'),
  ('playground', 'Zona infantil', 'Playground', 'Детская площадка', 'amenities'),

  -- Security
  ('alarm', 'Alarma', 'Alarm system', 'Сигнализация', 'security'),
  ('gated_community', 'Urbanización cerrada', 'Gated community', 'Закрытый комплекс', 'security'),
  ('security_door', 'Puerta blindada', 'Security door', 'Бронированная дверь', 'security'),
  ('video_intercom', 'Videoportero', 'Video intercom', 'Видеодомофон', 'security'),

  -- Additional features
  ('close_to_beach', 'Cerca de la playa', 'Close to beach', 'Рядом с пляжем', 'amenities'),
  ('close_to_center', 'Cerca del centro', 'Close to center', 'Рядом с центром', 'amenities'),
  ('close_to_schools', 'Cerca de colegios', 'Close to schools', 'Рядом со школами', 'amenities'),
  ('close_to_shops', 'Cerca de comercios', 'Close to shops', 'Рядом с магазинами', 'amenities'),
  ('wheelchair_accessible', 'Accesible', 'Wheelchair accessible', 'Доступно для инвалидных колясок', 'amenities'),
  ('pets_allowed', 'Se aceptan mascotas', 'Pets allowed', 'Разрешены домашние животные', 'amenities')

ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- AREAS (Neighborhoods in Jávea)
-- ============================================================================

-- Note: Coordinates are approximate. In production, use accurate boundaries.
-- Format: ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography

INSERT INTO areas (slug, name_es, name_en, name_ru, municipality, center) VALUES
  (
    'arenal',
    'El Arenal',
    'Arenal Beach',
    'Пляж Ареналь',
    'Jávea',
    ST_SetSRID(ST_MakePoint(0.1767, 38.7897), 4326)::geography
  ),
  (
    'portichol',
    'Portichol',
    'Portichol',
    'Портичоль',
    'Jávea',
    ST_SetSRID(ST_MakePoint(0.1950, 38.7650), 4326)::geography
  ),
  (
    'puerto',
    'Puerto',
    'Port',
    'Порт',
    'Jávea',
    ST_SetSRID(ST_MakePoint(0.1850, 38.7950), 4326)::geography
  ),
  (
    'casco-antiguo',
    'Casco Antiguo',
    'Old Town',
    'Старый город',
    'Jávea',
    ST_SetSRID(ST_MakePoint(0.1700, 38.7870), 4326)::geography
  ),
  (
    'cap-marti',
    'Cap Martí',
    'Cap Martí',
    'Кап Марти',
    'Jávea',
    ST_SetSRID(ST_MakePoint(0.1900, 38.7600), 4326)::geography
  ),
  (
    'granadella',
    'La Granadella',
    'Granadella',
    'Гранаделла',
    'Jávea',
    ST_SetSRID(ST_MakePoint(0.2100, 38.7400), 4326)::geography
  ),
  (
    'montgo',
    'Montgó',
    'Montgó',
    'Монтго',
    'Jávea',
    ST_SetSRID(ST_MakePoint(0.1500, 38.7950), 4326)::geography
  ),
  (
    'gracia',
    'Gràcia',
    'Gràcia',
    'Грасия',
    'Jávea',
    ST_SetSRID(ST_MakePoint(0.1600, 38.7800), 4326)::geography
  ),
  (
    'adsubia',
    'Adsubia',
    'Adsubia',
    'Адсубия',
    'Jávea',
    ST_SetSRID(ST_MakePoint(0.1450, 38.7750), 4326)::geography
  ),
  (
    'balcon-al-mar',
    'Balcón al Mar',
    'Balcón al Mar',
    'Балкон-аль-Мар',
    'Jávea',
    ST_SetSRID(ST_MakePoint(0.2050, 38.7550), 4326)::geography
  )

ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE features ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;

-- PUBLIC READ ACCESS (Anonymous users can view active listings)

CREATE POLICY "Anyone can view active properties"
  ON properties FOR SELECT
  USING (status = 'active');

CREATE POLICY "Anyone can view features"
  ON features FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view property features"
  ON property_features FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view price history"
  ON price_history FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view areas"
  ON areas FOR SELECT
  USING (true);

-- ADMIN WRITE ACCESS (Authenticated users with admin role can manage)
-- Note: In production, set up proper authentication and role management

CREATE POLICY "Admins can manage properties"
  ON properties FOR ALL
  USING (auth.role() = 'authenticated');  -- Change to admin role in production

CREATE POLICY "Admins can manage features"
  ON features FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage property features"
  ON property_features FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage price history"
  ON price_history FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage areas"
  ON areas FOR ALL
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- HELPFUL VIEWS
-- ============================================================================

-- View: Active properties with feature count
CREATE OR REPLACE VIEW properties_with_feature_count AS
SELECT
  p.*,
  COUNT(pf.feature_id) AS feature_count
FROM properties p
LEFT JOIN property_features pf ON pf.property_id = p.id
WHERE p.status = 'active'
GROUP BY p.id;

COMMENT ON VIEW properties_with_feature_count IS 'Active properties with count of features';

-- View: Properties with latest price change
CREATE OR REPLACE VIEW properties_with_latest_price_change AS
SELECT
  p.*,
  ph.price AS previous_price,
  ph.recorded_at AS price_changed_at,
  ROUND(((p.price - ph.price)::DECIMAL / ph.price) * 100, 2) AS price_change_percent
FROM properties p
LEFT JOIN LATERAL (
  SELECT price, recorded_at
  FROM price_history
  WHERE property_id = p.id
  ORDER BY recorded_at DESC
  LIMIT 1
) ph ON true
WHERE p.status = 'active';

COMMENT ON VIEW properties_with_latest_price_change IS 'Properties with their most recent price change';

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✓ Jávea Real Estate database schema initialized successfully!';
  RAISE NOTICE '✓ Created % features', (SELECT COUNT(*) FROM features);
  RAISE NOTICE '✓ Created % areas', (SELECT COUNT(*) FROM areas);
  RAISE NOTICE '✓ RLS policies enabled';
  RAISE NOTICE '→ Next: Import property data or start web scraper';
END $$;
