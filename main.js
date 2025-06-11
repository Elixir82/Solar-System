const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 3000);
camera.position.z = 500;
let mouseX = 0;
let mouseY = 0;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.setClearColor(0x111111);
document.body.appendChild(renderer.domElement);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const tooltip = document.getElementById("tooltip");

window.addEventListener("mousemove", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
  mouseX = event.clientX;
  mouseY = event.clientY;
});

// ========== ENHANCEMENTS ========== //

// 1. LIGHTING SYSTEM
const ambientLight = new THREE.AmbientLight(0x333333);
scene.add(ambientLight);

const sunLight = new THREE.PointLight(0xFDB813, 10, 2000, 2);
sunLight.position.set(0, 0, 0);
sunLight.castShadow = true;
scene.add(sunLight);

// Stars
function createStars() {
  const starsGeometry = new THREE.BufferGeometry();
  const starCount = 5000;
  const positions = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount; i++) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * 2000;
    positions[i3 + 1] = (Math.random() - 0.5) * 2000;
    positions[i3 + 2] = (Math.random() - 0.5) * 2000;
  }

  starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const starsMaterial = new THREE.PointsMaterial({ color: 0xFFFFFF, size: 1 });
  const stars = new THREE.Points(starsGeometry, starsMaterial);
  scene.add(stars);
}
createStars();

// The SUN
const sunGeometry = new THREE.SphereGeometry(30, 64, 64);
const sunMaterial = new THREE.MeshBasicMaterial({
  color: 0xFDB813,
  transparent: true,
  opacity: 0.9
});
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// Sun Glow
const sunGlowGeometry = new THREE.SphereGeometry(35, 32, 32);
const sunGlowMaterial = new THREE.MeshBasicMaterial({
  color: 0xFDB813,
  transparent: true,
  opacity: 0.3
});
const sunGlow = new THREE.Mesh(sunGlowGeometry, sunGlowMaterial);
scene.add(sunGlow);

// ========== PLANET SYSTEM ========== //
const planets = [];

function createPlanet(name, radius, color, distance, startAngle, speed) {
  const material = new THREE.MeshPhongMaterial({
    color,
    shininess: 50,
    specular: new THREE.Color(0x333333),
    emissive: color,
    emissiveIntensity: 0.2
  });

  const geometry = new THREE.SphereGeometry(radius, 32, 32);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  if (name === "Saturn") {
    const ringGeometry = new THREE.RingGeometry(radius * 1.5, radius * 2.5, 32);
    const ringMaterial = new THREE.MeshPhongMaterial({
      color: 0xC0C0C0,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    const rings = new THREE.Mesh(ringGeometry, ringMaterial);
    rings.rotation.x = Math.PI / 2;
    mesh.add(rings);
  }

  const wrapper = document.createElement("div");
  wrapper.className = "planet-control";
  wrapper.innerHTML = `
    <label>${name}:</label>
    <input type='range' min="0" max="0.05" step="0.001" value="${speed}" id="${name}-slider">
  `;
  document.getElementById('controls').appendChild(wrapper);

  const planet = { name, mesh, angle: startAngle, speed, distance };
  planets.push(planet);

  document.getElementById(`${name}-slider`).addEventListener("input", (e) => {
    planet.speed = parseFloat(e.target.value);
  });
}

// Planets
createPlanet("Mercury", 3, 0x7F7F7F, 80, 0, 0.02);
createPlanet("Venus", 5, 0xE6E6FA, 120, 1, 0.015);
createPlanet("Earth", 5.5, 0x1E90FF, 160, 2, 0.012);
createPlanet("Mars", 4, 0xE27B58, 200, 3, 0.01);
createPlanet("Jupiter", 15, 0xD2B48C, 280, 4, 0.007);
createPlanet("Saturn", 13, 0xF4C430, 360, 5, 0.005);
createPlanet("Uranus", 10, 0xAFEEEE, 440, 6, 0.003);
createPlanet("Neptune", 9.5, 0x4169E1, 520, 7, 0.002);
createPlanet("Pluto", 2, 0xA67B5B, 580, 8, 0.001);

// Pause state
let manualPause = false;
let hoverPause = false;

document.getElementById("toggle-btn").addEventListener("click", () => {
  manualPause = !manualPause;
  document.getElementById("toggle-btn").textContent = manualPause ? "Resume" : "Pause";
});

let darkMode = true;
document.getElementById("theme-toggle").addEventListener("click", () => {
  darkMode = !darkMode;
  renderer.setClearColor(darkMode ? 0x111111 : 0xeeeeee);
  document.body.style.background = darkMode ? "#000" : "#fff";
  document.getElementById("controls").className = darkMode ? "dark-mode" : "light-mode";

  const textColor = darkMode ? "white" : "black";
  const bgColor = darkMode ? "#111" : "#ddd";

  document.querySelectorAll("button").forEach(btn => {
    btn.style.background = bgColor;
    btn.style.color = textColor;
  });

  tooltip.style.color = textColor;
  tooltip.style.background = darkMode ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.7)";
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
  requestAnimationFrame(animate);

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planets.map(p => p.mesh));

  if (intersects.length > 0) {
    const intersected = intersects[0].object;
    const planet = planets.find(p => p.mesh === intersected);
    if (planet) {
      tooltip.innerText = planet.name;
      tooltip.style.left = `${mouseX + 10}px`;
      tooltip.style.top = `${mouseY + 10}px`;
      tooltip.style.display = "block";
      hoverPause = true;
    }
  } else {
    tooltip.style.display = "none";
    hoverPause = false;
  }

  if (!manualPause && !hoverPause) {
    planets.forEach(planet => {
      planet.angle += planet.speed;
      planet.mesh.position.x = planet.distance * Math.cos(planet.angle);
      planet.mesh.position.z = planet.distance * Math.sin(planet.angle);

      if (planet.name === "Saturn") {
        planet.mesh.children[0].rotation.y += 0.005;
      }
    });

    const pulse = Math.sin(Date.now() * 0.001) * 0.1 + 1;
    sun.scale.set(pulse, pulse, pulse);
    sunGlow.scale.set(pulse * 1.1, pulse * 1.1, pulse * 1.1);
  }

  renderer.render(scene, camera);
}

animate();