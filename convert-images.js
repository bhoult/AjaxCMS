#!/usr/bin/env node

/**
 * Image Conversion Utility for AjaxCMS
 *
 * Converts all images in a specified folder to JPG format with a width of 1024 pixels,
 * maintaining aspect ratio. Original files are backed up with .original extension.
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
 *   node convert-images.js <folder-path> [options]
 *
 * Options:
 *   --width <pixels>     Set output width (default: 1024)
 *   --quality <1-100>    Set JPG quality (default: 85)
 *   --no-backup          Don't create .original backups
 *   --dry-run            Show what would be converted without doing it
 *
 * Examples:
 *   node convert-images.js ./images/screenshots
 *   node convert-images.js ./images/photos --width 800 --quality 90
 *   node convert-images.js ./images/test --dry-run
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const sharp = require('sharp');

// Default settings
const DEFAULT_WIDTH = 1024;
const DEFAULT_QUALITY = 85;

// Supported input formats
const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.tiff', '.tif', '.bmp', '.svg'];

/**
 * Parse command line arguments
 */
function parseArgs() {
	const args = process.argv.slice(2);

	if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
		console.log(`
Image Conversion Utility for AjaxCMS

Usage: node convert-images.js <folder-path> [options]

Options:
  --width <pixels>     Set output width (default: ${DEFAULT_WIDTH})
  --quality <1-100>    Set JPG quality (default: ${DEFAULT_QUALITY})
  --no-backup          Don't create .original backups
  --dry-run            Show what would be converted without doing it
  --help, -h           Show this help message

Examples:
  node convert-images.js ./images/screenshots
  node convert-images.js ./images/photos --width 800 --quality 90
  node convert-images.js ./images/test --dry-run
		`);
		process.exit(0);
	}

	const config = {
		folder: args[0],
		width: DEFAULT_WIDTH,
		quality: DEFAULT_QUALITY,
		backup: true,
		dryRun: false
	};

	for (let i = 1; i < args.length; i++) {
		switch (args[i]) {
			case '--width':
				config.width = parseInt(args[++i], 10);
				if (isNaN(config.width) || config.width <= 0) {
					console.error('Error: --width must be a positive number');
					process.exit(1);
				}
				break;
			case '--quality':
				config.quality = parseInt(args[++i], 10);
				if (isNaN(config.quality) || config.quality < 1 || config.quality > 100) {
					console.error('Error: --quality must be between 1 and 100');
					process.exit(1);
				}
				break;
			case '--no-backup':
				config.backup = false;
				break;
			case '--dry-run':
				config.dryRun = true;
				break;
			default:
				console.error(`Unknown option: ${args[i]}`);
				process.exit(1);
		}
	}

	return config;
}

/**
 * Get all image files from a directory
 */
async function getImageFiles(folderPath) {
	try {
		const entries = await fs.readdir(folderPath, { withFileTypes: true });
		const imageFiles = [];

		for (const entry of entries) {
			if (entry.isFile()) {
				const ext = path.extname(entry.name).toLowerCase();
				// Skip already processed files and backup files
				if (SUPPORTED_FORMATS.includes(ext) && !entry.name.endsWith('.original')) {
					imageFiles.push(path.join(folderPath, entry.name));
				}
			}
		}

		return imageFiles.sort();
	} catch (error) {
		throw new Error(`Failed to read directory: ${error.message}`);
	}
}

/**
 * Convert and resize a single image
 */
async function convertImage(filePath, config) {
	const ext = path.extname(filePath).toLowerCase();
	const baseName = path.basename(filePath, ext);
	const dirName = path.dirname(filePath);
	const outputPath = path.join(dirName, `${baseName}.jpg`);

	// Get image metadata
	const metadata = await sharp(filePath).metadata();
	const originalWidth = metadata.width;
	const originalHeight = metadata.height;

	// Calculate new dimensions
	let newWidth = config.width;
	let newHeight = Math.round((originalHeight / originalWidth) * newWidth);

	// If image is smaller than target width, keep original size
	if (originalWidth <= config.width) {
		newWidth = originalWidth;
		newHeight = originalHeight;
	}

	console.log(`  ${path.basename(filePath)}: ${originalWidth}x${originalHeight} → ${newWidth}x${newHeight}`);

	if (config.dryRun) {
		return { success: true, skipped: true };
	}

	try {
		// Create backup if requested and file will be overwritten
		if (config.backup && ext !== '.jpg' && ext !== '.jpeg') {
			const backupPath = filePath + '.original';
			if (!fsSync.existsSync(backupPath)) {
				await fs.copyFile(filePath, backupPath);
			}
		}

		// Convert and resize image
		await sharp(filePath)
			.resize(newWidth, newHeight, {
				fit: 'inside',
				withoutEnlargement: true
			})
			.jpeg({
				quality: config.quality,
				mozjpeg: true
			})
			.toFile(outputPath);

		// If original was not jpg/jpeg, delete original after successful conversion
		if (ext !== '.jpg' && ext !== '.jpeg') {
			await fs.unlink(filePath);
		}

		return { success: true, skipped: false };
	} catch (error) {
		console.error(`    Error: ${error.message}`);
		return { success: false, skipped: false, error: error.message };
	}
}

/**
 * Main function
 */
async function main() {
	const config = parseArgs();

	// Verify folder exists
	try {
		const stats = await fs.stat(config.folder);
		if (!stats.isDirectory()) {
			console.error(`Error: ${config.folder} is not a directory`);
			process.exit(1);
		}
	} catch (error) {
		console.error(`Error: Directory ${config.folder} not found`);
		process.exit(1);
	}

	console.log('\nImage Conversion Utility');
	console.log('========================');
	console.log(`Folder:  ${path.resolve(config.folder)}`);
	console.log(`Width:   ${config.width}px`);
	console.log(`Quality: ${config.quality}%`);
	console.log(`Backup:  ${config.backup ? 'Yes' : 'No'}`);
	if (config.dryRun) {
		console.log('\n*** DRY RUN MODE - No files will be modified ***');
	}
	console.log('');

	// Get all image files
	const imageFiles = await getImageFiles(config.folder);

	if (imageFiles.length === 0) {
		console.log('No image files found.');
		return;
	}

	console.log(`Found ${imageFiles.length} image(s):\n`);

	// Process each image
	let successCount = 0;
	let errorCount = 0;

	for (const filePath of imageFiles) {
		const result = await convertImage(filePath, config);
		if (result.success) {
			successCount++;
		} else {
			errorCount++;
		}
	}

	// Summary
	console.log('\n========================');
	console.log('Summary:');
	console.log(`  Processed: ${successCount}/${imageFiles.length}`);
	if (errorCount > 0) {
		console.log(`  Errors:    ${errorCount}`);
	}
	if (config.dryRun) {
		console.log('\n(Dry run - no files were actually modified)');
	}
	console.log('');
}

// Run the script
main().catch(error => {
	console.error('\nFatal error:', error.message);
	process.exit(1);
});
