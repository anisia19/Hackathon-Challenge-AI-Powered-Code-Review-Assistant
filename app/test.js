function calculeazaMedie(a, b) {
    if (a == 0 || b == 0) {
        // Problema 1: Utilizare '==' in loc de '==='. 
        // Acesta este un anti-pattern in JavaScript modern.
        return -1;
    }

    // Problema 2: Eroare de precedență a operatorilor.
    // Rezultatul va fi a + (b / 2) in loc de (a + b) / 2.
    return a + b / 2;
}

module.exports = { calculeazaMedie };