#!/usr/bin/env node

/**
 * AjaxCMS Log Analyzer
 *
 * Analyzes server logs to provide statistics on page hits, grouped by site.
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
 * Extract site name from URL
 * Examples:
 *   /ajaxcms.org/ -> ajaxcms.org
 *   /ajaxcms.org/pages/... -> ajaxcms.org
 *   / -> index
 *   /sites -> index
 */
function extractSiteName(url) {
  // Remove query string
  const cleanUrl = url.split('?')[0];

  // Match /sitename/ pattern
  const match = cleanUrl.match(/^\/([^\/]+)\//);
  if (match) {
    return match[1];
  }

  // Root paths go to 'index'
  if (cleanUrl === '/' || cleanUrl === '/sites' || cleanUrl === '/sites/') {
    return 'index';
  }

  return 'other';
}

/**
 * Analyze a single log file and group by site
 */
function analyzeLogFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());

  const stats = {
    fileName: path.basename(filePath),
    sites: {} // site -> stats mapping
  };

  for (const line of lines) {
    const entry = parseLogLine(line);
    if (!entry) continue;

    const siteName = extractSiteName(entry.url);

    // Initialize site stats if needed
    if (!stats.sites[siteName]) {
      stats.sites[siteName] = {
        totalRequests: 0,
        uniqueIPs: new Set(),
        pageHits: {},
        statusCodes: {},
        methods: {},
        totalBytes: 0
      };
    }

    const site = stats.sites[siteName];
    site.totalRequests++;
    site.uniqueIPs.add(entry.ip);

    // Track page hits
    if (!site.pageHits[entry.url]) {
      site.pageHits[entry.url] = {
        count: 0,
        uniqueIPs: new Set(),
        methods: {},
        statusCodes: {}
      };
    }
    site.pageHits[entry.url].count++;
    site.pageHits[entry.url].uniqueIPs.add(entry.ip);
    site.pageHits[entry.url].methods[entry.method] = (site.pageHits[entry.url].methods[entry.method] || 0) + 1;
    site.pageHits[entry.url].statusCodes[entry.status] = (site.pageHits[entry.url].statusCodes[entry.status] || 0) + 1;

    // Track status codes
    site.statusCodes[entry.status] = (site.statusCodes[entry.status] || 0) + 1;

    // Track methods
    site.methods[entry.method] = (site.methods[entry.method] || 0) + 1;

    // Track bytes
    site.totalBytes += entry.size;
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
 * Print statistics for a single site
 */
function printSiteStats(siteName, siteStats) {
  console.log(`\n${'─'.repeat(80)}`);
  console.log(`Site: ${siteName}`);
  console.log('─'.repeat(80));

  console.log('\n📊 Overall Statistics:');
  console.log(`   Total Requests: ${siteStats.totalRequests}`);
  console.log(`   Unique IPs: ${siteStats.uniqueIPs.size}`);
  console.log(`   Total Data Transferred: ${formatBytes(siteStats.totalBytes)}`);

  console.log('\n📈 HTTP Methods:');
  Object.entries(siteStats.methods)
    .sort((a, b) => b[1] - a[1])
    .forEach(([method, count]) => {
      console.log(`   ${method}: ${count}`);
    });

  console.log('\n✅ Status Codes:');
  Object.entries(siteStats.statusCodes)
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

  console.log('\n📄 Top Pages (sorted by unique visitors):');
  Object.entries(siteStats.pageHits)
    .map(([url, data]) => ({
      url,
      count: data.count,
      uniqueIPs: data.uniqueIPs.size,
      methods: data.methods,
      statusCodes: data.statusCodes
    }))
    .sort((a, b) => b.uniqueIPs - a.uniqueIPs)
    .slice(0, 10) // Top 10 pages
    .forEach(page => {
      console.log(`\n   ${page.url}`);
      console.log(`      Hits: ${page.count}, Unique IPs: ${page.uniqueIPs}`);

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
 * Print statistics for a single log file
 */
function printStats(stats) {
  console.log('\n' + '='.repeat(80));
  console.log(`Log File: ${stats.fileName}`);
  console.log('='.repeat(80));

  // Print each site's stats
  const sortedSites = Object.entries(stats.sites)
    .sort((a, b) => b[1].totalRequests - a[1].totalRequests);

  for (const [siteName, siteStats] of sortedSites) {
    printSiteStats(siteName, siteStats);
  }
}

/**
 * Aggregate statistics from multiple log files
 */
function aggregateStats(allStats) {
  const combined = {
    files: allStats.map(s => s.fileName),
    sites: {}
  };

  for (const stats of allStats) {
    for (const [siteName, siteStats] of Object.entries(stats.sites)) {
      if (!combined.sites[siteName]) {
        combined.sites[siteName] = {
          totalRequests: 0,
          uniqueIPs: new Set(),
          pageHits: {},
          statusCodes: {},
          methods: {},
          totalBytes: 0
        };
      }

      const combinedSite = combined.sites[siteName];
      combinedSite.totalRequests += siteStats.totalRequests;
      siteStats.uniqueIPs.forEach(ip => combinedSite.uniqueIPs.add(ip));
      combinedSite.totalBytes += siteStats.totalBytes;

      // Aggregate page hits
      for (const [url, data] of Object.entries(siteStats.pageHits)) {
        if (!combinedSite.pageHits[url]) {
          combinedSite.pageHits[url] = {
            count: 0,
            uniqueIPs: new Set(),
            methods: {},
            statusCodes: {}
          };
        }
        combinedSite.pageHits[url].count += data.count;
        data.uniqueIPs.forEach(ip => combinedSite.pageHits[url].uniqueIPs.add(ip));

        for (const [method, count] of Object.entries(data.methods)) {
          combinedSite.pageHits[url].methods[method] = (combinedSite.pageHits[url].methods[method] || 0) + count;
        }

        for (const [status, count] of Object.entries(data.statusCodes)) {
          combinedSite.pageHits[url].statusCodes[status] = (combinedSite.pageHits[url].statusCodes[status] || 0) + count;
        }
      }

      // Aggregate status codes
      for (const [status, count] of Object.entries(siteStats.statusCodes)) {
        combinedSite.statusCodes[status] = (combinedSite.statusCodes[status] || 0) + count;
      }

      // Aggregate methods
      for (const [method, count] of Object.entries(siteStats.methods)) {
        combinedSite.methods[method] = (combinedSite.methods[method] || 0) + count;
      }
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

  // Print each site's aggregated stats
  const sortedSites = Object.entries(stats.sites)
    .sort((a, b) => b[1].totalRequests - a[1].totalRequests);

  for (const [siteName, siteStats] of sortedSites) {
    printSiteStats(siteName, siteStats);
  }

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
