"use strict";
var scene;
var cameraFol; 			// follow character
var cameraLook; 		// look from a distance
var windowWidth, windowHeight;	// window size
var renderer; 			// for updating views

// character
var xpos=0.0099;		// x position of object
var ypos=0.0; 			// y position of object
var zpos=0.53;			// z position of object
var character;			// character that user can control
var object;				// body of the character
var feet;				// characters two feet
var horizontal = true;	// keeps track which direction character is moving
var originObj = new THREE.Vector3(0, 0, 0);	// object original position

// planets
var eRadius = 0.55;		// radius of earth
var mRadius = 0.13; 	// radius of moon scaled down by 5 form earth
var fRadius = 0.16; 	// just for fun
var radObj = eRadius; 		// the radial position of the object (for the jumping)
var radius = eRadius;	// current radius
var eOrigin = new THREE.Vector3(0,0,0);			// origin of earth
var mOrigin = new THREE.Vector3(0.5, 0.5, 0.5);	// origin of moon
var fOrigin = new THREE.Vector3(0.7, -0.7, 0.7);// origin of fun

// speed and raycaster
var raycaster = new THREE.Raycaster();	// set up ray caster
var rotVx = 0.0; 		// rotational velocity around the current planet, left and right
var rotVy = 0.0;		// rotational velocity around the current planet, up and down 
var upV = 0.0;			// up velocity 
var gravField = 0.08;	// gravitational fireld 

// planet arrays
var radii = [eRadius, mRadius, fRadius];	// planet radii 
var origins = [eOrigin, mOrigin, fOrigin];	// planet origins
var textures = ['threex_textures/earthmap1k.jpg','threex_textures/moonmap1k.jpg','threex_textures/moonmap1k.jpg'];
var bumpMaps = ['threex_textures/earthbump1k.jpg','threex_textures/moonbump1k.jpg','threex_textures/moonbump1k.jpg'];
var numPlanets = 3;							// number of planets


// views for the two screens
var views = [
	{
		left:0,
		bottom:0,
		width: 0.5,
		height: 1.0,
		background: new THREE.Color().setRGB(0.0, 0.0, 0.0),
		fov: 45,
		updateCamera: function ( camera, scene, position ) {}
	},
	{
		left: 0.5,
		bottom: 0,
		width: 0.5,
		height: 1.0,
		background: new THREE.Color().setRGB(0.0, 0.0, 0.0),
		fov: 45,
		updateCamera: function( camera, scene, position) {
			camera.lookAt(position)
		}
	}
]

