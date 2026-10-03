import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Octree } from 'three/addons/math/Octree.js';
import { Capsule } from 'three/addons/math/Capsule.js';

const scene = new THREE.Scene();
const loadingScreen = document.getElementById("loading-screen");
const canvas = document.getElementById("experience-canvas");
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

//physics stuff
const GRAVITY = 30;
const CAPSULE_RADIUS = 0.35;
const CAPSULE_HEIGHT = 1;
const JUMP_HEIGHT = 3.5;
const MOVE_SPEED = 5;


let character ={
  instance: null,
  isMoving: false,
  spawnPosition: new THREE.Vector3()
}

let targetRotation = -Math.PI/2;
let nearbyObject = null;

const colliderOctree = new Octree();
const playerCollider = new Capsule(
  new THREE.Vector3(0, CAPSULE_RADIUS, 0),
  new THREE.Vector3(0, CAPSULE_HEIGHT, 0),
  CAPSULE_RADIUS
);

let playerVelocity = new THREE.Vector3();
let playerOnFloor = false;

const renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true});
renderer.setSize( sizes.width, sizes.height);
renderer.setPixelRatio( Math.min(window.devicePixelRatio, 2) )
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.5

const modalContent = {
  "Plane":{
    title: "BOOK ME!",
    content: "Let’s Work Together! Whether it’s a campaign, editorial, commercial, runway, or creative project, I’m available for modelling opportunities that align with the vision of the brand and production. My experience spans fashion, beauty, lifestyle, and creative productions, and I bring professionalism, versatility, and a strong presence to every project.  Interested in working together? View my rate card for my current modelling rates, and feel free to get in touch.",
    link: "rate-card.html"
  },
  "arms":{
    title: "HI THERE <3",
    content: "Engr. Olua Ginikachi Sandra here. I'm a model, a 3D artist, and a front-end developer. Your Mission is to <FIND THE BILLBOARD!!> Toodles <3"

  },
  "Text":{
    title: "BOOK ME",
    content: "Click the billboard to view my rate card and get in touch for bookings and collaborations."
  }
}

const modalTitle = document.querySelector(".modal-title");
const modalContentText = document.querySelector(".modal-project-description");
const modalExitButton = document.querySelector(".modal-exit-button");
const modalLink = document.querySelector(".modal-visit-button")
const modal = document.querySelector(".modal");
const interactionPrompt = document.querySelector("#interaction-prompt");
const characterPrompt = document.querySelector("#character-prompt");


function showModal(id){
  const content = modalContent[id];
  if(content){

    modalTitle.textContent = content.title;
    modalContentText.textContent = content.content;
    if(content.link){
      modalLink.href = content.link
      modalLink.classList.remove('hidden')
    }else{
      modalLink.classList.add('hidden')
    }
    modal.classList.remove("hidden");
  }
}


function openModal(){
  modal.classList.toggle("hidden");
}



const intersectObjects = [];
const intersectObjectNames = [
  "Plane060",
  "Plane060_1",
  "Cube019",
  "Cube019_1",
  "Cube019_2",
  "Cube019_3",
  "Cube019_4",
  "Cube019_5",
  "Cube019_6",
  "Text_1",
  "Text_2",
];

const loader = new GLTFLoader();

loader.load( 
  './Portfolioo.glb', 

  function (glb) {

    glb.scene.traverse((child)=>{
      if(intersectObjectNames.includes(child.name)){
        intersectObjects.push(child)
      }

      if(child.isMesh){
        child.castShadow = true;
        child.receiveShadow = true;
        child.material.metalness = 0.3;

        if(child.material.name === "rocks"){
          child.material.color.setRGB(0.2, 0.2, 0.2);
        }
      }

      if(child.name === "Cube019"){
        character.spawnPosition.copy(child.parent.position)
        character.instance = child.parent || child

        playerCollider.start
          .copy(child.parent.position)
          .add(new THREE.Vector3(0, CAPSULE_RADIUS, 0))

        playerCollider.end
          .copy(child.parent.position)
          .add(new THREE.Vector3(0, CAPSULE_HEIGHT, 0))
      }

      if(child.name === "Collider"){
        colliderOctree.fromGraphNode(child)
        child.visible = false
      }
    });

    scene.add(glb.scene);

    loadingScreen.classList.add("fade-out");

    setTimeout(() => {
      loadingScreen.remove();
    }, 1500);

  }, 

  undefined, 

  function (error) {
    console.error("Failed to load Portfolioo.glb:", error);
  }
);

