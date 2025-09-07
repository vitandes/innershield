// Colores basados en psicología del color para bienestar mental
export const colors = {
  // Colores principales - Paleta Mindfulness Morada
  primary: {
    // Púrpura claro: Mindfulness, calma, espiritualidad
    purple: '#B39DDB',
    purpleLight: '#D1C4E9',
    purpleDark: '#9575CD',
    
    // Lavanda: Serenidad, relajación
    lavender: '#E1BEE7',
    lavenderLight: '#F3E5F5',
    lavenderDark: '#CE93D8',
    
    // Rojo: Urgencia, energía (para crisis)
    red: '#F44336',
    redLight: '#EF5350',
    redDark: '#D32F2F',
  },
  
  // Colores secundarios - Tonos complementarios
  secondary: {
    // Azul suave: Tranquilidad, confianza
    blue: '#81C784',
    blueLight: '#A5D6A7',
    
    // Rosa suave: Compasión, amor propio
    pink: '#F8BBD9',
    pinkLight: '#FCE4EC',
    
    // Verde menta: Equilibrio, renovación
    mint: '#B2DFDB',
    mintLight: '#E0F2F1',
    
    // Amarillo suave: Claridad, optimismo
    yellow: '#FFF9C4',
    yellowLight: '#FFFDE7',
  },
  
  // Colores neutros
  neutral: {
    white: '#FFFFFF',
    black: '#000000',
    gray100: '#F5F5F5',
    gray200: '#EEEEEE',
    gray300: '#E0E0E0',
    gray400: '#BDBDBD',
    gray500: '#9E9E9E',
    gray600: '#757575',
    gray700: '#616161',
    gray800: '#424242',
    gray900: '#212121',
  },
  
  // Estados emocionales
  mood: {
    excellent: '#4CAF50',  // Verde brillante
    good: '#8BC34A',       // Verde claro
    okay: '#FFC107',       // Amarillo
    poor: '#FF9800',       // Naranja
    terrible: '#F44336',   // Rojo
  },
  
  // Niveles de escudo
  shield: {
    strong: '#4CAF50',     // Verde - 70-100%
    moderate: '#FF9800',   // Naranja - 40-69%
    vulnerable: '#F44336', // Rojo - 0-39%
  },
  
  // Colores de tema - Fondo morado claro
  light: {
    background: '#F3E5F5',
    surface: '#FFFFFF',
    surfaceVariant: '#FAF8FC',
    text: '#4A148C',
    textSecondary: '#7B1FA2',
    textTertiary: '#9C27B0',
    border: '#E1BEE7',
    divider: '#F3E5F5',
    shadow: 'rgba(156, 39, 176, 0.1)',
  },
  
  // Modo oscuro
  dark: {
    background: '#121212',
    surface: '#1E1E1E',
    surfaceVariant: '#2C2C2C',
    text: '#FFFFFF',
    textSecondary: '#B3B3B3',
    textTertiary: '#808080',
    border: '#333333',
    divider: '#2A2A2A',
    shadow: 'rgba(0, 0, 0, 0.3)',
  },
  
  // Gradientes terapéuticos
  gradients: {
    mindful: ['#B39DDB', '#D1C4E9'],     // Púrpura mindfulness principal
    calm: ['#E1BEE7', '#F3E5F5'],       // Lavanda calmante
    trust: ['#81C784', '#A5D6A7'],      // Verde suave confianza
    energy: ['#F8BBD9', '#FCE4EC'],     // Rosa energía positiva
    crisis: ['#F44336', '#EF5350'],     // Rojo urgencia
    sunset: ['#B39DDB', '#F8BBD9'],     // Atardecer mindful
    ocean: ['#B2DFDB', '#E0F2F1'],      // Océano menta
    forest: ['#81C784', '#B2DFDB'],     // Bosque sereno
  },
  
  // Transparencias
  alpha: {
    low: 0.1,
    medium: 0.3,
    high: 0.7,
  },
};

// Función para obtener colores según el tema
export const getThemeColors = (isDark = false) => {
  const base = isDark ? colors.dark : colors.light;
  
  return {
    ...colors,
    background: base.background,
    surface: base.surface,
    surfaceVariant: base.surfaceVariant,
    text: base.text,
    textSecondary: base.textSecondary,
    textTertiary: base.textTertiary,
    border: base.border,
    divider: base.divider,
    shadow: base.shadow,
  };
};

// Colores específicos para estados de bienestar
export const wellnessColors = {
  // Niveles de ansiedad
  anxiety: {
    low: colors.primary.green,
    medium: colors.secondary.orange,
    high: colors.primary.red,
  },
  
  // Niveles de estrés
  stress: {
    relaxed: colors.primary.blue,
    moderate: colors.secondary.yellow,
    high: colors.primary.red,
  },
  
  // Estados de ánimo
  emotions: {
    happy: colors.secondary.yellow,
    calm: colors.primary.blue,
    sad: colors.primary.blue,
    angry: colors.primary.red,
    anxious: colors.secondary.orange,
    peaceful: colors.primary.green,
  },
};

export default colors;