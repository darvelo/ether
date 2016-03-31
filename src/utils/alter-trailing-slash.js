let trailingSlashRegex = /\/+$/;

export function hasTrailingSlash(str) {
    return trailingSlashRegex.test(str);
}

export function addTrailingSlash(str) {
    if (!hasTrailingSlash(str)) {
        return str + '/';
    } else {
        return str;
    }
}

export function removeTrailingSlash(str) {
    if (hasTrailingSlash(str)) {
        return str.replace(trailingSlashRegex, '');
    } else {
        return str;
    }
}
