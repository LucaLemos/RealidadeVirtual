import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';

let container;
let camera, scene, renderer;
let controller1, controller2;
let controllerGrip1, controllerGrip2;

let raycaster;

const intersected = [];
const tempMatrix = new THREE.Matrix4();

let group;

init();
animate();

function init() {
  container = document.getElementById('container');

  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0xA0D2FF );

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

  const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
  light.position.set(0.5, 1, 0.25);
  scene.add(light);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  container.appendChild(renderer.domElement);

  document.body.appendChild(VRButton.createButton(renderer));


  // Create the floor
  const floorGeometry = new THREE.PlaneGeometry(10, 10);
  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x8080ff });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  // Create the walls
  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xffaaaa });
  const wallHeight = 4;

  const wall1 = new THREE.Mesh(new THREE.PlaneGeometry(10, wallHeight), wallMaterial);
  wall1.position.z = -5;
  wall1.position.y = wallHeight / 2;
  scene.add(wall1);

  const wall2 = new THREE.Mesh(new THREE.PlaneGeometry(10, wallHeight), wallMaterial);
  wall2.position.z = 5;
  wall2.position.y = wallHeight / 2;
  wall2.rotation.y = Math.PI;
  scene.add(wall2);

  const wall3 = new THREE.Mesh(new THREE.PlaneGeometry(10, wallHeight), wallMaterial);
  wall3.position.z = 0;
  wall3.position.y = wallHeight / 2;
  wall3.position.x = -5;
  wall3.rotation.y = Math.PI / 2;
  scene.add(wall3);

  const wall4 = new THREE.Mesh(new THREE.PlaneGeometry(10, wallHeight), wallMaterial);
  wall4.position.z = 0;
  wall4.position.y = wallHeight / 2;
  wall4.position.x = 5;
  wall4.rotation.y = -Math.PI / 2;
  scene.add(wall4);

  group = new THREE.Group();
  scene.add( group );

  // Add a cube to the scene
  const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
  const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
  const cube = new THREE.Mesh(geometry, material);
  cube.position.set(0, 0.25, -1); // Adjust the cube position as needed
  
  group.add( cube );


  // Create the first controller and its model
  controller1 = renderer.xr.getController(0);
  controller1.addEventListener( 'selectstart', onSelectStart );
	controller1.addEventListener( 'selectend', onSelectEnd );
  scene.add(controller1);

  // Create the second controller and its model
  controller2 = renderer.xr.getController(1);
  controller2.addEventListener( 'selectstart', onSelectStart );
	controller2.addEventListener( 'selectend', onSelectEnd );
  scene.add(controller2);

  const controllerModel = new XRControllerModelFactory();

  controllerGrip1 = renderer.xr.getControllerGrip( 0 );
  controllerGrip1.add( controllerModel.createControllerModel( controllerGrip1 ) );
	scene.add( controllerGrip1 );

  controllerGrip2 = renderer.xr.getControllerGrip( 1 );
	controllerGrip2.add( controllerModel.createControllerModel( controllerGrip2 ) );
	scene.add( controllerGrip2 );

  const geometryLine = new THREE.BufferGeometry().setFromPoints( [ new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, -1 ) ]);
  const line = new THREE.Line( geometryLine)
  line.name = 'line';
  line.scale.z = 5;

  controller1.add( line.clone() );
  controller2.add( line.clone() );

  raycaster = new THREE.Raycaster();

  window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onSelectStart( event ) {
  const controller = event.target;
  const intersections = getIntersections( controller );

  if( intersections.length > 0 ) {
    const intersection = intersections[ 0 ];

    const object = intersection.object;
    object.material.emissive.b = 1;
		controller.attach( object );

    controller.userData.selected = object;
  }

  controller.userData.targetRayMode = event.data.targetRayMode;
}

function onSelectEnd( event ) {

  const controller = event.target;

  if ( controller.userData.selected !== undefined ) {

    const object = controller.userData.selected;
    object.material.emissive.b = 0;
    group.attach( object );

    controller.userData.selected = undefined;

  }

}

function getIntersections( controller ) {
  controller.updateMatrixWorld();

  tempMatrix.identity().extractRotation( controller.matrixWorld );

  raycaster.ray.origin.setFromMatrixPosition( controller.matrixWorld );
	raycaster.ray.direction.set( 0, 0, - 1 ).applyMatrix4( tempMatrix );

	return raycaster.intersectObjects( group.children, false );

}

function intersectObjects( controller ) {

  // Do not highlight in mobile-ar

  if ( controller.userData.targetRayMode === 'screen' ) return;

  // Do not highlight when already selected

  if ( controller.userData.selected !== undefined ) return;

  const line = controller.getObjectByName( 'line' );
  const intersections = getIntersections( controller );

  if ( intersections.length > 0 ) {

    const intersection = intersections[ 0 ];

    const object = intersection.object;
    object.material.emissive.r = 1;
    intersected.push( object );

    line.scale.z = intersection.distance;

  } else {

    line.scale.z = 5;

  }

}

function cleanIntersected() {

  while ( intersected.length ) {

    const object = intersected.pop();
    object.material.emissive.r = 0;

  }

}

function animate() {
  renderer.setAnimationLoop(render);
}

function render() {

  cleanIntersected()

  intersectObjects( controller1 );
  intersectObjects( controller2 );

  renderer.render(scene, camera);
}