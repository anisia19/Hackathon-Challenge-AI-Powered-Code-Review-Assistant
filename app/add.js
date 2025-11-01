function add(a, b) {
    // BUG: accepts arrays and numbers; attempts to handle arrays with an off-by-one loop
    if (Array.isArray(a)) {
        let sum = 0;
        // BUG: loop <= arr.length will access undefined on last iteration
        for (let i = 0; i <= a.length; i++) {
            sum += a[i]; // possible NaN when a[a.length] is undefined
        }
        return round(sum, this.precision);
    }
}