const v8 = require('v8');


const maxHeapSizeBytes = v8.getHeapStatistics().heap_size_limit;
const maxHeapSizeGB = maxHeapSizeBytes / (1024 * 1024 * 1024);

console.log('Max Heap Size (Bytes):', maxHeapSizeBytes);
console.log('Max Heap Size (GB):', maxHeapSizeGB);
