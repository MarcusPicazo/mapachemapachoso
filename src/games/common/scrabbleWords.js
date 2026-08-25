export const CLUES = {
  CASA: 'Donde vives con tu familia.', MESA: 'Mueble donde comes o dibujas.', GATO: 'Maúlla y caza ratones.',
  PERRO: 'Ladra y mueve la cola feliz.', SOL: 'Brilla de día y nos da calor.', LUNA: 'Brilla de noche en el cielo.',
  FLOR: 'Huele bonito y tiene pétalos.', AGUA: 'La bebes y llueve del cielo.', FUEGO: 'Quema y da calor y luz.',
  TIERRA: 'El planeta donde vivimos.', VIENTO: 'Se siente pero no se ve, mueve las hojas.', MAPA: 'Muestra caminos y lugares.',
  MAGIA: 'Los magos y brujas la usan.', ESPADA: 'Arma filosa de un caballero.', ESCUDO: 'Protege de los golpes en batalla.',
  CORONA: 'La usa un rey o una reina.', TORRE: 'Parte alta y puntiaguda de un castillo.', PUENTE: 'Cruza sobre un río.',
  CAMINO: 'Ruta para llegar a un lugar.', BOSQUE: 'Lugar lleno de árboles.', RIO: 'Corriente de agua que fluye.',
  LAGO: 'Gran cuerpo de agua quieta.', LUZ: 'Lo opuesto a la oscuridad.', NOCHE: 'Cuando sale la luna.',
  DIA: 'Cuando sale el sol.', AMOR: 'Lo que sientes por tu familia.', PAZ: 'Lo opuesto a la guerra.',
  VIDA: 'Lo que tienen los seres vivos.', TIEMPO: 'Lo que marca un reloj.', ANO: 'Doce meses juntos.',
  UVA: 'Fruta pequeña y redonda que come el mapache.', FRUTA: 'Manzana, uva o pera, por ejemplo.', DULCE: 'Sabor del azúcar.',
  JUEGO: 'Lo que estás jugando ahora mismo.', RETO: 'Un desafío por superar.', HEROE: 'Salva el día con valentía.',
  AMIGO: 'Alguien en quien confías y te acompaña.', ROCA: 'Piedra grande y dura.', ARENA: 'Cubre las playas y el desierto.',
  CIELO: 'Arriba, donde vuelan las aves.', MAR: 'Gran extensión de agua salada.', ISLA: 'Tierra rodeada de agua.',
  BARCO: 'Flota y navega en el agua.', NAVE: 'Vehículo que viaja por agua o espacio.', REY: 'Gobierna un reino, usa corona.',
  REINA: 'Gobierna junto al rey.', PRINCESA: 'Hija de un rey y una reina.', DRAGON: 'Criatura que vuela y escupe fuego.',
  CASTILLO: 'Hogar de reyes con torres altas.', MURO: 'Pared que protege una fortaleza.', PUERTA: 'Se abre para entrar a un lugar.',
  LLAVE: 'Abre una cerradura.', TESORO: 'Cofre lleno de oro y joyas.', ORO: 'Metal brillante y valioso.',
  PLATA: 'Metal brillante, color gris claro.', GEMA: 'Piedra preciosa que brilla.', CRISTAL: 'Transparente y brillante como el vidrio.',
  BRUJA: 'Prepara pociones con su caldero.', MAGO: 'Hace trucos y hechizos con su varita.', LOBO: 'Aúlla a la luna.',
  OSO: 'Grande, peludo, ama la miel.', ZORRO: 'Astuto, de cola peluda y anaranjada.', AVE: 'Tiene alas y pone huevos.',
  PEZ: 'Vive y nada en el agua.', RANA: 'Salta y vive cerca del agua.', HOJA: 'Crece en las ramas de un árbol.',
  RAMA: 'Parte del árbol donde crecen las hojas.', RAIZ: 'Parte del árbol bajo la tierra.', SEMILLA: 'De ella nace una planta.',
  ESTRELLA: 'Brilla en el cielo nocturno.', COMETA: 'Cruza el cielo con una cola brillante.', NUBE: 'Flota en el cielo, blanca o gris.',
  LLUVIA: 'Cae del cielo cuando hay nubes grises.', NIEVE: 'Blanca y fría, cae en invierno.', HIELO: 'Agua congelada.',
  ARCO: 'Se usa para disparar flechas.', FLECHA: 'Se dispara con un arco.', ESCALERA: 'Sirve para subir a un lugar alto.',
  VENTANA: 'Se abre para ver hacia afuera.', JARDIN: 'Lugar lleno de flores y plantas.', HUERTO: 'Donde crecen frutas y verduras.',
  GRANJA: 'Hogar de vacas, gallinas y cerdos.', ALDEA: 'Pueblo pequeño.', PUEBLO: 'Lugar donde vive mucha gente.',
  REINO: 'Territorio gobernado por un rey.', IMPERIO: 'Muchos reinos juntos bajo un solo líder.',
  ARMADURA: 'Protege el cuerpo de un caballero.', YELMO: 'Casco de un caballero.', LANZA: 'Arma larga y puntiaguda.',
  HACHA: 'Sirve para cortar madera.', MARTILLO: 'Sirve para clavar clavos.', CADENA: 'Eslabones de metal unidos.',
  ANILLO: 'Joya redonda que se usa en el dedo.', MEDALLA: 'Se gana por ganar una competencia.',
}
export const DICTIONARY = Object.keys(CLUES)

export function letterValue(letter) {
  if ('AEIOULNRST'.includes(letter)) return 1
  if ('DG'.includes(letter)) return 2
  if ('BCMP'.includes(letter)) return 3
  if ('FHVY'.includes(letter)) return 4
  if ('JÑ'.includes(letter)) return 8
  if ('QZX'.includes(letter)) return 5
  return 1
}

export function isValidWord(word) {
  return DICTIONARY.includes(word.toUpperCase())
}

// Busca una palabra del diccionario formable con las letras disponibles (para pistas).
export function findFormableWord(availableLetters) {
  const counts = {}
  for (const l of availableLetters) counts[l] = (counts[l] || 0) + 1
  const candidates = [...DICTIONARY].sort((a, b) => b.length - a.length)
  for (const word of candidates) {
    const need = {}
    for (const ch of word) need[ch] = (need[ch] || 0) + 1
    const canForm = Object.entries(need).every(([ch, n]) => (counts[ch] || 0) >= n)
    if (canForm) return word
  }
  return null
}

// Genera un rack SOLO con las letras de una palabra del diccionario (revueltas),
// sin fichas de sobra: asi la jugadora sabe que puede usar todas las letras.
export function generateRack(maxSize = 8) {
  const pool = DICTIONARY.filter((w) => w.length <= maxSize && w.length >= 3)
  const base = pool[Math.floor(Math.random() * pool.length)]
  const letters = base.split('')
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
      ;[letters[i], letters[j]] = [letters[j], letters[i]]
  }
  return letters.map((l, i) => ({ id: `${l}-${i}-${Math.random().toString(36).slice(2, 6)}`, letter: l }))
}
