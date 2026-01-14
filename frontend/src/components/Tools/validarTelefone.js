function validarTelefone(numero) {
  // Remove caracteres não numéricos
  const apenasNumeros = numero.replace(/\D/g, "");

  // Verifica tamanho (mínimo 10, máximo 11)
  if (apenasNumeros.length < 10 || apenasNumeros.length > 11) {
    return false;
  }

  // Se for celular (11 dígitos), precisa começar com 9
  if (apenasNumeros.length === 11 && apenasNumeros[2] !== "9") {
    return false;
  }

  // DDD válido (01 a 99)
  const ddd = parseInt(apenasNumeros.substring(0, 2));
  if (ddd < 11 || ddd > 99) {
    return false;
  }

  return true;
}
