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

let physicsWorld;
let rigidBodies = [];
let clock;
let tmpTrans;

Ammo().then(init);

function init() {
  tmpTrans = new Ammo.btTransform();

  setupPhysicsWorld();
  setupConf();

  group = new THREE.Group();
  scene.add( group );

  createFloor();
  createCube();
  createBall();
  setupController();

  window.addEventListener('resize', onWindowResize);

  animate();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function setupConf(){
  clock = new THREE.Clock();
  container = document.getElementById('container');

  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0xbfd1e5 );

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
}

function setupPhysicsWorld(){
  let collisionConfiguration  = new Ammo.btDefaultCollisionConfiguration(),
      dispatcher              = new Ammo.btCollisionDispatcher(collisionConfiguration),
      overlappingPairCache    = new Ammo.btDbvtBroadphase(),
      solver                  = new Ammo.btSequentialImpulseConstraintSolver();

  physicsWorld           = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
  physicsWorld.setGravity(new Ammo.btVector3(0, -0.5, 0));
}

function setupController(){
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
}

function createFloor(){
  let pos = {x: 0, y: -2, z: 0};
  let scale = {x: 10, y: 2, z: 10};
  let quat = {x: 0, y: 0, z: 0, w: 1};
  let mass = 0;
    
  let blockPlane = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshPhongMaterial({color: 0x8080ff}));

  blockPlane.position.set(pos.x, pos.y, pos.z);
  blockPlane.scale.set(scale.x, scale.y, scale.z);

  blockPlane.castShadow = true;
  blockPlane.receiveShadow = true;

  scene.add(blockPlane);
    
  let transform = new Ammo.btTransform();
  transform.setIdentity();
  transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
  transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
  let motionState = new Ammo.btDefaultMotionState( transform );

  let colShape = new Ammo.btBoxShape( new Ammo.btVector3( scale.x * 0.5, scale.y * 0.5, scale.z * 0.5 ) );
  colShape.setMargin( 0.05 );

  let localInertia = new Ammo.btVector3( 0, 0, 0 );
  colShape.calculateLocalInertia( mass, localInertia );

  let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
  let body = new Ammo.btRigidBody( rbInfo );

  physicsWorld.addRigidBody( body );
}

function createCube(){
  // Add a cube to the scene
  const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
  const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
  const cube = new THREE.Mesh(geometry, material);
  cube.position.set(1, 1, -2.5); // Adjust the cube position as needed
  
  group.add( cube );
}

function createBall(){    
  let pos = {x: 0, y: 4, z: -3.5};
  let radius = 1;
  let quat = {x: 0, y: 0, z: 0, w: 1};
  let mass = 1;

  let ball = new THREE.Mesh(new THREE.SphereGeometry(radius), new THREE.MeshPhongMaterial({color: 0x00ff00}));

  ball.position.set(pos.x, pos.y, pos.z);
  
  ball.castShadow = true;
  ball.receiveShadow = true;
  
  let transform = new Ammo.btTransform();
  transform.setIdentity();
  transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
  transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
  let motionState = new Ammo.btDefaultMotionState( transform );
  
  let colShape = new Ammo.btSphereShape( radius );
  colShape.setMargin( 0.05 );
  
  let localInertia = new Ammo.btVector3( 0, 0, 0 );
  colShape.calculateLocalInertia( mass, localInertia );
  
  let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
  let body = new Ammo.btRigidBody( rbInfo );
  
  physicsWorld.addRigidBody( body );
  
  ball.userData.physicsBody = body;
  
  rigidBodies.push(ball);
  group.add(ball);
}

function onSelectStart(event) {
  const controller = event.target;
  const intersections = getIntersections(controller);

  if (intersections.length > 0) {
    const intersection = intersections[0];

    const object = intersection.object;
    object.material.emissive.b = 1;

    controller.attach(object);
    rigidBodies.pop(object);

    controller.userData.selected = object;
  }

  controller.userData.targetRayMode = event.data.targetRayMode;
}

function onSelectEnd(event) {
  const controller = event.target;

  if (controller.userData.selected !== undefined) {
    const object = controller.userData.selected;
    object.material.emissive.b = 0;

    group.attach(object);
    rigidBodies.push(object);

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
  cleanIntersected();
  let deltaTime = clock.getDelta();

  updatePhysics( deltaTime );

  intersectObjects( controller1 );
  intersectObjects( controller2 );

  renderer.render(scene, camera);
}

function updatePhysics( deltaTime ){    
  physicsWorld.stepSimulation( deltaTime, 10 );
  
  for ( let i = 0; i < rigidBodies.length; i++ ) {
    
    let objThree = rigidBodies[ i ];
    let objAmmo = objThree.userData.physicsBody;
    let ms = objAmmo.getMotionState();
    
    if ( ms ) {
      ms.getWorldTransform( tmpTrans );
      let p = tmpTrans.getOrigin();
      let q = tmpTrans.getRotation();

      objThree.position.set( p.x(), p.y(), p.z() );
      objThree.quaternion.set( q.x(), q.y(), q.z(), q.w() );
    }
  }
}