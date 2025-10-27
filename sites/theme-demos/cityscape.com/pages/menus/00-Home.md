## Cityscape Theme

Welcome to the Cityscape theme for AjaxCMS. This theme transforms your site into a dynamic metropolitan experience with multi-layered parallax scrolling cityscapes. Watch as building silhouettes, blurred foregrounds, and mountain ranges scroll at different speeds, creating stunning depth and urban atmosphere.

### About This Theme

The Cityscape theme brings sophisticated urban aesthetics to your AjaxCMS site with a parallax-scrolling cityscape animation featuring seven distinct layers. From blurred foreground buildings to distant mountain silhouettes, each layer scrolls at a different speed creating authentic depth perception. The animation responds to cursor position, raising and spreading the layers as you move your mouse, making the cityscape feel alive and interactive.

Built with a modern architectural color scheme featuring deep slate backgrounds, amber accent lighting reminiscent of city windows at night, and clean urban typography, the Cityscape theme delivers a professional metropolitan aesthetic. Urbanist font provides bold architectural headings while Inter delivers crisp, modern body text perfect for urban design.

### Key Features

The Cityscape theme creates an immersive urban experience:

- **Multi-Layer Parallax Scrolling**: Seven layers including blurred city buildings, sharp silhouettes, and mountain backgrounds scroll independently
- **Depth-Based Speed**: Foreground layers scroll faster than distant layers, creating realistic perspective and depth
- **Interactive Parallax**: Mouse movement raises and spreads the city layers, creating dynamic 3D-like depth effects
- **Continuous Animation**: Layers scroll horizontally at -2px per frame, creating perpetual urban motion
- **Urban Typography**: Urbanist (architectural, bold) for headings and Inter (clean, modern) for body text
- **Amber City Lights**: Golden amber accents (#f59e0b) evoke glowing city windows and street lamps at dusk
- **Glassmorphism Containers**: Semi-transparent panels with backdrop blur float above the cityscape
- **Responsive Depth**: Animation adapts to window size, maintaining proper proportions and depth

### Design Elements

Every element embraces the urban architectural aesthetic. Content containers feature dark slate backgrounds with amber-bordered glassmorphism, creating the appearance of windows overlooking the city. Headings display vertical amber accent bars on the left, mimicking architectural column details. Buttons use gradient amber-to-orange fills with expanding hover effects.

The color palette centers on deep slate (#1a1f2e) and charcoal (#2d3748) backgrounds with vibrant amber (#f59e0b) for accents and warm orange (#ff6b35) for highlights. Light gray text (#e2e8f0) provides excellent readability against dark backgrounds. The navbar features a subtle pulsing glow animation, evoking the rhythmic lighting of urban nights.

### Technical Excellence

Built for Bootstrap 5 compatibility, the Cityscape theme uses jQuery for smooth layer manipulation with requestAnimationFrame for 60fps animation. Each layer is an absolutely positioned div with repeated background images that scroll via CSS background-position updates. Layer heights and bottom positions calculate dynamically based on screen size and cursor position.

Typography leverages Google Fonts with Urbanist providing architectural sans-serif headings (weights 400-800) and Inter delivering modern body text (weights 400-600). The theme includes mathematical depth calculations for layer spreading, cursor-responsive positioning, and automatic window resize handling.

### Perfect For

This theme excels for: architecture firms, urban planning agencies, real estate companies, city guides, metropolitan blogs, construction companies, infrastructure projects, municipal websites, urban development portfolios, smart city initiatives, or any project requiring sophisticated urban aesthetics.

The parallax cityscape creates immediate urban atmosphere while remaining professional and clean. It's particularly effective for showcasing buildings, developments, city services, or urban-focused content. The interactive depth effect engages visitors without overwhelming the content.

### Live Animation

The background continuously scrolls seven city and mountain layers from right to left. Each layer moves at a speed inversely proportional to its depth (front layers faster, back layers slower). As you move your cursor vertically, the city raises up and the layers spread apart, revealing more sky and creating dramatic depth. The mathematical spread calculation uses square roots to create natural-looking perspective as layers recede into the distance.

### Layer Composition

From front to back, the animation consists of:
1. Blurred close-up city buildings (fastest scroll)
2. Blurred mid-distance city
3. Sharp detailed city buildings
4. Sharp secondary city layer
5. Repeated sharp city buildings
6. Mountain silhouettes
7. Distant mountain range (slowest scroll, offset -50px down)

Each layer repeats horizontally creating an endless urban landscape that never runs out of buildings to scroll past.
