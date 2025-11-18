#!/usr/bin/env node

/**
 * AjaxCMS Log Analyzer
 *
 * Analyzes server logs to provide statistics on page hits.
 *
 * Usage:
 *   node analyze-logs.js [logfile]
 *   node analyze-logs.js                    # Analyze all logs in logs/
 *   node analyze-logs.js logs/17-index.log  # Analyze specific log file
 */

const fs = require('fs');
const path = require('path');

const LOGS_DIR = './logs';

/**
 * Parse a single log line in Combined Log Format
 * Format: IP - - [timestamp] "method url protocol" status size "referer" "user-agent"
 */
function parseLogLine(line) {
  const regex = /^(\S+) - - \[(.*?)\] "(\S+) (\S+) (\S+)" (\d+) (\S+) "(.*?)" "(.*?)"$/;
  const match = line.match(regex);

  if (!match) {
    return null;
  }

  return {
    ip: match[1],
    timestamp: match[2],
    method: match[3],
    url: match[4],
    protocol: match[5],
    status: parseInt(match[6]),
    size: match[7] === '-' ? 0 : parseInt(match[7]),
    referer: match[8],
    userAgent: match[9]
  };
}

/**
 * Analyze a single log file
 */
function analyzeLogFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());

  const stats = {
    fileName: path.basename(filePath),
    totalRequests: 0,
    uniqueIPs: new Set(),
    pageHits: {},
    statusCodes: {},
    methods: {},
    totalBytes: 0
  };

  for (const line of lines) {
    const entry = parseLogLine(line);
    if (!entry) continue;

    stats.totalRequests++;
    stats.uniqueIPs.add(entry.ip);

    // Track page hits
    if (!stats.pageHits[entry.url]) {
      stats.pageHits[entry.url] = {
        count: 0,
        uniqueIPs: new Set(),
        methods: {},
        statusCodes: {}
      };
    }
    stats.pageHits[entry.url].count++;
    stats.pageHits[entry.url].uniqueIPs.add(entry.ip);
    stats.pageHits[entry.url].methods[entry.method] = (stats.pageHits[entry.url].methods[entry.method] || 0) + 1;
    stats.pageHits[entry.url].statusCodes[entry.status] = (stats.pageHits[entry.url].statusCodes[entry.status] || 0) + 1;

    // Track status codes
    stats.statusCodes[entry.status] = (stats.statusCodes[entry.status] || 0) + 1;

    // Track methods
    stats.methods[entry.method] = (stats.methods[entry.method] || 0) + 1;

    // Track bytes
    stats.totalBytes += entry.size;
  }

  return stats;
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Print statistics for a single log file
 */
function printStats(stats) {
  console.log('\n' + '='.repeat(80));
  console.log(`Log File: ${stats.fileName}`);
  console.log('='.repeat(80));

  console.log('\n📊 Overall Statistics:');
  console.log(`   Total Requests: ${stats.totalRequests}`);
  console.log(`   Unique IPs: ${stats.uniqueIPs.size}`);
  console.log(`   Total Data Transferred: ${formatBytes(stats.totalBytes)}`);

  console.log('\n📈 HTTP Methods:');
  Object.entries(stats.methods)
    .sort((a, b) => b[1] - a[1])
    .forEach(([method, count]) => {
      console.log(`   ${method}: ${count}`);
    });

  console.log('\n✅ Status Codes:');
  Object.entries(stats.statusCodes)
    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
    .forEach(([status, count]) => {
      const statusName = {
        '200': 'OK',
        '304': 'Not Modified',
        '404': 'Not Found',
        '500': 'Server Error'
      }[status] || '';
      console.log(`   ${status} ${statusName}: ${count}`);
    });

  console.log('\n📄 Page Hits (sorted by unique visitors):');
  Object.entries(stats.pageHits)
    .map(([url, data]) => ({
      url,
      count: data.count,
      uniqueIPs: data.uniqueIPs.size,
      methods: data.methods,
      statusCodes: data.statusCodes
    }))
    .sort((a, b) => b.uniqueIPs - a.uniqueIPs)
    .forEach(page => {
      console.log(`\n   ${page.url}`);
      console.log(`      Total Hits: ${page.count}`);
      console.log(`      Unique Visitors: ${page.uniqueIPs}`);

      const methodStr = Object.entries(page.methods)
        .map(([method, count]) => `${method}:${count}`)
        .join(', ');
      console.log(`      Methods: ${methodStr}`);

      const statusStr = Object.entries(page.statusCodes)
        .map(([status, count]) => `${status}:${count}`)
        .join(', ');
      console.log(`      Status: ${statusStr}`);
    });
}

/**
 * Aggregate statistics from multiple log files
 */
