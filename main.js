// Initialize Three.js scene, camera, and renderer
const scene = new THREE.Scene();

// Perspective camera with 75° FOV, aspect ratio matching window, and depth range 0.1-3000 units
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 3000);
camera.position.z = 500; // Position camera 500 units back from origin

// Track mouse position in screen coordinates
let mouseX = 0;
let mouseY = 0;

// Create WebGL renderer with antialiasing
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight); // Full window size
renderer.shadowMap.enabled = true; // Enable shadow rendering
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Use soft shadows
renderer.setClearColor(0x111111); // Dark gray background
document.body.appendChild(renderer.domElement); // Add canvas to DOM

// Raycaster for mouse interaction with 3D objects
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(); // Stores normalized mouse coordinates (-1 to 1)
const tooltip = document.getElementById("tooltip"); // Reference to tooltip element

// Update mouse position when moved
window.addEventListener("mousemove", (event) => {
  // Convert mouse coordinates to normalized device coordinates (-1 to 1)
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
  // Store actual pixel coordinates for tooltip positioning
  mouseX = event.clientX;
  mouseY = event.clientY;
});

// ========== LIGHTING SYSTEM ========== //
// Ambient light provides base illumination
const ambientLight = new THREE.AmbientLight(0x404040, 0.1);
scene.add(ambientLight);

// Main sun light source (yellow point light)
const sunLight = new THREE.PointLight(0xFDB813, 2, 2000, 1);
sunLight.position.set(0, 0, 0); // Center of scene
sunLight.castShadow = true; // Enable shadows
// Shadow quality settings
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 1;
sunLight.shadow.camera.far = 2000;
scene.add(sunLight);

// ========== STARFIELD ========== //
// Create random star positions in 3D space
function createStars() {
  const starsGeometry = new THREE.BufferGeometry();
  const starCount = 5000; // Number of stars
  const positions = new Float32Array(starCount * 3); // Each star has x,y,z coordinates

  // Generate random positions within 2000 unit cube
  for (let i = 0; i < starCount; i++) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * 2000;
    positions[i3 + 1] = (Math.random() - 0.5) * 2000;
    positions[i3 + 2] = (Math.random() - 0.5) * 2000;
  }

  // Set positions attribute and create points mesh
  starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const starsMaterial = new THREE.PointsMaterial({ color: 0xFFFFFF, size: 1 });
  const stars = new THREE.Points(starsGeometry, starsMaterial);
  scene.add(stars);
}
createStars(); // Call function to generate stars

// ========== SUN ========== //
// Main sun sphere
const sunGeometry = new THREE.SphereGeometry(30, 64, 64); // High-res sphere
const sunMaterial = new THREE.MeshBasicMaterial({
  color: 0xFDB813, // Yellow-orange color
  transparent: true,
  opacity: 0.9 // Slightly transparent
});
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// Sun glow effect (larger transparent sphere)
const sunGlowGeometry = new THREE.SphereGeometry(35, 32, 32);
const sunGlowMaterial = new THREE.MeshBasicMaterial({
  color: 0xFDB813,
  transparent: true,
  opacity: 0.3 // More transparent than main sun
});
const sunGlow = new THREE.Mesh(sunGlowGeometry, sunGlowMaterial);
scene.add(sunGlow);

// ========== PLANET SYSTEM ========== //
const planets = []; // Array to store all planet objects

/**
 * Creates a planet with specified parameters
 * @param {string} name - Planet name
 * @param {number} radius - Planet size
 * @param {number} color - Hex color value
 * @param {number} distance - Orbital distance from sun
 * @param {number} startAngle - Initial orbital position (radians)
 * @param {number} speed - Orbital speed
 */
function createPlanet(name, radius, color, distance, startAngle, speed) {
  // Planet material with specular highlights
  const material = new THREE.MeshPhongMaterial({
    color,
    shininess: 30, // Surface shininess
    specular: new THREE.Color(0x222222), // Reflection color
    emissive: new THREE.Color(0x000000), // Self-illumination
    emissiveIntensity: 0 // No emission by default
  });

  // Create sphere geometry and mesh
  const geometry = new THREE.SphereGeometry(radius, 32, 32);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true; // Can cast shadows
  mesh.receiveShadow = true; // Can receive shadows
  scene.add(mesh);

  // Special case for Saturn (add rings)
  if (name === "Saturn") {
    const ringGeometry = new THREE.RingGeometry(radius * 1.5, radius * 2.5, 32);
    const ringMaterial = new THREE.MeshPhongMaterial({
      color: 0xC0C0C0, // Silver-gray rings
      side: THREE.DoubleSide, // Visible from both sides
      transparent: true,
      opacity: 0.8
    });
    const rings = new THREE.Mesh(ringGeometry, ringMaterial);
    rings.rotation.x = Math.PI / 2; // Rotate to be horizontal
    rings.castShadow = true;
    rings.receiveShadow = true;
    mesh.add(rings); // Attach rings to Saturn
  }

  // Create control UI element for this planet
  const wrapper = document.createElement("div");
  wrapper.className = "planet-control";
  wrapper.innerHTML = `
    <label>${name}:</label>
    <input type='range' min="0" max="0.05" step="0.001" value="${speed}" id="${name}-slider">
  `;
  document.getElementById('controls').appendChild(wrapper);

  // Store planet data in object
  const planet = { name, mesh, angle: startAngle, speed, distance };
  planets.push(planet);

  // Add event listener to speed slider
  document.getElementById(`${name}-slider`).addEventListener("input", (e) => {
    planet.speed = parseFloat(e.target.value); // Update speed when slider changes
  });
}

