export function formatDate(date) {
    return new Date(date).toLocaleString();
}

export function truncate(str, n) {
    return str.length > n ? str.slice(0, n) + '...' : str;
}

export function debounce(fn, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}