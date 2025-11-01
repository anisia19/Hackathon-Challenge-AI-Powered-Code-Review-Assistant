// Aici este un modul de test pentru a verifica functionalitatea AI Reviewer-ului.

/**
 * Calculează media a două numere.
 * Returnează -1 dacă oricare număr este zero.
 * @param {number} a Primul număr.
 * @param {number} b Al doilea număr.
 * @returns {number} Media sau -1.
 */
function calculeazaMedie(a, b) {
    if (a == 0 || b == 0) {
        // Problema 1: Utilizare '==' in loc de '==='. 
        return -1;
    }

    // Problema 2: Eroare de precedență a operatorilor (trebuie sa fie (a + b) / 2).
    return a + b / 2;
}

module.exports = { calculeazaMedie };