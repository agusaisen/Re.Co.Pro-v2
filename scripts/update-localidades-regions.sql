-- Actualizar localidades con sus regiones correspondientes

-- REGION DEL LIMAY
UPDATE localidades SET region = 'Región del Limay' WHERE nombre IN (
  'Picún Leufú',
  'Piedra del Águila',
  'El Sauce',
  'Paso Aguerre',
  'Santo Tomás'
);

-- REGION ALTO DE NEUQUEN
UPDATE localidades SET region = 'Región Alto de Neuquén' WHERE nombre IN (
  'Chos Malal',
  'Andacollo',
  'Loncopué',
  'Las Ovejas',
  'El Cholar',
  'El Huecú',
  'Huingancó',
  'Los Miches',
  'Taquimilán',
  'Tricao Malal',
  'Caviahue-Copahue',
  'Chorriaca',
  'Coyuco-Cochico',
  'Los Guañacos',
  'Manzano Amargo',
  'Varvarco - Invernada Vieja',
  'Villa del Nahueve',
  'Villa Curí Leuvú'
);

-- REGION DEL PEHUEN
UPDATE localidades SET region = 'Región del Pehuén' WHERE nombre IN (
  'Zapala',
  'Aluminé',
  'Las Lajas',
  'Mariano Moreno',
  'Villa Pehuenia',
  'Bajada del Agrio',
  'Las Coloradas',
  'Covunco Abajo',
  'Los Catutos',
  'Quili Malal',
  'Ramón M. Castro',
  'Villa del Puente Picún Leufú'
);

-- REGION DE LOS LAGOS DEL SUR
UPDATE localidades SET region = 'Región de los Lagos del Sur' WHERE nombre IN (
  'Junín de los Andes',
  'San Martín de los Andes',
  'Villa La Angostura',
  'Villa Traful',
  'Pilo Lil'
);

-- REGION DE LA COMARCA
UPDATE localidades SET region = 'Región de la Comarca' WHERE nombre IN (
  'Cutral Có',
  'Plaza Huincul',
  'Sauzal Bonito'
);

-- REGION CONFLUENCIA
UPDATE localidades SET region = 'Región Confluencia' WHERE nombre IN (
  'Centenario',
  'Neuquén Capital',
  'Plottier',
  'Senillosa',
  'Vista Alegre',
  'Villa El Chocón'
);

-- REGION VACA MUERTA
UPDATE localidades SET region = 'Región Vaca Muerta' WHERE nombre IN (
  'San Patricio del Chañar',
  'Rincón de los Sauces',
  'Añelo',
  'Buta Ranquil',
  'Barrancas',
  'Los Chihuidos',
  'Aguada San Roque',
  'Octavio Pico'
);
