const chartFont = 'Texturina, Imbue, serif';

export const tooltipStyle = {
  background: 'rgba(12, 14, 20, 0.96)',
  border: '1px solid rgba(255, 255, 255, 0.16)',
  borderRadius: 12,
  color: '#ffffff',
  fontSize: 13,
  fontFamily: chartFont,
};

export const axisTick = { fill: '#a1a1aa', fontSize: 12, fontFamily: chartFont };

export const gridStroke = 'rgba(255, 255, 255, 0.08)';

export const SERIES = ['#e7e7ea', '#a1a1aa', '#c4b8a5', '#7f8b99', '#d5d0c8'];

export const LANGUAGE_COLORS = {
  JavaScript: '#f7df1e',
  TypeScript: '#3178c6',
  Python: '#3776ab',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Go: '#00add8',
  Rust: '#b7410e',
  Ruby: '#701516',
  PHP: '#4f5d95',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  Swift: '#f05138',
  Kotlin: '#a97bff',
  Dart: '#00b4ab',
  Scala: '#c22d40',
};

export function languageColor(name, index) {
  return LANGUAGE_COLORS[name] || SERIES[index % SERIES.length];
}
