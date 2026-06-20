/**
 * Utility functions for exporting analytics data
 */

/**
 * Convert comparison data to CSV format
 * @param {Object} data - Comparison session data
 * @returns {string} CSV formatted string
 */
export const exportToCSV = (data) => {
  const { timestamp, algorithms, arraySize, arrayType, results, elapsedTime } = data;
  
  // Header
  let csv = 'Algorithm,Comparisons,Swaps,Time (seconds),Time Complexity,Space Complexity,Status\n';
  
  // Data rows
  algorithms.forEach(algo => {
    const result = results[algo.id] || {};
    csv += `${algo.name},${result.comparisons || 0},${result.swaps || 0},${result.isComplete ? elapsedTime : 0},${algo.timeComplexity || 'N/A'},${algo.spaceComplexity || 'N/A'},${result.isComplete ? 'Complete' : 'Incomplete'}\n`;
  });
  
  // Summary section
  csv += '\nSession Summary\n';
  csv += `Date,${new Date(timestamp).toLocaleString()}\n`;
  csv += `Array Size,${arraySize}\n`;
  csv += `Array Type,${arrayType}\n`;
  csv += `Total Time,${elapsedTime} seconds\n`;
  
  return csv;
};

/**
 * Convert comparison data to JSON format
 * @param {Object} data - Comparison session data
 * @returns {string} JSON formatted string
 */
export const exportToJSON = (data) => {
  const exportData = {
    metadata: {
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    },
    session: {
      timestamp: data.timestamp,
      arraySize: data.arraySize,
      arrayType: data.arrayType,
      elapsedTime: data.elapsedTime,
      speed: data.speed,
    },
    algorithms: data.algorithms.map(algo => ({
      id: algo.id,
      name: algo.name,
      category: algo.category,
      best: algo.best,
      average: algo.average,
      worst: algo.worst,
      space: algo.space,
      results: data.results[algo.id] || {},
    })),
    historicalData: data.historicalData || [],
  };
  
  return JSON.stringify(exportData, null, 2);
};

/**
 * Download data as a file
 * @param {string} content - File content
 * @param {string} filename - File name
 * @param {string} mimeType - MIME type
 */
export const downloadFile = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export comparison results
 * @param {Object} data - Comparison data
 * @param {string} format - 'csv' or 'json'
 */
export const exportComparisonResults = (data, format = 'json') => {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `algorithm-comparison-${timestamp}`;
  
  if (format === 'csv') {
    const csv = exportToCSV(data);
    downloadFile(csv, `${filename}.csv`, 'text/csv');
  } else {
    const json = exportToJSON(data);
    downloadFile(json, `${filename}.json`, 'application/json');
  }
};

/**
 * Generate array with specific pattern
 * @param {number} size - Array size
 * @param {string} pattern - 'random', 'sorted', 'reverse', 'nearly-sorted'
 * @returns {Array} Array of objects with value and status
 */
export const generateArrayByPattern = (size, pattern = 'random') => {
  let values = [];
  
  switch (pattern) {
    case 'sorted':
      values = Array.from({ length: size }, (_, i) => (i + 1) * 10);
      break;
      
    case 'reverse':
      values = Array.from({ length: size }, (_, i) => (size - i) * 10);
      break;
      
    case 'nearly-sorted':
      values = Array.from({ length: size }, (_, i) => (i + 1) * 10);
      // Swap ~10% of elements
      const swaps = Math.floor(size * 0.1);
      for (let i = 0; i < swaps; i++) {
        const idx1 = Math.floor(Math.random() * size);
        const idx2 = Math.floor(Math.random() * size);
        [values[idx1], values[idx2]] = [values[idx2], values[idx1]];
      }
      break;
      
    case 'few-unique':
      const uniqueCount = Math.max(3, Math.floor(size * 0.2));
      values = Array.from({ length: size }, () => 
        Math.floor(Math.random() * uniqueCount) * 50 + 20
      );
      break;
      
    case 'random':
    default:
      values = Array.from({ length: size }, () => 
        Math.floor(Math.random() * 400) + 20
      );
      break;
  }
  
  return values.map(value => ({
    value,
    status: 'default',
  }));
};

/**
 * Calculate theoretical complexity for given input size
 * @param {string} complexity - Complexity notation (e.g., 'O(n²)', 'O(n log n)')
 * @param {number} n - Input size
 * @returns {number} Theoretical operation count
 */
export const calculateTheoreticalComplexity = (complexity, n) => {
  if (!complexity) return 0;
  
  const clean = complexity.replace(/O\(|\)/g, '').trim();
  
  switch (clean) {
    case 'n':
      return n;
    case 'n²':
      return n * n;
    case 'n log n':
      return n * Math.log2(n);
    case 'log n':
      return Math.log2(n);
    case '1':
      return 1;
    case 'nk':
      // For radix sort, assume k is constant (e.g., 4)
      return n * 4;
    case 'n+k':
      // For radix sort space complexity
      return n + 4;
    default:
      return n;
  }
};

/**
 * Format complexity for display
 * @param {string} complexity - Raw complexity string
 * @returns {string} Formatted complexity
 */
export const formatComplexity = (complexity) => {
  if (!complexity) return 'N/A';
  return complexity.replace(/\^2/g, '²').replace(/log n/g, 'log n');
};
