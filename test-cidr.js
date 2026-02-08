// Test script to verify CIDR matching logic
function normalizeIp(ip) {
  return ip.trim().toLowerCase();
}

function ipToBigInt(ip) {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4) return 0n;
  return (BigInt(parts[0]) << 24n) |
         (BigInt(parts[1]) << 16n) |
         (BigInt(parts[2]) << 8n) |
         BigInt(parts[3]);
}

function ipInCidrRange(ip, cidr) {
  try {
    const [range, prefixStr] = cidr.split('/');
    const prefix = parseInt(prefixStr, 10);
    if (isNaN(prefix) || prefix < 0 || prefix > 32) return false;

    const ipBigInt = ipToBigInt(ip);
    const rangeBigInt = ipToBigInt(range);
    // Create network mask: first 'prefix' bits are 1, rest are 0
    const mask = prefix === 0 ? 0n : (1n << BigInt(32)) - (1n << BigInt(32 - prefix));

    return (ipBigInt & mask) === (rangeBigInt & mask);
  } catch {
    return false;
  }
}

// Test cases
const testCases = [
  { ip: '100.64.0.2', cidr: '100.64.0.0/10', expected: true },
  { ip: '100.64.0.2', cidr: '100.64.0.0/16', expected: false },
  { ip: '100.64.0.2', cidr: '100.64.0.0/8', expected: true },
  { ip: '100.64.0.2', cidr: '100.64.0.0/32', expected: false },
];

console.log('Testing CIDR matching:');
testCases.forEach(({ ip, cidr, expected }) => {
  const result = ipInCidrRange(ip, cidr);
  console.log(`${ip} in ${cidr}: ${result} (expected: ${expected}) ${result === expected ? '✓' : '✗'}`);
});

// Debug the specific case
const ip = '100.64.0.2';
const cidr = '100.64.0.0/10';
console.log('\nDebugging:');
console.log(`IP: ${ip}`);
console.log(`CIDR: ${cidr}`);
console.log(`IP BigInt: ${ipToBigInt(ip)}`);
console.log(`Range BigInt: ${ipToBigInt(cidr.split('/')[0])}`);
console.log(`Prefix: ${cidr.split('/')[1]}`);

const prefix = parseInt(cidr.split('/')[1], 10);
const mask = prefix === 0 ? 0n : (1n << BigInt(32)) - (1n << BigInt(32 - prefix));
console.log(`Mask: ${mask}`);

const ipBigInt = ipToBigInt(ip);
const rangeBigInt = ipToBigInt(cidr.split('/')[0]);
const result = (ipBigInt & mask) === (rangeBigInt & mask);
console.log(`IP & Mask: ${ipBigInt & mask}`);
console.log(`Range & Mask: ${rangeBigInt & mask}`);
console.log(`Result: ${result}`);