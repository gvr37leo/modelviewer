import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import {GLTFLoader} from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/loaders/GLTFLoader.js';
import {OrbitControls} from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/controls/OrbitControls.js';

const TAU = Math.PI * 2

class ModelViewer{
    lastupdate


    //src '' empty string loads cube
    //rotate/draggable by hand  true
    //auto rotate speed 0.25
    //ortho perspective perspective
    //camera pos 0 2 -10
    //camera focus 0 1 0
    //fov 90
    //background

    constructor(element){
        this.element = element
        this.element.modelviewer = this
        this.element.innerHTML = ''
        this.init()
        
    }

    init(){
        
        let settings = this.readSettings()
        // var width = this.element.clientWidth
        // var height = this.element.clientHeight
        var width = this.element.clientWidth
        var height = this.element.clientHeight

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera( settings.fov, width / height, 0.1, 1000 );
        this.camera.position.copy(settings.camerapos)
        this.camera.lookAt(settings.cameralookat)

        this.renderer = new THREE.WebGLRenderer({antialias:true,alpha:settings.transparent});
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(width, height);
        this.element.appendChild(this.renderer.domElement);

        if(settings.interactable){
            const controls = new OrbitControls(this.camera, this.renderer.domElement);
            controls.target.copy(settings.cameralookat);
            controls.update();
        }

        let gltfloader = new GLTFLoader()
        gltfloader.setPath('./resources/enterprise/')
        gltfloader.load('scene.gltf', (gltf) => {
            gltf.scene.traverse(c => c.castShadow = true)
            this.scene.add(gltf.scene)
            this.update = (dt) => {
                this.model.rotation.z += dt * TAU * settings.autorotatespeed;
            }
            this.model = gltf.scene.children[0]
        })

        if(settings.background){
            let cubeloader = new THREE.CubeTextureLoader()
            let texture = cubeloader.load([
                `/resources/cubemaps/${settings.background}/px.jpg`,
                `/resources/cubemaps/${settings.background}/nx.jpg`,
                `/resources/cubemaps/${settings.background}/py.jpg`,
                `/resources/cubemaps/${settings.background}/ny.jpg`,
                `/resources/cubemaps/${settings.background}/pz.jpg`,
                `/resources/cubemaps/${settings.background}/nz.jpg`,
            ])
            this.scene.background = texture
        }
        


        


        let directionallight = new THREE.DirectionalLight(0xFFFFFF,0.8);
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

        let ambientlight = new THREE.AmbientLight(0xFFFFFF,0.5);
        this.scene.add(ambientlight);



        // const plane = new THREE.Mesh(
        // new THREE.PlaneGeometry(100, 100, 10, 10),
        // new THREE.MeshStandardMaterial({
        //     color: 0xFFFFFF,
        // }));
        // plane.castShadow = false;
        // plane.receiveShadow = true;
        // plane.rotation.x = -Math.PI / 2;
        // this.scene.add(plane);


        // this.model = new THREE.Mesh( 
        //     new THREE.BoxGeometry(), 
        //     new THREE.MeshStandardMaterial( { color: 0xFFFFFF } ) 
        // );
        // this.model.position.set(0, 1, 0);
        // this.model.castShadow = true;
        // this.model.receiveShadow = true;
        // this.scene.add(this.model);

        

        let animate = () => {
            var dt = (Date.now() - this.lastupdate) / 1000
            this.lastupdate = Date.now()
            requestAnimationFrame(animate);
            this.update(dt)
            this.renderer.render( this.scene, this.camera );
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
        settings.camerapos = parseVector(this.element.getAttribute('camerapos') ?? '0 2 -10') 
        settings.cameralookat = parseVector(this.element.getAttribute('cameralookat') ?? '0 0 0')
        settings.fov = parseFloat(this.element.getAttribute('fov') ?? '75')
        settings.transparent = parseBool(this.element.getAttribute('transparent') ?? 'true')
        return settings
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
        this.renderer.setSize(width, height);
    }
}

function parseBool(str){
    return str == 'true'
}

function parseVector(str){
    var res = str.trim().split(' ').map(parseFloat)
    return new THREE.Vector3().fromArray(res);
}

export {ModelViewer}

