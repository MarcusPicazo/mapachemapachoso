// Metadata narrativa de los 20 niveles. El campo `game` referencia la key
// del componente de minijuego registrado en src/games/index.js
export const LEVELS = [
  {
    id: 1, game: 'memorama', biome: 'dungeon',
    title: 'Memorama Antiguo', subtitle: 'Empareja los 12 pares de símbolos rúnicos con calma y buena memoria.', hasHint: true,
    dialogue: '¡Jazz! Caímos en una mazmorra bajo el castillo. Hay runas grabadas por todas partes... si las emparejamos bien, tal vez despierten un mecanismo. ¡Sé que tu memoria es increíble, ayúdame!',
    instructions: 'Toca dos runas para voltearlas. Si combinan, se quedan destapadas para siempre. Si no, se vuelven a ocultar. El escudo dorado del centro es decorativo. Encuentra los 12 pares sin prisa.',
  },
  {
    id: 2, game: 'conecta4', biome: 'dungeon',
    title: 'Conecta 4 Ancestral', subtitle: 'Alinea 4 fichas doradas antes que el guardián de piedra.',
    dialogue: 'Un guardián de piedra bloquea el pasadizo y solo respeta un duelo de estrategia. Jazz, tú siempre ves las jugadas antes que nadie. ¡Vamos a ganarle!',
    instructions: 'Toca cualquier columna del tablero para soltar tu ficha dorada ahí. Alinea 4 fichas seguidas en horizontal, vertical o diagonal antes que el guardián.',
  },
  {
    id: 3, game: 'batallaNaval', biome: 'dungeon',
    title: 'Batalla Naval Subterránea', subtitle: 'Coloca tu flota y hunde los barcos fantasma del foso oscuro.',
    dialogue: 'Este foso esconde barcazas fantasma que custodian la salida. Primero coloca tu propia flota donde prefieras, y luego dispara con lógica y paciencia. ¡Tú tienes el mejor instinto de radar, Jazz!',
    instructions: 'Arrastra cada barco de la lista hasta tu tablero para colocarlo (toca un barco ya puesto para girarlo). Cuando termines, toca "¡Listo!" y dispara tocando las casillas del tablero enemigo.',
  },
  {
    id: 4, game: 'domino', biome: 'castle_hall',
    title: 'Dominó Flash', subtitle: 'Coloca todas tus fichas antes que la bruja del castillo.',
    dialogue: 'Llegamos al salón principal. Una vieja bruja del castillo reta a quien pase a un duelo de dominó. ¡Vacía tu mano antes que ella, Jazz!',
    instructions: 'Arrastra una ficha de tu mano y suéltala sobre el extremo de la cadena donde encaje. Si ninguna te sirve, toca el pozo para robar una ficha nueva.',
  },
  {
    id: 5, game: 'loteria', biome: 'castle_hall',
    title: 'Lotería del Salón', subtitle: 'Completa una línea, diagonal o toda la cartilla antes que el salón.',
    dialogue: 'Los sirvientes del salón organizan una lotería mágica para dejarnos pasar. ¡Marca rápido tu cartilla, Jazz, antes de que se agoten las cartas!',
    instructions: 'Arriba aparece la figura cantada. Tócala en tu cartilla si la tienes. Completa una fila, columna o diagonal antes que el salón.',
  },
  {
    id: 6, game: 'uno', biome: 'castle_hall',
    title: 'UNO Real', subtitle: 'Quédate sin cartas antes que el dragón de la corte.',
    dialogue: 'Un dragón bibliotecario de la corte nos reta a un juego de cartas de colores. Es rápido y tramposo, ¡pero sé que puedes vaciar tu mano antes que él!',
    instructions: 'Toca una carta de tu mano que combine en color o número con la carta central. Si no tienes ninguna, toca el mazo para robar. Las cartas especiales cambian el ritmo del juego.',
  },
  {
    id: 7, game: 'painting', biome: 'castle_hall',
    title: 'Pergamino Encantado', subtitle: 'Deja volar tu imaginación en 6 pergaminos mágicos.',
    dialogue: 'En el salón encontramos un pergamino mágico y un set de acuarelas encantadas. ¡Deja volar tu imaginación, Jazz, pinta animales, paisajes, objetos o lo que se te ocurra!',
    instructions: 'Elige un color de la paleta y dibuja con el dedo o el mouse sobre el pergamino, como si fuera una brocha. Pinta lo que tú quieras, puedes borrar o limpiar todo, y toca "¡Listo!" cuando termines cada uno de los 6 pergaminos.',
  },
  {
    id: 8, game: 'scrabble', biome: 'dragon_cave',
    title: 'Scrabble de Cueva', subtitle: 'Forma 5 palabras válidas con las letras que tengas.', hasHint: true,
    dialogue: 'Entramos a una cueva de cristal habitada por un dragón bibliotecario. Le encantan las palabras. Jazz, arma las mejores palabras que puedas con estas letras.',
    instructions: 'Toca letras de tu atril para armar una palabra (se acomodan arriba). Toca Confirmar para validarla. Forma 5 palabras válidas para ganar.',
  },
  {
    id: 9, game: 'pictionary', biome: 'dragon_cave',
    title: 'Pictionary de Cristal', subtitle: 'Adivina el dibujo correcto en cada una de las 15 rondas.',
    dialogue: 'El dragón proyecta siluetas de luz en la pared de cristal. ¡Adivina de qué se trata cada dibujo antes de que se desvanezca, Jazz!',
    instructions: 'Observa la figura que gira en el centro y toca la opción correcta entre las 4 disponibles. Acierta las 15 rondas para ganar.',
  },
  {
    id: 10, game: 'riddles', biome: 'dragon_cave',
    title: 'Adivinanzas del Sabio Búho', subtitle: 'Responde 20 adivinanzas antes de fallar demasiadas veces.', hasHint: true,
    dialogue: 'Un búho sabio guarda una bola de cristal llena de acertijos. Le encanta poner a prueba mentes brillantes, ¡y sé que la tuya es de las mejores, Jazz!',
    instructions: 'Lee la adivinanza y toca la respuesta correcta entre las 4 opciones. Responde 20 adivinanzas sin fallar más de 6 veces. Si usas una pista, se elimina una opción incorrecta.',
  },
  {
    id: 11, game: 'clue', biome: 'dragon_cave', hasHint: true,
    title: 'Clue Exprés', subtitle: 'Descubre quién, con qué y dónde en máximo 6 turnos.',
    dialogue: 'Un duende travieso escondió nuestra brújula temporal. ¡Usa tu instinto detectivesco, Jazz, sé que puedes hallarla!',
    instructions: 'Toca "📖 Ver caso" cuando quieras releer los testimonios. Elige un sospechoso, un arma y una habitación tocándolos, luego toca "¡Acusar!". Cada intento te dice qué categorías acertaste. Resuelve el misterio en 6 turnos.',
  },
  {
    id: 12, game: 'othello', biome: 'enchanted_forest',
    title: 'Othello del Bosque', subtitle: 'Voltea más fichas que el espíritu del bosque en 12 turnos.',
    dialogue: 'Salimos a un bosque encantado bajo la luna. Un espíritu guardián nos reta a un juego de fichas de dos caras. ¡A ver quién domina más el tablero!',
    instructions: 'Toca una casilla resaltada en verde para colocar tu ficha negra: todas las fichas rivales entre tu nueva ficha y otra tuya se voltean. Gana quien tenga más fichas al final.',
  },
  {
    id: 13, game: 'jokes', biome: 'enchanted_forest', hasHint: true,
    title: 'Los Chistes del Bosque', subtitle: 'Adivina la respuesta correcta de 5 chistes.',
    dialogue: 'Un duende bromista bloquea el paso hasta que alguien le siga el chiste. Jazz, tú tienes el mejor sentido del humor que conozco, ¡a ver si le atinas a la respuesta!',
    instructions: 'Lee el chiste y toca la respuesta correcta entre las opciones. Acierta los 5 chistes sin fallar demasiadas veces. Si usas una pista, se elimina una opción incorrecta.',
  },
  {
    id: 14, game: 'catchFairies', biome: 'enchanted_forest',
    title: 'La Caza de Hadas', subtitle: 'Atrapa 10 hadas con tu red antes que el gnomo travieso.',
    dialogue: 'Un claro del bosque se llenó de hadas brillantes. Un gnomo travieso también quiere atraparlas todas para sí mismo. ¡Consigue 10 antes que él, Jazz!',
    instructions: 'Mantén presionado el mouse o el dedo y arrastra la red por la pantalla para atrapar hadas: si una toca la red mientras la arrastras, cae atrapada. Atrapa 10 antes que el gnomo o tendrás que intentarlo de nuevo. Al lograrlo, podrás liberar a las hadas antes de recibir tus uvas.',
  },
  {
    id: 15, game: 'go', biome: 'enchanted_forest',
    title: 'Go Mini del Estanque', subtitle: 'Controla más territorio que tu rival en 16 jugadas.',
    dialogue: 'Junto al estanque encantado hay un tablero ancestral. El espíritu del estanque ahora juega con mucha más astucia. Gana territorio con inteligencia, ¡sé que tu estrategia es imparable, Jazz!',
    instructions: 'Toca una casilla vacía para colocar tu piedra negra. El rival ahora piensa varias jugadas antes de decidir dónde jugar. Al final de las 16 jugadas se cuenta cuántas piedras y territorio rodeado tiene cada quien.',
  },
  {
    id: 16, game: 'archery', biome: 'enchanted_forest',
    title: 'Tiro al Arco de la Torre', subtitle: 'Acierta 10 flechas en el círculo amarillo antes de quedarte sin flechas.',
    dialogue: 'El vigía de la torre solo deja pasar a quien domine el arco. La diana además cambia de lugar en cada tiro. Apunta con calma, Jazz, y confía en tu puntería.',
    instructions: 'Presiona sobre el arco y arrastra en cualquier dirección para apuntar con la mirilla y tensar la cuerda; suelta para disparar. Solo cuenta si caes justo en el círculo amarillo del centro, y la diana se mueve de lugar después de cada flecha. Necesitas 10 aciertos en 16 flechas.',
  },
  {
    id: 17, game: 'fortuneWheel', biome: 'portal_tower',
    title: 'Ruleta del Mago Dorado', subtitle: 'Suma 25 puntos antes que el mago rival.',
    dialogue: 'Un mago dorado guarda una ruleta mágica en la torre, y él mismo la gira en tu contra con mucha maña. Solo deja pasar a quien le gane sumando más puntos. ¡A ver tu puntería con el tiempo, Jazz!',
    instructions: 'Toca "¡Girar!" para hacer girar la ruleta y toca "¡Detener!" cuando quieras para parar en un número. Ese valor se suma a tu puntaje. Túrnense con el mago dorado hasta que alguien llegue a 25 puntos.',
  },
  {
    id: 18, game: 'runeTowers', biome: 'portal_tower',
    title: 'Torres de Runas Mágicas', subtitle: 'Mueve los 4 discos a la tercera torre sin desperdiciar movimientos.',
    dialogue: 'Tres pedestales de piedra sostienen discos de runas apilados por tamaño. Una inscripción dice: llévalos todos al tercer pedestal, pero un disco grande jamás puede ir sobre uno chico. ¡Piensa con calma, Jazz!',
    instructions: 'Arrastra el disco de arriba de una torre con el dedo o el mouse, y suéltalo sobre la torre donde lo quieras dejar. Nunca puedes poner un disco más grande sobre uno más chico. Lleva los 4 discos a la Torre 3 sin pasarte de los movimientos permitidos.',
  },
  {
    id: 19, game: 'loteriaAvanzada', biome: 'portal_tower',
    title: 'Lotería de las Estrellas', subtitle: 'Completa las 20 casillas de tu cartilla para trazar el mapa estelar.',
    dialogue: 'Casi llegamos a la cima. Necesitamos trazar el mapa estelar completo. ¡Marca toda la cartilla, Jazz, ya casi estamos en casa!',
    instructions: 'Arriba aparece la figura cantada. Tócala rápido en tu cartilla si la tienes, antes de que salga la siguiente. Se cantarán 30 cartas en total (10 no son tuyas, para que tengas margen) y necesitas completar las 20 casillas de tu cartilla.',
  },
  {
    id: 20, game: 'mixChallenge', biome: 'portal_tower',
    title: 'Mix Challenge: El Portal', subtitle: 'Supera 3 retos combinados para abrir el portal a 2026.',
    dialogue: '¡Es ahora o nunca, Jazz! El portal necesita tres pruebas finales combinadas. Solo alguien con tu inteligencia del siglo XXI puede lograrlo. ¡Vamos juntos, por última vez en esta aventura!',
    instructions: 'Supera 3 retos seguidos sin fallar ninguno: memoria relámpago (3 pares en 8 segundos), conecta 4 contra el portal (45 segundos, solo pierdes si se acaba el tiempo), y una secuencia mágica de runas que debes memorizar y repetir tocándolas. ¡El último esfuerzo!',
  },
]

