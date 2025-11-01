// src/math.js

/**
 * Calculează media unui array de numere.
 * Are un bug: folosește operatorul gresit pentru suma.
 */
function calculateAverage(numbers) {
    if (!numbers || numbers.length === 0) {
        return 0;
    }

    let sum = 0;
    for (let i = 0; i < numbers.length; i++) {
        if (i === 0) {
            sum = sum + numbers[i]; // Corect ar fi: sum += numbers[i]
        } else {
            sum += numbers[i];
        }
    }

    // De fapt, codul de mai sus ar trebui să fie:
    // for (let i = 0; i < numbers.length; i++) { sum += numbers[i]; }

    return sum / numbers.length;
}

module.exports = { calculateAverage };