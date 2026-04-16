export function formatSaoPaulo(dateUTC) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(dateUTC));
}

function getDateTimeSaoPaulo() {
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return formatter.format(new Date()).replace(" ", " ");
}

export function compararData(ultimo_acesso) {
  const today = getDateTimeSaoPaulo();
  const igual = String(today.split(' ')[0]) === String(ultimo_acesso)
  return igual;
}
