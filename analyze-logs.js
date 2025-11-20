#!/usr/bin/env node

/**
 * AjaxCMS Log Analyzer - Utility for analyzing server access logs
 *
 * Analyzes server logs to provide statistics on page hits per site including unique IPs,
 * total hits, bandwidth usage, and detailed page access statistics per log file.
 *
 * Copyright (C) 2016-2025 Brandon Hoult
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 *
 * Usage:
 *   node analyze-logs.js [options] [logfile]
 *   node analyze-logs.js                    # Analyze all logs (detailed)
 *   node analyze-logs.js -s                 # Summary table only
 *   node analyze-logs.js logs/17-index.log  # Analyze specific log file
 *   node analyze-logs.js -s logs/17-index.log  # Summary for specific file
 *
 * Options:
 *   -s, --summary   Show only summary table with unique IPs, hits, and bandwidth
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
 * Extract site name from log filename
 * Examples:
 *   17-ajaxcms.org.log -> ajaxcms.org
 *   17-index.log -> index
 */
function extractSiteNameFromFilename(filename) {
  // Remove .log extension and DD- prefix
  const match = filename.match(/^\d{2}-(.+)\.log$/);
  if (match) {
    return match[1];
  }
  return 'unknown';
}

/**
 * Analyze a single log file
 */
function analyzeLogFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());

  const fileName = path.basename(filePath);
  const siteName = extractSiteNameFromFilename(fileName);

  const stats = {
    fileName: fileName,
    siteName: siteName,
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
 * Print statistics for a single log file/site
 */
function printStats(stats) {
  console.log('\n' + '='.repeat(80));
  console.log(`Site: ${stats.siteName}`);
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

  console.log('\n📄 Top Pages (sorted by unique visitors):');
  Object.entries(stats.pageHits)
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
 * Aggregate statistics from multiple log files by site
 */
function aggregateStats(allStats) {
  const siteMap = {};

  for (const stats of allStats) {
    const siteName = stats.siteName;

    if (!siteMap[siteName]) {
      siteMap[siteName] = {
        siteName: siteName,
        files: [],
        totalRequests: 0,
        uniqueIPs: new Set(),
        pageHits: {},
        statusCodes: {},
        methods: {},
        totalBytes: 0
      };
    }

    const site = siteMap[siteName];
    site.files.push(stats.fileName);
    site.totalRequests += stats.totalRequests;
    stats.uniqueIPs.forEach(ip => site.uniqueIPs.add(ip));
    site.totalBytes += stats.totalBytes;

    // Aggregate page hits
    for (const [url, data] of Object.entries(stats.pageHits)) {
      if (!site.pageHits[url]) {
        site.pageHits[url] = {
          count: 0,
          uniqueIPs: new Set(),
          methods: {},
          statusCodes: {}
        };
      }
      site.pageHits[url].count += data.count;
      data.uniqueIPs.forEach(ip => site.pageHits[url].uniqueIPs.add(ip));

      for (const [method, count] of Object.entries(data.methods)) {
        site.pageHits[url].methods[method] = (site.pageHits[url].methods[method] || 0) + count;
      }

      for (const [status, count] of Object.entries(data.statusCodes)) {
        site.pageHits[url].statusCodes[status] = (site.pageHits[url].statusCodes[status] || 0) + count;
      }
    }

    // Aggregate status codes
    for (const [status, count] of Object.entries(stats.statusCodes)) {
      site.statusCodes[status] = (site.statusCodes[status] || 0) + count;
    }

    // Aggregate methods
    for (const [method, count] of Object.entries(stats.methods)) {
      site.methods[method] = (site.methods[method] || 0) + count;
    }
  }

  return Object.values(siteMap).sort((a, b) => b.totalRequests - a.totalRequests);
}

/**
 * Print aggregated statistics
 */
function printAggregatedStats(aggregatedSites) {
  console.log('\n' + '='.repeat(80));
  console.log('Combined Analysis');
  console.log('='.repeat(80));

  for (const site of aggregatedSites) {
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`Site: ${site.siteName}`);
    console.log(`Log Files: ${site.files.join(', ')}`);
    console.log('─'.repeat(80));

    console.log('\n📊 Overall Statistics:');
    console.log(`   Total Requests: ${site.totalRequests}`);
    console.log(`   Unique IPs: ${site.uniqueIPs.size}`);
    console.log(`   Total Data Transferred: ${formatBytes(site.totalBytes)}`);

    console.log('\n📈 HTTP Methods:');
    Object.entries(site.methods)
      .sort((a, b) => b[1] - a[1])
      .forEach(([method, count]) => {
        console.log(`   ${method}: ${count}`);
      });

    console.log('\n✅ Status Codes:');
    Object.entries(site.statusCodes)
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
    Object.entries(site.pageHits)
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

  console.log('\n');
}

/**
 * Print summary table
 */
function printSummaryTable(aggregatedSites) {
  // Calculate column widths
  const maxSiteLength = Math.max(...aggregatedSites.map(s => s.siteName.length), 'Site'.length);
  const siteWidth = Math.max(maxSiteLength + 2, 20);

  // Header
  console.log('\n' + '='.repeat(80));
  console.log('Traffic Summary');
  console.log('='.repeat(80));
  console.log();

  // Table header with status codes
  const header = `${'Site'.padEnd(siteWidth)} ${'Unique IPs'.padStart(10)} ${'Total Hits'.padStart(11)} ${'Bandwidth'.padStart(12)} ${'200'.padStart(6)} ${'304'.padStart(6)} ${'404'.padStart(6)} ${'Other'.padStart(6)}`;
  console.log(header);
  console.log('─'.repeat(header.length));

  // Table rows
  for (const site of aggregatedSites) {
    const siteName = site.siteName.padEnd(siteWidth);
    const uniqueIPs = site.uniqueIPs.size.toString().padStart(10);
    const totalHits = site.totalRequests.toString().padStart(11);
    const bandwidth = formatBytes(site.totalBytes).padStart(12);

    // Status codes
    const status200 = (site.statusCodes[200] || 0).toString().padStart(6);
    const status304 = (site.statusCodes[304] || 0).toString().padStart(6);
    const status404 = (site.statusCodes[404] || 0).toString().padStart(6);

    // Calculate "other" status codes
    let otherCount = 0;
    for (const [code, count] of Object.entries(site.statusCodes)) {
      if (code !== '200' && code !== '304' && code !== '404') {
        otherCount += count;
      }
    }
    const statusOther = otherCount.toString().padStart(6);

    console.log(`${siteName} ${uniqueIPs} ${totalHits} ${bandwidth} ${status200} ${status304} ${status404} ${statusOther}`);
  }

  // Totals
  const totalIPs = new Set();
  let totalHits = 0;
  let totalBandwidth = 0;
  const totalStatusCodes = {};

  for (const site of aggregatedSites) {
    site.uniqueIPs.forEach(ip => totalIPs.add(ip));
    totalHits += site.totalRequests;
    totalBandwidth += site.totalBytes;

    for (const [code, count] of Object.entries(site.statusCodes)) {
      totalStatusCodes[code] = (totalStatusCodes[code] || 0) + count;
    }
  }

  // Calculate total "other" status codes
  let totalOther = 0;
  for (const [code, count] of Object.entries(totalStatusCodes)) {
    if (code !== '200' && code !== '304' && code !== '404') {
      totalOther += count;
    }
  }

  console.log('─'.repeat(header.length));
  const totalsRow = `${'TOTAL'.padEnd(siteWidth)} ${totalIPs.size.toString().padStart(10)} ${totalHits.toString().padStart(11)} ${formatBytes(totalBandwidth).padStart(12)} ${(totalStatusCodes[200] || 0).toString().padStart(6)} ${(totalStatusCodes[304] || 0).toString().padStart(6)} ${(totalStatusCodes[404] || 0).toString().padStart(6)} ${totalOther.toString().padStart(6)}`;
  console.log(totalsRow);
  console.log();
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);

  // Check for -s flag
  const summaryMode = args.includes('-s') || args.includes('--summary');
  const otherArgs = args.filter(a => a !== '-s' && a !== '--summary');

  if (otherArgs.length === 0) {
    // Analyze all log files in logs directory
    if (!summaryMode) {
      console.log('Analyzing all log files in logs/...\n');
    }

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

    if (summaryMode) {
      // Summary mode: just show the table
      const aggregated = aggregateStats(allStats);
      printSummaryTable(aggregated);
    } else {
      // Full mode: show everything
      // Print individual stats
      allStats.forEach(stats => printStats(stats));

      // Print aggregated stats if multiple files
      if (allStats.length > 1) {
        const aggregated = aggregateStats(allStats);
        printAggregatedStats(aggregated);
      }
    }

  } else {
    // Analyze specific log file
    const logFile = otherArgs[0];

    if (!fs.existsSync(logFile)) {
      console.error(`Error: Log file '${logFile}' does not exist`);
      process.exit(1);
    }

    const stats = analyzeLogFile(logFile);

    if (summaryMode) {
      // Summary mode for single file
      const aggregated = [{
        siteName: stats.siteName,
        uniqueIPs: stats.uniqueIPs,
        totalRequests: stats.totalRequests,
        totalBytes: stats.totalBytes
      }];
      printSummaryTable(aggregated);
    } else {
      printStats(stats);
      console.log('\n');
    }
  }
}

// Run the analyzer
main();