// on load
window.onload = function init(){
	// set up renderer- set up size and add in to the document
	renderer = new THREE.WebGLRenderer({
		antialias : true
	});
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );
	renderer.shadowMap.Enabled = true

	// used to continuously render
	var onRender = [];

	// set up scene and both cameras
	scene	= new THREE.Scene();
	cameraFol = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 100 );
	cameraLook	= new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 100 );
	cameraLook.position.z = 3;
	cameraFol.position.z = 3;

	// add ambient lighting
	var ambientLight = new THREE.AmbientLight( 0x222222, 1)
	scene.add( ambientLight )
  	// add directional lighting
	var dirLight = new THREE.DirectionalLight( 0xaaaaaa, 1 )
	dirLight.position.set(5,5,5)
	scene.add( dirLight )
	

	// set up background
	var backgroundMaterial = new THREE.MeshBasicMaterial({
		map	: THREE.ImageUtils.loadTexture('threex_textures/galaxy_starfield.png'),
		side	: THREE.BackSide
	})
	var backgroundGeometry	= new THREE.SphereGeometry(100, 32, 32)
	var background	= new THREE.Mesh(backgroundGeometry, backgroundMaterial)
	scene.add(background)


	// set up all the planets
	for (var i = 0; i < numPlanets; i++) {
		var geometry = new THREE.SphereGeometry(radii[i], 32, 32)
		var material = new THREE.MeshPhongMaterial({
			map	: THREE.ImageUtils.loadTexture(textures[i]),
			bumpMap	: THREE.ImageUtils.loadTexture(bumpMaps[i]),
			bumpScale: 0.05,
		})
		var planet = new THREE.Mesh(geometry, material)
		planet.position.set(origins[i].x, origins[i].y, origins[i].z)
		planet.receiveShadow = true
		planet.castShadow = true
		scene.add(planet)
	}
	

	// character
	character = new THREE.Object3D()
	character.position.z = zpos
	scene.add(character)

	// create object - character body
	var objectGeometry	= new THREE.SphereGeometry(0.1, 32, 32)
	var objectMaterial	= new THREE.MeshPhongMaterial({
		map	: THREE.ImageUtils.loadTexture('textures/planet.jpg'),
		bumpMap	: THREE.ImageUtils.loadTexture('textures/paper.jpg'),
		bumpScale: 0.005,
	})
	object = new THREE.Mesh(objectGeometry, objectMaterial)
	character.position.setX(xpos);
	character.position.setY(ypos);
	character.position.setZ(zpos);
	object.position.setX(0)
	object.position.setY(0.02)
	object.position.setZ(0)
 	object.up.set(xpos, ypos, zpos)
	object.scale.multiplyScalar(1/5)
	object.receiveShadow	= true
	object.castShadow	= true
	character.add(object)

  	// init camera for object
	object.add(cameraFol);
	views[0].camera = cameraFol;
	views[1].camera = cameraLook;
 	views[0].camera.position.y = -2.5
 	views[0].camera.lookAt(object.position)
 
	// character feet
	var foot = new THREE.SphereGeometry(0.008, 32, 32);
	feet = new THREE.Object3D();
	var left = new THREE.Mesh(foot, objectMaterial);
	var right = new THREE.Mesh(foot, objectMaterial);
	feet.position.setX(0)
	feet.position.setY(0)
	feet.position.setZ(0)
	left.position.x = 0.0;
	left.position.y = 0.02;
	left.position.z = 0.0;
	right.position.x = 0.0;
	right.position.y = -0.02;
	right.position.z = 0.0;
	character.add(feet);
	feet.add(left);
	feet.add(right);

	// camera control
	var mouse	= {x : 0, y : 0}
	document.addEventListener('mousemove', function(event){
		mouse.x	= (event.clientX / window.innerWidth ) - 0.5
		mouse.y	= (event.clientY / window.innerHeight) - 0.5
	}, false)


	// update size of window for split screen
	function updateSize() {
		if ( windowWidth != window.innerWidth || windowHeight != window.innerHeight ) {
			windowWidth  = window.innerWidth;
			windowHeight = window.innerHeight;
			renderer.setSize ( windowWidth, windowHeight );
		}
	}



	// push onto onRender to render - rendering functoin
	onRender.push(function(delta, now){

		// update window size
		updateSize();

		// Update views
		for (var i = 0; i < views.length; i++) {
			// update camera for view
			var view = views[i];
			var camera = view.camera;
			view.updateCamera( camera, scene, object.position);
			// set dimensions
			var left   = Math.floor( windowWidth  * view.left );
			var bottom = Math.floor( windowHeight * view.bottom );
			var width  = Math.floor( windowWidth  * view.width );
			var height = Math.floor( windowHeight * view.height );
			renderer.setViewport( left, bottom, width, height );
			renderer.setScissor( left, bottom, width, height );
			renderer.setScissorTest( true );
			renderer.setClearColor( view.background );
			
			camera.aspect = width / height;
			camera.updateProjectionMatrix();
			
			renderer.render( scene, camera );
		}
											
		// quarternion for x axis rotation						
		if (rotVx != 0) {
			character.quaternion.multiply(new THREE.Quaternion(0, Math.sin(rotVx*radius/radObj), 0, Math.cos(rotVx*radius/radObj)));
		}
		
		// quarternion for y axis rotation
		// the radius/radobj factor makes it closer to linear velocity, at least while jumping
		if (rotVy != 0) {
			character.quaternion.multiply(new THREE.Quaternion(Math.sin(rotVy*radius/radObj), 0, 0, Math.cos(rotVy*radius/radObj)));
											
		}

		// to do, make this equations better so we increase the linear velocity rather than radial velocity at a constant speed, that
		// will make jumping and moving to planets much better
		var qx = character.quaternion.x;
		var qy = character.quaternion.y;
		var qz = character.quaternion.z;
		var qw = character.quaternion.w;
		// calculate new x,y,z positions and update character position
		xpos = 2 * (qy * qw + qz * qx) * radObj + originObj.x; 
		ypos = 2 * (qz * qy - qw * qx) * radObj + originObj.y;
		zpos = ((qz * qz + qw * qw) - (qx * qx + qy * qy))* radObj + originObj.z;
		character.position.setX(xpos);
		character.position.setY(ypos);
		character.position.setZ(zpos);


		// go through the array of all planets and see if the character should be pulled in by any of grav fields
		for (var i = 0; i < numPlanets; i++) {
			if (!originObj.equals(origins[i]) && character.position.distanceTo(origins[i]) < gravField + radii[i]) {
					upV = 0.0	// set up velocity to 0
					originObj = new THREE.Vector3(origins[i].x , origins[i].y, origins[i].z) // update objects new origin to origin of planet
					radius = radii[i]
					radObj = radii[i]
					break;
			}
		}
											
		// speed up or slow down based on x and velocities
		if (rotVx < -0.005) {
			rotVx += 0.001
		} else if (rotVx > 0.005) {
			rotVx -= 0.001
		} else {
			rotVx = 0
		} // clamp down to zero to prevent drifting
		if (rotVy < -0.005) {
			rotVy += 0.001
		} else if (rotVy > 0.005) {
			rotVy -= 0.001
		} else {
			rotVy = 0
		}
		
		// update radObj									
		if (radObj > radius) {
			upV -= 0.005 // the downwards
			radObj += upV
		}
								
	})


	// loop runner
	var lastTimeMsec= null
	requestAnimationFrame(function animate(nowMsec){
		// keep looping
		requestAnimationFrame( animate );
		// measure time
		lastTimeMsec	= lastTimeMsec || nowMsec-1000/60
		var deltaMsec	= Math.min(200, nowMsec - lastTimeMsec)
		lastTimeMsec	= nowMsec
		// call each update function
		onRender.forEach(function(onRender){
			onRender(deltaMsec/1000, nowMsec/1000)
		})
	})
}



