"use strict";
var scene;
var camera;

var xpos=0.0099;	// x position of object
var ypos=0.0; 		// y position of object
var zpos=0.53;		// z position of object
var eRadius = 0.55;	// radius of earth
var mRadius = 0.65/5; // scaled down by 5, but that seems too small
var radObj = 0.53; // the radial position of the object (for the jumping)
var radius = eRadius;

var object;		// object traversing planets
var originObj = new THREE.Vector3(0, 0, 0);
var eOrigin = new THREE.Vector3(0,0,0);
var mOrigin = new THREE.Vector3(0.5, 0.5, 0.5);
var raycaster = new THREE.Raycaster();	// set up ray caster
var earthMesh;
var rotVx = 0.0; // rotational velocity around the current planet, left and right
var rotVy = 0.0;
var upV = 0.0;
var gravField = 0.2;

var onPlanetA = 1.0;
var originLast
var originNext
var lookVector = new THREE.Vector3(0, 0, 0)


window.onload = function init(){
	// set up renderer
	var renderer = new THREE.WebGLRenderer({
		antialias : true
	});
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );
	renderer.shadowMap.Enabled = true
	var onRenderFcts= [];


	// set up scene and camera
	scene	= new THREE.Scene();
	camera	= new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 100 );
	camera.position.z = 3;

	// add ambient lighting
	var ambientLight = new THREE.AmbientLight( 0x222222, 1)
	scene.add( ambientLight )
  // add directional lighting
	var dirLight = new THREE.DirectionalLight( 0xffffff, 1 )
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
	
	// create earth container
	var container	= new THREE.Object3D()
	container.rotateZ(-23.4 * Math.PI/180)
	container.position.z	= 0
	scene.add(container)

	// create the earth
	var earthGeometry = new THREE.SphereGeometry(0.5, 32, 32)
	earthGeometry.computeFaceNormals();
	var earthMaterial = new THREE.MeshPhongMaterial({
		map		: THREE.ImageUtils.loadTexture('threex_textures/earthmap1k.jpg'),
		bumpMap		: THREE.ImageUtils.loadTexture('threex_textures/earthbump1k.jpg'),
		bumpScale	: 0.05,
		specularMap	: THREE.ImageUtils.loadTexture('threex_textures/earthspec1k.jpg'),
		specular	: new THREE.Color('grey'),
	})
	var earth = new THREE.Mesh(earthGeometry, earthMaterial)
	earth.receiveShadow	= true
	earth.castShadow	= true
	container.add(earth)
	onRenderFcts.push(function(delta, now){
		earth.rotation.y += 1/32 * delta;		
	})

	// set up clouds for earth
	var clouds	= setUpClouds()
	clouds.receiveShadow = true
	clouds.castShadow = true
	container.add(clouds)
	onRenderFcts.push(function(delta, now){
		clouds.rotation.y += 1/8 * delta;		
	})

	// create moon and add to scene
	var moonGeometry = new THREE.SphereGeometry(0.5, 32, 32)
	var moonMaterial = new THREE.MeshPhongMaterial({
		map	: THREE.ImageUtils.loadTexture('threex_textures/moonmap1k.jpg'),
		bumpMap	: THREE.ImageUtils.loadTexture('threex_textures/moonbump1k.jpg'),
		bumpScale: 0.002,
	})
	var moon = new THREE.Mesh(moonGeometry, moonMaterial)
	moon.scale.multiplyScalar(1/5)
 	moon.position.set(0.5,0.5,0.5)
	moon.receiveShadow	= true
	moon.castShadow	= true
	scene.add(moon)
	

	// create another object
	var objectGeometry	= new THREE.SphereGeometry(0.1, 32, 32)
	var objectMaterial	= new THREE.MeshPhongMaterial({
		map	: THREE.ImageUtils.loadTexture('textures/planet.jpg'),
		bumpMap	: THREE.ImageUtils.loadTexture('textures/paper.jpg'),
		bumpScale: 0.005,
	})
	object = new THREE.Mesh(objectGeometry, objectMaterial)
	object.position.setX(xpos)
	object.position.setY(ypos)
	object.position.setZ(zpos)
 	object.up.set(xpos, ypos, zpos)
	object.scale.multiplyScalar(1/5)
	object.receiveShadow	= true
	object.castShadow	= true
	scene.add(object)
  //camera.position.y = -1
 	/****comment below to stop camera moving with the object****/
  object.add(camera)
 	camera.position.y = -2.5
 	camera.lookAt(object.position)
  camera.useQuaternion = false // so it does not undergo the same rotations as the ball
	//originObj = new THREE.Vector3(origin.x, origin.y, origin.z)
 
	// camera control
	var mouse	= {x : 0, y : 0}
	document.addEventListener('mousemove', function(event){
		mouse.x	= (event.clientX / window.innerWidth ) - 0.5
		mouse.y	= (event.clientY / window.innerHeight) - 0.5
	}, false)




	// ***** CODE BELOW AND CLOUD SET UP TAKEN FROM THREEX.PLANETS **** //

	onRenderFcts.push(function(delta, now){
		//camera.position.x = (xpos)
		//camera.position.y = (ypos)
//		camera.position.x += (mouse.x*5 - camera.position.x) * (delta*3)
//		camera.position.y += (mouse.y*5 - camera.position.y) * (delta*3)
 /***comment below and uncomment above to see the original mouse driven camera****/
  //camera.lookAt( object.position ) // this was making me motion sick
										
	if (rotVx != 0) {
	object.quaternion.multiply(new THREE.Quaternion(0, Math.sin(rotVx*radius/radObj), 0, Math.cos(rotVx*radius/radObj)));
	}
	
	if (rotVy != 0) {
	object.quaternion.multiply(new THREE.Quaternion(Math.sin(rotVy*radius/radObj), 0, 0, Math.cos(rotVy*radius/radObj)));
										// the radius/radobj factor makes it closer to linear velocity, at least while jumping
	}
	// to do, make this equations better so we increase the linear velocity rather than radial velocity at a constant speed, that
										// will make jumping and moving to planets much better
	var qx = object.quaternion.x;
	var qy = object.quaternion.y;
	var qz = object.quaternion.z;
	var qw = object.quaternion.w;
	xpos = 2 * (qy * qw + qz * qx) * radObj + originObj.x; // trying to just translate
	ypos = 2 * (qz * qy - qw * qx) * radObj + originObj.y;
	zpos = ((qz * qz + qw * qw) - (qx * qx + qy * qy))* radObj + originObj.z;
	object.position.setX(xpos);
	object.position.setY(ypos);
	object.position.setZ(zpos);
	console.log(object.position)
										
	if (onPlanetA < 1.0) {
	// originObj.lerpVectors(originNext, originLast, onPlanetA)
	 //radObj = onPlanetA * radius
	 onPlanetA += 0.002
	}
	// set new origin
	if (!originObj.equals(mOrigin) && object.position.distanceTo(mOrigin) < gravField + mRadius) {
			// point towards moon
			onPlanetA = 0.0
		//	object.position.set(mOrigin)
			originLast = new THREE.Vector3(eOrigin)
			originNext = new THREE.Vector3(mOrigin.x, mOrigin.y, mOrigin.z)
			upV = 0.0
			originObj = new THREE.Vector3(mOrigin.x , mOrigin.y, mOrigin.z)
			radius = mRadius // I have to think through how the radius switching should work, so far the results are bad
			radObj = mRadius + gravField
			object.quaternion.set(0, 0, 0, 1).normalize() // set quaternion back to identity
			console.log("hit moon")
			console.log(object.position)
	}
			console.log(originObj)
	if (!originObj.equals(eOrigin) && object.position.distanceTo(eOrigin) < eRadius) {
		console.log(originObj != eOrigin)
		//object.lookAt(new THREE.Vector3(eOrigin))
		originLast = new THREE.Vector3(mOrigin.x, mOrigin.y, mOrigin.z)
		originNext = new THREE.Vector3(eOrigin.x, eOrigin.y, eOrigin.z)
		upV = 0.0
		originObj = new THREE.Vector3(eOrigin.x, eOrigin.y, eOrigin.z)
		radius = eRadius
		radObj = eRadius + gravField
	}
	
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
										
	if (radObj > radius) {
		upV -= 0.005 // the downwards
		radObj += upV
	}
								
	})
	
	// render scene
	onRenderFcts.push(function(){
		renderer.render( scene, camera );		
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
		onRenderFcts.forEach(function(onRenderFct){
			onRenderFct(deltaMsec/1000, nowMsec/1000)
		})
	})
}

window.addEventListener("keydown", function(e){
  
	if (e.keyCode == 32){
	 if (radObj <= radius) {
			 upV = 0.1 // launch upwards
			 radObj += upV
	 }
	}
												
  if (e.keyCode === 37){ // left
      if (rotVx >= -0.05)
          rotVx -= 0.015
//	    object.quaternion.multiply(new THREE.Quaternion(0, Math.sin(-0.01), 0, Math.cos(-0.01)));
	}

	if (e.keyCode === 39) { // right
      if (rotVx <= 0.05)
          rotVx += 0.015
//	    object.quaternion.multiply(new THREE.Quaternion(0, Math.sin(0.01), 0, Math.cos(0.01)));
	}

	if (e.keyCode === 38) { // up
      if (rotVy >= -0.05)
				 rotVy -= 0.015;
//	    object.quaternion.multiply(new THREE.Quaternion(Math.sin(-0.01), 0, 0, Math.cos(-0.01)));
	}

	if (e.keyCode === 40) { // down
			if (rotVy >= -0.05)
        rotVy += 0.015
//	    object.quaternion.multiply(new THREE.Quaternion(Math.sin(0.01), 0, 0, Math.cos(0.01)));
	}
												
});

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
