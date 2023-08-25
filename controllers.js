import * as THREE from 'three';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';

export let controller1, controller2;
let controllerGrip1, controllerGrip2;

let raycaster;
const tempMatrix = new THREE.Matrix4();
const intersected = [];

export let group = new THREE.Group();
export let rigidBodies = [];

export function setupController(scene, renderer) {
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
};

function onSelectStart(event) {
    const controller = event.target;
    const intersections = getIntersections(controller);
  
    if (intersections.length > 0) {
      const intersection = intersections[0];
  
      const object = intersection.object;
      object.material.emissive.b = 1;
  
      //physicsWorld.removeRigidBody(object.userData.physicsBody)
      rigidBodies.pop(object);
      controller.attach(object);
  
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
  
      let posx = object.position.x
      let posy = object.position.y
      let posz = object.position.z
      console.log(posy)
      
      let physicsBody = object.userData.physicsBody;
      const newPosition = new Ammo.btVector3(posx, posy, posz);
      const newTransform = new Ammo.btTransform();
      newTransform.setIdentity();
      newTransform.setOrigin(newPosition);
  
      physicsBody.setWorldTransform(newTransform);
    
      //physicsWorld.addRigidBody( physicsBody );
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
  
  export function intersectObjects( controller ) {
  
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
  
  export function cleanIntersected() {
  
    while ( intersected.length ) {
  
      const object = intersected.pop();
      object.material.emissive.r = 0;
  
    }
  
  }