export default function FormatarString(texto) {
  if (!texto) return ""; // Evita erro se o texto vier nulo ou indefinido
  return texto
    .normalize("NFD") // Decompõe caracteres acentuados (ex: á -> a + ´)
    .replace(/[\u0300-\u036f]/g, "") // Remove os acentos
    .replace(/[^a-zA-Z0-9\s]/g, "") // Remove tudo que não é letra, número ou espaço
    .trim() // Remove espaços inúteis no início e fim
    .replace(/\s+/g, "-"); // Substitui espaços por hifens
}