// Create all planets with their orbital parameters
createPlanet("Mercury", 3, 0x7F7F7F, 80, 0, 0.02);
createPlanet("Venus", 5, 0xE6E6FA, 120, 1, 0.015);
createPlanet("Earth", 5.5, 0x1E90FF, 160, 2, 0.012);
createPlanet("Mars", 4, 0xE27B58, 200, 3, 0.01);
createPlanet("Jupiter", 15, 0xD2B48C, 280, 4, 0.007);
createPlanet("Saturn", 13, 0xF4C430, 360, 5, 0.005);
createPlanet("Uranus", 10, 0xAFEEEE, 440, 6, 0.003);
createPlanet("Neptune", 9.5, 0x4169E1, 520, 7, 0.002);
createPlanet("Pluto", 2, 0xA67B5B, 580, 8, 0.001);

// ========== INTERACTION CONTROLS ========== //
let manualPause = false; // Tracks pause state from button
let hoverPause = false; // Tracks pause state from hover

// Toggle pause/resume with button
document.getElementById("toggle-btn").addEventListener("click", () => {
  manualPause = !manualPause;
  document.getElementById("toggle-btn").textContent = manualPause ? "Resume" : "Pause";
});

// ========== THEME TOGGLE ========== //
let darkMode = true; // Default to dark mode

document.getElementById("theme-toggle").addEventListener("click", () => {
  darkMode = !darkMode;
  // Update renderer background color
  renderer.setClearColor(darkMode ? 0x111111 : 0xeeeeee);
  // Update page background
  document.body.style.background = darkMode ? "#000" : "#fff";
  // Update controls panel theme class
  document.getElementById("controls").className = darkMode ? "dark-mode" : "light-mode";

  // Update button colors
  const textColor = darkMode ? "white" : "black";
  const bgColor = darkMode ? "#111" : "#ddd";

  document.querySelectorAll("button").forEach(btn => {
    btn.style.background = bgColor;
    btn.style.color = textColor;
  });

  // Update tooltip colors
  tooltip.style.color = textColor;
  tooltip.style.background = darkMode ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.7)";
});

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix(); // Update camera
  renderer.setSize(window.innerWidth, window.innerHeight); // Update renderer
});

// ========== ANIMATION LOOP ========== //
function animate() {
  requestAnimationFrame(animate); // Continuously loop

  // Update raycaster with current mouse position
  raycaster.setFromCamera(mouse, camera);
  // Check for planet intersections
  const intersects = raycaster.intersectObjects(planets.map(p => p.mesh));

  if (intersects.length > 0) {
    // Mouse is over a planet
    const intersected = intersects[0].object;
    const planet = planets.find(p => p.mesh === intersected);
    if (planet) {
      // Update tooltip position and content
      tooltip.innerText = planet.name;
      tooltip.style.left = `${mouseX + 10}px`;
      tooltip.style.top = `${mouseY + 10}px`;
      tooltip.style.display = "block";
      hoverPause = true; // Pause on hover
    }
  } else {
    // Mouse not over any planet
    tooltip.style.display = "none";
    hoverPause = false; // Resume when not hovering
  }

  // Only animate if not manually paused and not hovering over planet
  if (!manualPause && !hoverPause) {
    // Update planet positions
    planets.forEach(planet => {
      planet.angle += planet.speed; // Increment orbital angle
      // Calculate new position using trigonometry
      planet.mesh.position.x = planet.distance * Math.cos(planet.angle);
      planet.mesh.position.z = planet.distance * Math.sin(planet.angle);

      // Special rotation for Saturn's rings
      if (planet.name === "Saturn") {
        planet.mesh.children[0].rotation.y += 0.005;
      }
    });

    // Create pulsing effect for sun
    const pulse = Math.sin(Date.now() * 0.001) * 0.1 + 1;
    sun.scale.set(pulse, pulse, pulse);
    sunGlow.scale.set(pulse * 1.1, pulse * 1.1, pulse * 1.1);
  }

  // Render the scene
  renderer.render(scene, camera);
}

// Start animation loop
animate();