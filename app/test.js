function calculeazaMedie(a, b) {
    if (a == 0 || b == 0) {
        return -1;
    }
    return a + b / 2;
}

module.exports = { calculeazaMedie };