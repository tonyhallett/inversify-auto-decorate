export function getAllFuncs(obj:any) {
    const props = Object.getOwnPropertyNames(Object.getPrototypeOf(obj));

    return props.sort().filter(function(e, i, arr) { 
       if (e!=arr[i+1] && typeof obj[e] == 'function') return true;
    });
}