export const BIOME_LABELS = {
  dungeon: 'Mazmorras del Castillo',
  castle_hall: 'Salón del Castillo',
  dragon_cave: 'Cueva del Dragón',
  enchanted_forest: 'Bosque Encantado',
  portal_tower: 'Torre del Portal',
}

export const FINAL_MESSAGE = `¡Lo hemos logrado! Muchas gracias, hemos atravesado muchísimas aventuras juntos por muchos años y esta última sin duda fue mi favorita, extrañaré cursar más aventuras contigo. Marcus y yo seguiremos teniendo más aventuras por ti, pensando en ti y siempre teniéndote en nuestros corazones, pues te prometo eres lo mejor que nos ha pasado a ambos. Bueno... a mí también lo mejor que me ha pasado son las uvas, ñum ñum. Sin duda ha sido la mejor experiencia de mi vida pasar tantas aventuras contigo, Jazz. Eres la niña más bella con los ojos más bellos y siempre debes conservar esa mirada y esa sonrisa contigo, y no cambiarla por nada del mundo. No olvides que para mí, Mapache Mapachoso, tu corazón es el más noble que jamás he conocido, incluso más noble que mi primo Mapachón el Chonchón, ¡caramba! Y eres la niña más inteligente de todas, Marcus y yo sabemos lo inteligente que eres, jamás lo olvides. Te amamos tanto que cuesta mucho decir adiós, pero... sabemos que es por tu bien. Esperamos ver tus aventuras pronto, Marcus y yo tendremos que ir a Júpiter a recolectar uvas espaciales, pues mi mejor amigo Mapahiux me dijo que allá hay uvas gigantes. Así que nos esperan muchas aventuras a los dos, pero a ti te esperan muchas más en tu vida, con tanto brillo que tienes lograrás cosas asombrosas y no puedo estar más emocionado por ti. Te amo, Jazz, Jazz, mi Rapijazz, y no olvides comerte tus uvas todos los días. Ayooooosh (come uva) ñum ñum.`
