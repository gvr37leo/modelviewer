import {ModelViewer} from './modelviewer.js'

load3DModels()

function load3DModels(){
    var elements3D = document.querySelectorAll('model3D')

    for(var element of elements3D){
        new ModelViewer(element)
    }
}


class Test{
    constructor(){

    }

    init(){
        
    }
}