//Proximity Detectection
const interactionDistance = 3;

function checkInteraction(){

  if(!character.instance) return;

  const plane = scene.getObjectByName("Plane");
  const text = scene.getObjectByName("Text");

  nearbyObject = null;

  if(plane){
    const distanceToPlane = character.instance.position.distanceTo(
      plane.position
    );

    if(distanceToPlane < interactionDistance){
      nearbyObject = "Plane";
    }
  }

  if(text){
    const distanceToText = character.instance.position.distanceTo(
      text.position
    );

    if(distanceToText < interactionDistance){
      nearbyObject = "Text";
    }
  }

  if(nearbyObject){
    interactionPrompt.classList.remove("hidden");
  }else{
    interactionPrompt.classList.add("hidden");
  }
}

const sun = new THREE.DirectionalLight( 0xFFFFFF );
sun.castShadow = true;
sun.position.set(75,100,0)
sun.target.position.set(50, 0, 0)
sun.shadow.mapSize.width = 4096
sun.shadow.mapSize.height = 4096
sun.shadow.camera.left = -100
sun.shadow.camera.right = 100
sun.shadow.camera.top = -100
sun.shadow.camera.bottom = 100
sun.shadow.normalBias = 0.2
scene.add( sun );


const light = new THREE.AmbientLight( 0x404040, 3 ); // soft white light
scene.add( light );


const camera = new THREE.OrthographicCamera(
  -10,
  7,
  10,
  -7,
  0.1,
  1000
);

const cameraOffset = new THREE.Vector3(10, 8, -10);

camera.position.copy(cameraOffset);
camera.lookAt(0, 0, 0);

camera.zoom = 1.2;
camera.updateProjectionMatrix();


function onResize(){

  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  const aspect = sizes.width / sizes.height;

  camera.left = -10 * aspect;
  camera.right = 10 * aspect;
  camera.top = 10;
  camera.bottom = -10;

  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
  );
}

function onPointerMove(event){
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;
}

function onPointer(event){
  if (event.target.closest(".mobile-button")) {
  return;
}

  // If modal is open and click is outside it, close it
  if (
    !modal.classList.contains("hidden") &&
    !modal.contains(event.target)
  ) {
    modal.classList.add("hidden");
    return;
  }

  // Don't let clicks inside the modal affect the scene
  if (modal.contains(event.target)) {
    return;
  }

  // Get the exact position that was clicked
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Cast a ray from the camera through that exact point
  raycaster.setFromCamera(pointer, camera);

  const intersects = raycaster.intersectObjects(intersectObjects);

  // Nothing clickable was actually clicked
  if (intersects.length === 0) {
    return;
  }

  // Something clickable was clicked
  const clickedObject = intersects[0].object;

let clickedName = clickedObject.name;

if (!modalContent[clickedName] && clickedObject.parent) {
  clickedName = clickedObject.parent.name;
}

showModal(clickedName);
}

function respawnCharacter(){
  character.instance.position.copy(character.spawnPosition)

  playerCollider.start
    .copy(character.spawnPosition)
    .add(new THREE.Vector3(0, CAPSULE_RADIUS, 0))
  playerCollider.end
    .copy(character.spawnPosition)
    .add(new THREE.Vector3(0, CAPSULE_HEIGHT, 0))

    playerVelocity.set(0,0,0);
    character.isMoving = false;
}


function playerCollisions(){
  const result = colliderOctree.capsuleIntersect(playerCollider)
  playerOnFloor = false;

  if (result){
    playerOnFloor = result.normal.y > 0
    playerCollider.translate(result.normal.multiplyScalar(result.depth))

    if(playerOnFloor){
      character.isMoving = false;
      playerVelocity.x = 0
      playerVelocity.z = 0
    }
  }

}

