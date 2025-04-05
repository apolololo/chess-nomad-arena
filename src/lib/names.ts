
// Liste de noms pour générer des pseudonymes aléatoires
const adjectives = [
  "Rapide", "Calme", "Rusé", "Tenace", "Brillant", "Stratège", "Astucieux", "Adroit",
  "Patient", "Intrépide", "Mystérieux", "Royal", "Énigmatique", "Vigilant", "Agile",
  "Audacieux", "Humble", "Élégant", "Prudent", "Perspicace", "Courageux", "Invincible",
  "Tactique", "Énergique", "Indomptable", "Visionnaire", "Harmonieux", "Déterminé"
];

const chessPieces = [
  "Roi", "Dame", "Tour", "Cavalier", "Fou", "Pion", "Échecs", "Gambit", "Mat",
  "Roque", "Défense", "Attaque", "Ouverture", "Finale", "Promotion", "Sacrifice",
  "Pièce", "Joueur", "Maître", "Champion", "Génie", "Stratège", "Tacticien", "Légende"
];

// Génère un pseudonyme aléatoire
export const generateUsername = (): string => {
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomChessPiece = chessPieces[Math.floor(Math.random() * chessPieces.length)];
  const randomNumber = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${randomAdjective}${randomChessPiece}${randomNumber}`;
};
