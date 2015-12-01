function mergesort(array, comparator) {
    let len = array.length;
    let a = array;
    let b = new Array(len);
    let tmp;

    for (let p = 1; p < len; p <<= 1) {
        for (let m = 0; m < len; m += p << 1) {
            let begin = m;
            let middle = Math.min(len, m + p);
            let end = Math.min(len, m + (p << 1));
            merge(a, b, begin, middle, end, comparator);
        }
        tmp = a;
        a = b;
        b = a;
    }

    if (array !== a) {
        for (let i = 0; i < len; ++i) {
            array[i] = a[i];
        }
    }
}

function merge(a, b, begin, middle, end, comparator) {
    let i = begin;
    let j = middle;
    let k = begin;

    while (k < end) {
        if (i < middle && (j >= end || comparator(a[i], a[j]) <= 0)) {
            b[k++] = a[i++];
        } else {
            b[k++] = a[j++];
        }
    }
}

export default mergesort;
