import "./style.css";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { RGBShiftShader } from "three/examples/jsm/shaders/RGBShiftShader.js";
import gsap from "gsap";
import LocomotiveScroll from "locomotive-scroll";

// Locomotive Scroll
const scroll = new LocomotiveScroll();

// scene
const scene = new THREE.Scene();
// camera
const camera = new THREE.PerspectiveCamera(
  40,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.z = 3.5;

// renderer code
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector("#canvas"),
  antialias: true,
  alpha: true,
});

// render
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.outputEncoding = THREE.sRGBEncoding;

// Adding the pmremGenerator
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

let model;

// Loading the env
new RGBELoader().load(
  "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/pond_bridge_night_2k.hdr",
  function (texture) {
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;
    scene.environment = envMap;
    // scene.background = envMap;
    texture.dispose();
    pmremGenerator.dispose();

    const loader = new GLTFLoader();
    loader.load(
      "./DamagedHelmet.gltf",
      (gltf) => {
        model = gltf.scene;
        scene.add(gltf.scene);
      },
      undefined,
      (error) => {
        console.error(
          "An error occurred while loading the GLTF model: ",
          error
        );
      }
    );
  }
);

// Post-processing setup
const composer = new EffectComposer(renderer);

// Render pass
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// RGB shift pass
const rgbShiftPass = new ShaderPass(RGBShiftShader);
rgbShiftPass.uniforms["amount"].value = 0.0005; // Adjust the shift intensity
composer.addPass(rgbShiftPass);

// Resize handling
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

window.addEventListener("mousemove", (e) => {
  if (model) {
    const rotationX = (e.clientX / window.innerWidth - 0.5) * (Math.PI * 0.12);
    const rotationY = (e.clientY / window.innerHeight - 0.5) * (Math.PI * 0.12);
    gsap.to(model.rotation, {
      y: rotationX,
      x: rotationY,
      duration: 1,
      ease: "power2.out"
    })
  }
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

// Animating the scene
function animate() {
  window.requestAnimationFrame(animate);
  // Render the scene with post-processing
  composer.render();
}

animate();
