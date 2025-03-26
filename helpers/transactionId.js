const crypto=require('crypto')

function generateTransactionId() {
  const timestamp = Date.now().toString(); // Current timestamp in milliseconds
  const randomNumber = parseInt(crypto.randomBytes(4).toString('hex'), 16); // Convert hex to integer
  const numericRandom = randomNumber.toString().slice(0, 6); // Extract first 6 digits for brevity
  return `${timestamp}${numericRandom}`;
}

module.exports=
{
    generateTransactionId,
}