function aggregateStats(allStats) {
  const combined = {
    files: allStats.map(s => s.fileName),
    totalRequests: 0,
    uniqueIPs: new Set(),
    pageHits: {},
    statusCodes: {},
    methods: {},
    totalBytes: 0
  };

  for (const stats of allStats) {
    combined.totalRequests += stats.totalRequests;
    stats.uniqueIPs.forEach(ip => combined.uniqueIPs.add(ip));
    combined.totalBytes += stats.totalBytes;

    // Aggregate page hits
    for (const [url, data] of Object.entries(stats.pageHits)) {
      if (!combined.pageHits[url]) {
        combined.pageHits[url] = {
          count: 0,
          uniqueIPs: new Set(),
          methods: {},
          statusCodes: {}
        };
      }
      combined.pageHits[url].count += data.count;
      data.uniqueIPs.forEach(ip => combined.pageHits[url].uniqueIPs.add(ip));

      for (const [method, count] of Object.entries(data.methods)) {
        combined.pageHits[url].methods[method] = (combined.pageHits[url].methods[method] || 0) + count;
      }

      for (const [status, count] of Object.entries(data.statusCodes)) {
        combined.pageHits[url].statusCodes[status] = (combined.pageHits[url].statusCodes[status] || 0) + count;
      }
    }

    // Aggregate status codes
    for (const [status, count] of Object.entries(stats.statusCodes)) {
      combined.statusCodes[status] = (combined.statusCodes[status] || 0) + count;
    }

    // Aggregate methods
    for (const [method, count] of Object.entries(stats.methods)) {
      combined.methods[method] = (combined.methods[method] || 0) + count;
    }
  }

  return combined;
}

/**
 * Print aggregated statistics
 */
function printAggregatedStats(stats) {
  console.log('\n' + '='.repeat(80));
  console.log(`Combined Analysis (${stats.files.length} log files)`);
  console.log('='.repeat(80));
  console.log(`Files: ${stats.files.join(', ')}`);

  console.log('\n📊 Overall Statistics:');
  console.log(`   Total Requests: ${stats.totalRequests}`);
  console.log(`   Unique IPs: ${stats.uniqueIPs.size}`);
  console.log(`   Total Data Transferred: ${formatBytes(stats.totalBytes)}`);

  console.log('\n📈 HTTP Methods:');
  Object.entries(stats.methods)
    .sort((a, b) => b[1] - a[1])
    .forEach(([method, count]) => {
      console.log(`   ${method}: ${count}`);
    });

  console.log('\n✅ Status Codes:');
  Object.entries(stats.statusCodes)
    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
    .forEach(([status, count]) => {
      const statusName = {
        '200': 'OK',
        '304': 'Not Modified',
        '404': 'Not Found',
        '500': 'Server Error'
      }[status] || '';
      console.log(`   ${status} ${statusName}: ${count}`);
    });

  console.log('\n📄 Page Hits (sorted by unique visitors):');
  Object.entries(stats.pageHits)
    .map(([url, data]) => ({
      url,
      count: data.count,
      uniqueIPs: data.uniqueIPs.size,
      methods: data.methods,
      statusCodes: data.statusCodes
    }))
    .sort((a, b) => b.uniqueIPs - a.uniqueIPs)
    .forEach(page => {
      console.log(`\n   ${page.url}`);
      console.log(`      Total Hits: ${page.count}`);
      console.log(`      Unique Visitors: ${page.uniqueIPs}`);

      const methodStr = Object.entries(page.methods)
        .map(([method, count]) => `${method}:${count}`)
        .join(', ');
      console.log(`      Methods: ${methodStr}`);

      const statusStr = Object.entries(page.statusCodes)
        .map(([status, count]) => `${status}:${count}`)
        .join(', ');
      console.log(`      Status: ${statusStr}`);
    });

  console.log('\n');
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // Analyze all log files in logs directory
    console.log('Analyzing all log files in logs/...\n');

    if (!fs.existsSync(LOGS_DIR)) {
      console.error('Error: logs/ directory does not exist');
      process.exit(1);
    }

    const files = fs.readdirSync(LOGS_DIR)
      .filter(f => f.endsWith('.log'))
      .map(f => path.join(LOGS_DIR, f));

    if (files.length === 0) {
      console.error('Error: No log files found in logs/');
      process.exit(1);
    }

    const allStats = files.map(file => analyzeLogFile(file));

    // Print individual stats
    allStats.forEach(stats => printStats(stats));

    // Print aggregated stats if multiple files
    if (allStats.length > 1) {
      const combined = aggregateStats(allStats);
      printAggregatedStats(combined);
    }

  } else {
    // Analyze specific log file
    const logFile = args[0];

    if (!fs.existsSync(logFile)) {
      console.error(`Error: Log file '${logFile}' does not exist`);
      process.exit(1);
    }

    const stats = analyzeLogFile(logFile);
    printStats(stats);
    console.log('\n');
  }
}

// Run the analyzer
main();
