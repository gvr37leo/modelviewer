import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

import {FBXLoader} from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/loaders/FBXLoader.js';
import {GLTFLoader} from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/loaders/GLTFLoader.js';
import {OrbitControls} from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/controls/OrbitControls.js';

const TAU = Math.PI * 2

class ModelViewer{
    lastupdate
    interacting = false
    requiresUpdate = false

    constructor(element){
        this.element = element
        this.element.modelviewer = this
        this.element.innerHTML = ''
        this.init()
        
    }

    init(){
        
        this.settings = this.readSettings()
        // var width = this.element.clientWidth
        // var height = this.element.clientHeight
        var width = this.element.clientWidth
        var height = this.element.clientHeight

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera( this.settings.fov, width / height, 0.1, 1000 );
        this.camera.position.copy(this.settings.camerapos)
        this.camera.lookAt(this.settings.lookat)

        this.renderer = new THREE.WebGLRenderer({antialias:true,alpha:this.settings.transparent});
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.resize()
        this.element.appendChild(this.renderer.domElement);
        this.renderer.domElement.addEventListener('wheel',() => {
            this.requiresUpdate = true
        })

        if(this.settings.interactable){
            this.controls = new OrbitControls(this.camera, this.renderer.domElement);
            this.controls.target.copy(this.settings.lookat);
            if(this.settings.lockY){
                this.controls.minPolarAngle = Math.PI / 2
                this.controls.maxPolarAngle = Math.PI / 2
            }
            this.controls.update();
            this.controls.addEventListener('start',() => {
                this.interacting = true
            })
            this.controls.addEventListener('end', () => {
                this.interacting = false
            })
        }
        this.loadModel(this.settings.src)
        

        if(this.settings.background){
            let cubeloader = new THREE.CubeTextureLoader()
            let texture = cubeloader.load([
                `./resources/cubemaps/${this.settings.background}/px.jpg`,
                `./resources/cubemaps/${this.settings.background}/nx.jpg`,
                `./resources/cubemaps/${this.settings.background}/py.jpg`,
                `./resources/cubemaps/${this.settings.background}/ny.jpg`,
                `./resources/cubemaps/${this.settings.background}/pz.jpg`,
                `./resources/cubemaps/${this.settings.background}/nz.jpg`,
            ],() => {
                this.renderer.render( this.scene, this.camera );
            })
            this.scene.background = texture
        }
        


        


        let directionallight = new THREE.DirectionalLight(this.settings.lightcolor, 1);
        directionallight.position.set(20, 100, 10);
        directionallight.target.position.set(0, 0, 0);
        directionallight.castShadow = true;
        directionallight.shadow.bias = -0.001;
        directionallight.shadow.mapSize.width = 2048;
        directionallight.shadow.mapSize.height = 2048;
        directionallight.shadow.camera.near = 0.5;
        directionallight.shadow.camera.far = 500.0;
        directionallight.shadow.camera.left = 40;
        directionallight.shadow.camera.right = -40;
        directionallight.shadow.camera.top = 40;
        directionallight.shadow.camera.bottom = -40;
        this.scene.add(directionallight);

        let ambientlight = new THREE.AmbientLight(this.settings.lightcolor, 0.7);
        this.scene.add(ambientlight);



        

        

        let animate = () => {
            var dt = (Date.now() - this.lastupdate) / 1000
            this.lastupdate = Date.now()
            requestAnimationFrame(animate);
            this.update(dt)
            if(this.interacting || this.settings.autorotatespeed > 0 || this.requiresUpdate){
                this.renderer.render( this.scene, this.camera );
                this.requiresUpdate = true
            }
        }
        this.lastupdate = Date.now()
        animate();
        

        window.addEventListener('resize', () => {
            this.resize()
        })
    }

    readSettings(){
        var settings = {}
        settings.src = this.element.getAttribute('src') ?? ''
        settings.background = this.element.getAttribute('background') ?? ''
        settings.interactable = parseBool(this.element.getAttribute('interactable') ?? 'true')
        settings.autorotatespeed = parseFloat(this.element.getAttribute('autorotatespeed') ?? '0')
        settings.cameratype = this.element.getAttribute('cameratype') ?? 'perspective'
        settings.camerapos = parseVector(this.element.getAttribute('camerapos') ?? '0 2 -4') 
        settings.lookat = parseVector(this.element.getAttribute('lookat') ?? '0 0 0')
        settings.fov = parseFloat(this.element.getAttribute('fov') ?? '75')
        settings.transparent = parseBool(this.element.getAttribute('transparent') ?? 'true')
        settings.lightcolor = this.element.getAttribute('lightcolor') ?? '#fff'
        settings.lockY = parseBool(this.element.getAttribute('lockY') ?? 'false')
        return settings
    }

    loadModel(uri){
        var extension = uri.split('.').pop().toLowerCase()
        var loader = null
        if(extension == 'gltf' || extension == 'glb'){
            loader = new GLTFLoader()
        }else if(extension == 'fbx'){
            loader = new FBXLoader()
        }

        loader.load(uri, (gltf) => {
            gltf.scene.traverse(c => c.castShadow = true)
            this.scene.add(gltf.scene)
            this.update = (dt) => {
                this.model.rotation.z += dt * TAU * this.settings.autorotatespeed;
            }
            this.model = gltf.scene.children[0]
            this.renderer.render( this.scene, this.camera );
        },() => {}, () => {
            this.modelLoadFailed()
        })
    }

    modelLoadFailed(){
        this.model = new THREE.Mesh( 
            new THREE.BoxGeometry(), 
            new THREE.MeshStandardMaterial( { color: 'red' } ) 
        );
        this.model.position.set(0, 0, 0);
        this.model.castShadow = true;
        this.model.receiveShadow = true;
        this.scene.add(this.model);
    }

    update(dt){
        // this.model.rotation.x += dt * TAU * 0.25;
        // this.model.rotation.y += dt * TAU * 0.25;
    }

    resize(){
        var width = this.element.clientWidth
        var height = this.element.clientHeight
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.requiresUpdate = true
        this.renderer.setSize(width, height, false);
    }
}

function parseBool(str){
    return str == 'true'
}

function parseVector(str){
    var res = str.trim().split(' ').map(parseFloat)
    return new THREE.Vector3().fromArray(res);
}

window.exportCameraSettings = (model3del) => {
    var camera = model3del.modelviewer.camera
    var pos = camera.position
    var lookat = model3del.modelviewer.controls.target
    console.log(`camerapos="${pos.x.toFixed(1)} ${pos.y.toFixed(1)} ${pos.z.toFixed(1)}"`,`lookat="${lookat.x.toFixed(1)} ${lookat.y.toFixed(1)} ${lookat.z.toFixed(1)}"`)    
}

export {ModelViewer}

