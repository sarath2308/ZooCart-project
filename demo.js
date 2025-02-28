function numberToUUID(num) {
    let hex = num.toString(16).padStart(32, '0'); // Convert to hex and ensure 32 characters
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

let bigNumber = 62833846215773545774468990936843345492n; // Use BigInt for large numbers
let uuid = numberToUUID(bigNumber);
console.log(uuid); // Outputs a UUID-like string
