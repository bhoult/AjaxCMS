/* Conway's Game of Life Theme - AjaxCMS */

$('#background').css('background', '#000');

// Configuration
var cellSize = 10;  // Size of each cell in pixels
var updateSpeed = 100;  // Milliseconds between generations
var grid = [];
var cols, rows;
var lastUpdate = 0;

// Colors
var aliveColor = 'rgba(0, 255, 100, 0.8)';
var deadColor = 'rgba(0, 0, 0, 0)';
var gridColor = 'rgba(0, 255, 100, 0.1)';

// Mouse drawing state
var isDrawing = false;
var brushSize = 2;  // Size of brush in cells

////////////////////////////////////////////////////////////////////

// Initialize the grid with random cells
function initializeGrid() {
    grid = [];
    for (let i = 0; i < cols; i++) {
        grid[i] = [];
        for (let j = 0; j < rows; j++) {
            // Random initialization - about 30% cells alive
            grid[i][j] = Math.random() > 0.7 ? 1 : 0;
        }
    }
}

// Count alive neighbors for a cell
function countNeighbors(x, y) {
    let count = 0;
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            if (i === 0 && j === 0) continue;

            let col = (x + i + cols) % cols;  // Wrap around edges
            let row = (y + j + rows) % rows;
            count += grid[col][row];
        }
    }
    return count;
}

// Apply Conway's Game of Life rules
function nextGeneration() {
    let next = [];

    for (let i = 0; i < cols; i++) {
        next[i] = [];
        for (let j = 0; j < rows; j++) {
            let neighbors = countNeighbors(i, j);
            let state = grid[i][j];

            // Conway's rules:
            // 1. Any live cell with 2-3 neighbors survives
            // 2. Any dead cell with exactly 3 neighbors becomes alive
            // 3. All other cells die or stay dead
            if (state === 1 && (neighbors === 2 || neighbors === 3)) {
                next[i][j] = 1;  // Survival
            } else if (state === 0 && neighbors === 3) {
                next[i][j] = 1;  // Birth
            } else {
                next[i][j] = 0;  // Death
            }
        }
    }

    grid = next;
}

// Draw the grid
function drawGrid(ctx) {
    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            let x = i * cellSize;
            let y = j * cellSize;

            if (grid[i][j] === 1) {
                ctx.fillStyle = aliveColor;
                ctx.fillRect(x, y, cellSize, cellSize);
            }

            // Optional: Draw grid lines
            // ctx.strokeStyle = gridColor;
            // ctx.strokeRect(x, y, cellSize, cellSize);
        }
    }
}

function drawFrame(ctx, timestamp) {
    // Clear the frame
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update generation at specified speed
    if (timestamp - lastUpdate > updateSpeed) {
        nextGeneration();
        lastUpdate = timestamp;
    }

    // Draw the current generation
    drawGrid(ctx);
}

// Add cells at mouse position
function addCellsAtMouse(mouseX, mouseY) {
    // Convert mouse coordinates to grid coordinates
    let gridX = Math.floor(mouseX / cellSize);
    let gridY = Math.floor(mouseY / cellSize);

    // Add cells in a brush area
    for (let i = -brushSize; i <= brushSize; i++) {
        for (let j = -brushSize; j <= brushSize; j++) {
            let x = gridX + i;
            let y = gridY + j;

            // Make sure we're within bounds
            if (x >= 0 && x < cols && y >= 0 && y < rows) {
                grid[x][y] = 1;
            }
        }
    }
}

// Setup mouse event handlers
function setupMouseHandlers(canvas) {
    canvas.addEventListener('mousedown', function(e) {
        isDrawing = true;
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        addCellsAtMouse(mouseX, mouseY);
    });

    canvas.addEventListener('mouseup', function() {
        isDrawing = false;
    });

    canvas.addEventListener('mouseleave', function() {
        isDrawing = false;
    });

    canvas.addEventListener('mousemove', function(e) {
        if (isDrawing) {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            addCellsAtMouse(mouseX, mouseY);
        }
    });

    // Touch support for mobile devices
    canvas.addEventListener('touchstart', function(e) {
        e.preventDefault();
        isDrawing = true;
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const mouseX = touch.clientX - rect.left;
        const mouseY = touch.clientY - rect.top;
        addCellsAtMouse(mouseX, mouseY);
    });

    canvas.addEventListener('touchend', function(e) {
        e.preventDefault();
        isDrawing = false;
    });

    canvas.addEventListener('touchmove', function(e) {
        e.preventDefault();
        if (isDrawing) {
            const rect = canvas.getBoundingClientRect();
            const touch = e.touches[0];
            const mouseX = touch.clientX - rect.left;
            const mouseY = touch.clientY - rect.top;
            addCellsAtMouse(mouseX, mouseY);
        }
    });
}

////////////////////////////////////////////////////////////////////
startBackground = function() {
    frame = 0;

    // Set up the background canvas
    canvas = document.getElementById('background');
    ctx = canvas.getContext("2d");
    page_width = window.innerWidth;
    page_height = window.innerHeight;
    ctx.canvas.width = page_width;
    ctx.canvas.height = page_height;

    // Calculate grid dimensions
    cols = Math.floor(page_width / cellSize);
    rows = Math.floor(page_height / cellSize);

    // Initialize with random pattern
    initializeGrid();

    // Setup mouse interaction
    setupMouseHandlers(canvas);

    // Animation Loop
    function draw(timestamp) {
        requestAnimationFrame(draw);
        drawFrame(ctx, timestamp);
    }

    draw(0);
}

// Start the background animation.
startBackground();
