# About the Growth Theme

## Technical Details

The Growth theme is built using HTML5 Canvas and JavaScript to create real-time procedural plant animations. Each plant grows according to algorithmic rules that simulate natural branching patterns.

### How It Works

1. **Content Detection**: The theme scans the page to find content boundaries
2. **Plant Spawning**: Plants are strategically placed around and beneath content
3. **Growth Algorithm**: Branches extend using recursive growth patterns with natural curves
4. **Collision Detection**: Plants avoid growing through content areas
5. **Transition Effect**: On page change, plants crumble into particles and new growth begins

### Features

- **Procedural Generation**: Each plant is unique, generated with randomized parameters
- **Branching Logic**: Trees and vines fork naturally using recursive algorithms
- **Particle System**: Smooth crumble effect using physics simulation
- **Adaptive Layout**: Responds to window resizes and content changes
- **Performance Optimized**: Efficient rendering using requestAnimationFrame

## Customization

The theme can be customized by modifying parameters in `background.js`:

- Growth speed
- Branch thickness
- Color palette
- Plant density
- Animation timing

All styling is contained in `theme.css` for easy modification.