function updatePlayer(){
  if(!character.instance) return;
  
  if(character.instance.position.y < -20){
    respawnCharacter()
    return
  }

  if(!playerOnFloor){
    playerVelocity.y -= GRAVITY * 0.035;

  }
  playerCollider.translate(playerVelocity.clone().multiplyScalar(0.035))

  playerCollisions()

  character.instance.position.copy(playerCollider.start);
  character.instance.position.y -= CAPSULE_RADIUS;

  character.instance.rotation.y =THREE.MathUtils.lerp(
    character.instance.rotation.y, 
    targetRotation, 
    0.4)
}

function getShortestRotation(targetRotation) {
  const currentRotation = character.instance.rotation.y;

  const rotationDifference = targetRotation - currentRotation;

  if (rotationDifference > Math.PI) {
    targetRotation -= Math.PI * 2;
  }

  if (rotationDifference < -Math.PI) {
    targetRotation += Math.PI * 2;
  }

  return targetRotation;
}

function moveCharacter(direction){
  if(!character.instance) return;
  if(character.isMoving) return;

  switch(direction){

    case "up":
      playerVelocity.z += MOVE_SPEED;
      targetRotation = -Math.PI / 2;
      break;

    case "down":
      playerVelocity.z -= MOVE_SPEED;
      targetRotation = Math.PI / 2;
      break;

    case "left":
      playerVelocity.x += MOVE_SPEED;
      targetRotation = -Math.PI;
      break;

    case "right":
      playerVelocity.x -= MOVE_SPEED;
      targetRotation = 0;
      break;

    default:
      return;
  }

  targetRotation = getShortestRotation(targetRotation);

  playerVelocity.y = JUMP_HEIGHT;
  character.isMoving = true;
}

function onKeyDown(event){

  if(event.key.toLowerCase() === "e" && nearbyObject){
    showModal(nearbyObject);
    return;
  }

  if(event.key.toLowerCase() === "r"){
    respawnCharacter();
    return;
  }

  switch(event.key.toLowerCase()){

    case "w":
    case "arrowup":
      moveCharacter("up");
      break;

    case "s":
    case "arrowdown":
      moveCharacter("down");
      break;

    case "a":
    case "arrowleft":
      moveCharacter("left");
      break;

    case "d":
    case "arrowright":
      moveCharacter("right");
      break;

    default:
      return;
  }
}

const mobileButtons = document.querySelectorAll(".mobile-button");

mobileButtons.forEach((button) => {

  button.addEventListener("pointerdown", (event) => {

    event.preventDefault();

    const direction = button.dataset.direction;

    moveCharacter(direction);
  });

});
modalExitButton.addEventListener("click", openModal);
window.addEventListener('resize', onResize);
window.addEventListener('pointerup', onPointer);
window.addEventListener('pointermove', onPointerMove);
window.addEventListener('keydown', onKeyDown)

function animate() {

  updatePlayer()
  checkInteraction()

  if(character.instance){

    const targetCameraPosition = new THREE.Vector3(
      character.instance.position.x + cameraOffset.x,
      character.instance.position.y + cameraOffset.y,
      character.instance.position.z + cameraOffset.z
    );

    camera.position.copy(targetCameraPosition);

    camera.lookAt(
      character.instance.position.x,
      character.instance.position.y,
      character.instance.position.z
    );
  }

  raycaster.setFromCamera(pointer, camera);

  const intersects = raycaster.intersectObjects(intersectObjects);

  if(intersects.length > 0){
    document.body.style.cursor = "pointer";
  } else {
    document.body.style.cursor = "default";
  }


  renderer.render( scene, camera );
  if(character.instance){

    const characterPosition = character.instance.position.clone();

    characterPosition.y += 2;

    characterPosition.project(camera);

    const x = (characterPosition.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-characterPosition.y * 0.5 + 0.5) * window.innerHeight;

    characterPrompt.style.left = `${x}px`;
    characterPrompt.style.top = `${y}px`;
  }
}

renderer.setAnimationLoop( animate );

// Hide character prompt after 3 seconds
setTimeout(() => {
  characterPrompt.classList.add("hidden");
}, 4000);