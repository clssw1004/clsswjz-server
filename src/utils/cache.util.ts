const cache:any = {};

export const setCache = (key:string, value:string) => {
    cache[key] = value;
}

export const getCache = (key:string) => {
    return cache[key];
}
