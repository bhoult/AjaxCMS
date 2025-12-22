# About the Hope Theme

## Technical Details

The Hope theme uses HTML5 Canvas and JavaScript to create real-time procedural tree animations. Each tree grows according to algorithmic rules that simulate natural branching patterns, complete with leaves that change color and fall.

### How It Works

1. **Content Detection**: The theme scans the page to find content boundaries
2. **Tree Spawning**: Trees grow from the bottom of the screen, reaching upward
3. **Growth Algorithm**: Branches extend using recursive patterns with natural curves
4. **Collision Avoidance**: Trees grow around content, never through it
5. **Autumn Effect**: Leaves gradually change color and fall with realistic physics
6. **Renewal**: On page change, trees fade and new growth begins

### Features

- **Procedural Generation**: Each tree is unique, with randomized branching
- **Falling Leaves**: Physics-based leaf animation with color transitions
- **Height Map Collision**: Efficient O(1) leaf pile collision detection
- **Sky Gradient**: Calming blue-to-white background
- **Performance Optimized**: 30fps target with requestAnimationFrame

## Customization

The theme can be customized by modifying parameters in `background.js`:

- Tree count and density
- Growth speed and branching angles
- Leaf colors and fall timing
- Sky gradient colors
- Animation timing

All styling is contained in `theme.css` for easy modification.
