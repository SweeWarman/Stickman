import * as Node from './node.js';

// Global variables
let canvas = null;
let tool = new paper.Tool()

let defaultPose = {
    "leftKnee": 95, "leftFoot": 10, "rightKnee": 85, 
    "rightFoot": 0, "torso": -90, "leftElbow": -135,
    "leftWrist": -10, "rightElbow": 135,
    "rightWrist": 10, "neck": 0 
};

let appState = {
    selectedPart  : null,          // part selected via mouse interactions
    currentPose   : defaultPose,   // current pose of stickman
    recordedPoses : [],            // array of (t,pose,imgurl) of the poses selected
    slider        : null,          // current slider value
    maxTime       : 5,             // max slider value 
};

// Create a stickman
let stickman = Node.NewStickMan()

// Update stickman with default pose
Node.UpdatePose(stickman,appState.currentPose)

// Function to draw the stickman
function DrawStickMan(node) {
    if (node.name != "root") {
        var path = new paper.Path()
        path.strokeWidth = 3
        path.strokeColor = "black"
        path.add(new paper.Point(node.parent.endPosg[0], node.parent.endPosg[1]))
        path.add(new paper.Point(node.endPosg[0], node.endPosg[1]))
        if (node.name == "neck") {
            let dx = (node.endPosg[0] - node.parent.endPosg[0])
            let dy = (node.endPosg[1] - node.parent.endPosg[1])
            let center = [node.endPosg[0] + dx, node.endPosg[1] + dy]
            let path2 = new paper.Path.Circle(new paper.Point(center[0], center[1]), 10)
            path2.strokeWidth = 1
            path2.strokeColor = "black"
            path2.fillColor = "black"
        } else {
            //add callback to path segment to record selected joint
            path.onMouseDown = function (event) {
                appState.selectedPart = node;
            }
        }
    }
    node.children.forEach(element => DrawStickMan(element))
}

// callback to change pose when joint is moved
tool.onMouseDrag = function (event) {
    if (appState.selectedPart != null) {
        let location = event.point
        let currJointAngle = Node.angle(appState.selectedPart.parent.endPosg,appState.selectedPart.endPosg) 
        let newJointAngle  = Node.angle(appState.selectedPart.parent.endPosg,[event.point.x,event.point.y])
        let diff1 = currJointAngle - newJointAngle
        appState.selectedPart.UpdateJointAngle(appState.selectedPart.angle - diff1*180/Math.PI)
        Node.UpdatePose(stickman)
        paper.project.clear();
        DrawStickMan(stickman);
    }
}

// callback to disable selection
tool.onMouseUp = function (event) {
    appState.selectedPart = null;
}


let recordSnapShot = function(event){

}

let endTimeOnChange = function(){
    appState.maxTime = document.getElementById('endtime').value;
    appState.slider.max = appState.maxTime
    console.log(appState.maxTime)
}

let sliderOnChange = function(){
    console.log(appState.slider.value)
}

window.onload = function () {
    // Get a reference to the canvas object
    canvas = document.getElementById('myCanvas');

    appState.maxTime = document.getElementById('endtime').value;
    appState.slider  = document.getElementById('timeRange'); 
    appState.slider.min = 0
    appState.slider.max = appState.maxTime
    appState.slider.step = 0.1
    appState.slider.value = appState.slider.min

    appState.slider.onchange = sliderOnChange
    document.getElementById('endtime').onchange = endTimeOnChange
    

    // Create an empty project and a view for the canvas:
    paper.setup(canvas);
    paper.view.autoUpdate = false;
    paper.view.onFrame=function(event){
        DrawStickMan(stickman);
        paper.view.update();
    }
    //paper.view.draw();
    /*
    var shot = canvas.toDataURL('image/png')
    console.log(shot)
    var imgTag = document.getElementById('pose')
    imgTag.src = shot*/
}