// handle key down event
window.addEventListener("keydown", function(e){
	// space - jump
	if (e.keyCode == 32){
		if (radObj <= radius) {
			upV = 0.1 // launch upwards
			radObj += upV
		}
	}
			
	// left									
  	if (e.keyCode === 37){ 
  		// if not moving horizontal before, turn object
  		if (!horizontal){
  			feet.rotateZ(Math.PI/2);
  		}
  		horizontal = true;
  		// decrease x velocity
	    if (rotVx >= -0.05)
	        rotVx -= 0.015
	}

	// right 
	if (e.keyCode === 39) {
		// if not moving horizontal before, turn object
		if (!horizontal){
  			feet.rotateZ(Math.PI/2);
  		}
		horizontal = true;
		// increase x velocity
      	if (rotVx <= 0.05)
        	rotVx += 0.015
	}

	// up
	if (e.keyCode === 38) { 
		// if moving horizontal before, turn object
		if (horizontal){
			feet.rotateZ(Math.PI/2);
		}
		horizontal = false;
		// decrease y velocity
     	if (rotVy >= -0.05)
			rotVy -= 0.015;
	}

	// down
	if (e.keyCode === 40) {
		// if moving horizontal before, turn object
		if (horizontal){
			feet.rotateZ(Math.PI/2);
		}
		horizontal = false;
		// increase y velocity
		if (rotVy <= 0.05)
        	rotVy += 0.015
	}
});



// this function is taken from THREEX.planets
function setUpClouds(){
	// create destination canvas
	var canvasResult	= document.createElement('canvas')
	canvasResult.width	= 1024
	canvasResult.height	= 512
	var contextResult	= canvasResult.getContext('2d')		

	// load earthcloudmap
	var imageMap	= new Image();
	imageMap.addEventListener("load", function() {
		
		// create dataMap ImageData for earthcloudmap
		var canvasMap	= document.createElement('canvas')
		canvasMap.width	= imageMap.width
		canvasMap.height= imageMap.height
		var contextMap	= canvasMap.getContext('2d')
		contextMap.drawImage(imageMap, 0, 0)
		var dataMap	= contextMap.getImageData(0, 0, canvasMap.width, canvasMap.height)

		// load earthcloudmaptrans
		var imageTrans	= new Image();
		imageTrans.addEventListener("load", function(){
			// create dataTrans ImageData for earthcloudmaptrans
			var canvasTrans		= document.createElement('canvas')
			canvasTrans.width	= imageTrans.width
			canvasTrans.height	= imageTrans.height
			var contextTrans	= canvasTrans.getContext('2d')
			contextTrans.drawImage(imageTrans, 0, 0)
			var dataTrans		= contextTrans.getImageData(0, 0, canvasTrans.width, canvasTrans.height)
			// merge dataMap + dataTrans into dataResult
			var dataResult		= contextMap.createImageData(canvasMap.width, canvasMap.height)
			for(var y = 0, offset = 0; y < imageMap.height; y++){
				for(var x = 0; x < imageMap.width; x++, offset += 4){
					dataResult.data[offset+0]	= dataMap.data[offset+0]
					dataResult.data[offset+1]	= dataMap.data[offset+1]
					dataResult.data[offset+2]	= dataMap.data[offset+2]
					dataResult.data[offset+3]	= 255 - dataTrans.data[offset+0]
				}
			}
			// update texture with result
			contextResult.putImageData(dataResult,0,0)	
			material.map.needsUpdate = true;
		})
		imageTrans.src	= 'threex_textures/earthcloudmaptrans.jpg';
	}, false);
	imageMap.src	= 'threex_textures/earthcloudmap.jpg';

	var geometry	= new THREE.SphereGeometry(0.51, 32, 32)
	var material	= new THREE.MeshPhongMaterial({
		map		: new THREE.Texture(canvasResult),
		side		: THREE.DoubleSide,
		transparent	: true,
		opacity		: 0.8,
	})
	var mesh	= new THREE.Mesh(geometry, material)
	return mesh	
}
