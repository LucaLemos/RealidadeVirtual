import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

import * as controller from './controllers.js';

let container;
let camera, scene, renderer;

let physicsWorld;
let rigidBodies = controller.rigidBodies;
let clock;
let tmpTrans;

const STATE = { DISABLE_DEACTIVATION : 4 };

Ammo().then(init);

function init() {
  tmpTrans = new Ammo.btTransform();

  setupPhysicsWorld();
  setupConf();

  scene.add( controller.group );

  controller.setupController(scene, renderer);

  createRoom();
  //createBall(0, 1, -3.5);
  //createBall(0, 4, -3.5);
  createFlower()
  createTable()

  window.addEventListener('resize', onWindowResize);
  
  animate();
}


function setupPhysicsWorld(){
  let collisionConfiguration  = new Ammo.btDefaultCollisionConfiguration(),
      dispatcher              = new Ammo.btCollisionDispatcher(collisionConfiguration),
      overlappingPairCache    = new Ammo.btDbvtBroadphase(),
      solver                  = new Ammo.btSequentialImpulseConstraintSolver();

  physicsWorld           = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
  physicsWorld.setGravity(new Ammo.btVector3(0, -2, 0));
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

function createTable(){
  const loader = new GLTFLoader();

  loader.load( 'model/wooden_table.glb', function (gltf) {
    const model = gltf.scene;

    let pos = {x: 0, y: 0, z: -3};
    let scale = {x: 1, y: 1, z: 1.5};
    let quat = {x: 0, y: 1, z: 0, w: 1};
    let mass = 1;

    const boundingBox = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    boundingBox.getSize(size);

    model.position.set(pos.x, pos.y, pos.z);
    model.scale.set(scale.x, scale.y, scale.z);

    model.castShadow = true;
    model.receiveShadow = true;

    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
    transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
    let motionState = new Ammo.btDefaultMotionState( transform );
    
    let colShape = new Ammo.btBoxShape( new Ammo.btVector3( scale.x * 0.5, scale.y * 0.4, scale.z * 0.5 ) );
    colShape.setMargin( 0 );
    
    let localInertia = new Ammo.btVector3( 0, 0, 0 );
    colShape.calculateLocalInertia( 1, localInertia );
    
    let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
    let body = new Ammo.btRigidBody( rbInfo );

    body.setFriction(4);
    body.setRollingFriction(10);
    body.setActivationState( STATE.DISABLE_DEACTIVATION );
    
    physicsWorld.addRigidBody( body );
    
    model.userData.physicsBody = body;
  
    rigidBodies.push(model); 
    controller.group.add( model );

  }, undefined, function (error) {
    console.log("error");
  });
}
function createFlower(){
  const loader = new GLTFLoader();

  loader.load( 'model/Flower.glb', function (gltf) {
    const model = gltf.scene;
    
    const mesh1 = model.children[0]
    const mesh2 = model.children[1]

    var geometries = [];
    geometries.push(mesh1.geometry);
    geometries.push(mesh2.geometry);
    
    const mergedGeometry = BufferGeometryUtils.mergeBufferGeometries(geometries);
    const material = mesh1.material;
    const mergedMesh = new THREE.Mesh(mergedGeometry, material);

    let pos = {x: 0, y: 3, z: -3};
    let scale = {x: 5, y: 5, z: 5};
    let quat = {x: 1, y: 0, z: 0, w: 1};
    let mass = 1;

    const boundingBox = new THREE.Box3().setFromObject(mergedMesh);
    const size = new THREE.Vector3();
    boundingBox.getSize(size);

    mergedMesh.position.set(pos.x, pos.y, pos.z);
    mergedMesh.scale.set(scale.x, scale.y, scale.z);

    mergedMesh.castShadow = true;
    mergedMesh.receiveShadow = true;

    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
    transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
    let motionState = new Ammo.btDefaultMotionState( transform );
    
    let colShape = new Ammo.btBoxShape( new Ammo.btVector3( size.x * 0.5, size.y * 0.5, size.z * 0.5) );
    colShape.setMargin( 0.05 );
    
    let localInertia = new Ammo.btVector3( 0, 0, 0 );
    colShape.calculateLocalInertia( 1, localInertia );
    
    let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
    let body = new Ammo.btRigidBody( rbInfo );

    body.setFriction(4);
    body.setRollingFriction(10);
    body.setActivationState( STATE.DISABLE_DEACTIVATION );
    
    physicsWorld.addRigidBody( body );
    
    mergedMesh.userData.physicsBody = body;
  
    rigidBodies.push(mergedMesh); 
    controller.group.add( mergedMesh );
  }, undefined, function (error) {
    console.log("error");
  });

}

function createCube(){
  // Add a cube to the scene
  const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
  const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
  const cube = new THREE.Mesh(geometry, material);
  cube.position.set(1, 1, -2.5); // Adjust the cube position as needed
  
  group.add( cube );
}

function createBall( x, y, z){    
  let pos = {x: x, y: y, z: z};
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

  body.setFriction(4);
  body.setRollingFriction(10);
  body.setActivationState( STATE.DISABLE_DEACTIVATION );
  
  physicsWorld.addRigidBody( body );
  
  ball.userData.physicsBody = body;
  
  rigidBodies.push(ball);
  group.add(ball);
}


function createRoom() {
  let pos = {x: 0, y: 1, z: -6};
  let scale = {x: 25, y: 2, z: 8};
  let quat = {x: THREE.MathUtils.degToRad(90), y: 0, z: 0, w: 1};
  let mass = 0;
  createWall(pos, scale, quat, mass);
  pos = {x: 0, y: 1, z: 6};
  quat = {x: THREE.MathUtils.degToRad(90), y: 0, z: 0, w: 1};
  createWall(pos, scale, quat, mass);
  pos = {x: 6, y: 1, z: 0};
  quat = {x: THREE.MathUtils.degToRad(90), y: 0, z: THREE.MathUtils.degToRad(90), w: 1};
  createWall(pos, scale, quat, mass);
  createWall(pos, scale, quat, mass);
  pos = {x: -6, y: 1, z: 0};
  quat = {x: THREE.MathUtils.degToRad(90), y: 0, z: THREE.MathUtils.degToRad(90), w: 1};
  createWall(pos, scale, quat, mass);

  pos = {x: 0, y: -2, z: 0};
  scale = {x: 12, y: 2, z: 12};
  quat = {x: 0, y: 0, z: 0, w: 1};
  mass = 0;
  let madeira = 'material/whiteOak.png'
  let pedra = 'material/slateTileGrey.png'
  createFloor(pos, scale, quat, mass, madeira);
  pos = {x: 0, y: 5, z: 0};
  createFloor(pos, scale, quat, mass, pedra);
}
function createFloor(posV, scaleV, quatV, massV, image){
  let pos = posV;
  let scale = scaleV;
  let quat = quatV;
  let mass = massV;

  const loader = new THREE.TextureLoader();
  const texture = loader.load(image);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  const material = new THREE.MeshBasicMaterial({ map: texture });
    
  let blockPlane = new THREE.Mesh(new THREE.BoxGeometry(), material );
  

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

  body.setFriction(4);
  body.setRollingFriction(10);
  physicsWorld.addRigidBody( body );
}
function createWall(posV, scaleV, quatV, massV){
  let pos = posV;
  let scale = scaleV;
  let quat = quatV;
  let mass = massV;

  const loader = new THREE.TextureLoader();
  const texture = loader.load('material/BrickWhite.png');
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  const material = new THREE.MeshBasicMaterial({ map: texture });
    
  let blockPlane = new THREE.Mesh(new THREE.BoxGeometry(), material );
  

  blockPlane.position.set(pos.x, pos.y, pos.z);
  blockPlane.scale.set(scale.x, scale.y, scale.z);
  blockPlane.rotation.set(quat.x, quat.y, quat.z);

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

  body.setFriction(4);
  body.setRollingFriction(10);
  physicsWorld.addRigidBody( body );
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

function animate() {
  renderer.setAnimationLoop(render);
}

function render() {
  controller.cleanIntersected();
  let deltaTime = clock.getDelta();

  controller.intersectObjects( controller.controller1 );
  controller.intersectObjects( controller.controller2 );

  updatePhysics( deltaTime );

  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}