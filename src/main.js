import * as Node from './node.js';

// Global variables
let canvas = null;
let tool = new paper.Tool()

let defaultPose = {
    "leftKnee": 95, "leftFoot": 10, "rightKnee": 85, 
    "rightFoot": 0, "torso": -90, "leftElbow": -135,
    "leftWrist": -10, "rightElbow": 135,
    "rightWrist": 10, "neck": 0, "posX": 200, "posY": 200 
};

let appState = {
    selectedPart  : null,          // part selected via mouse interactions
    selectedPos   : null,          // initial mouse location
    currentPose   : defaultPose,   // current pose of stickman
    recordedPoses : [],            // array of (t,pose,imgurl) of the poses selected
    slider        : null,          // current slider value
    maxTime       : 5,             // max slider value 
    update        : true,
    intpfun       : null,          // timeout function for interpolation
    keypress      : null      
};

// Create a stickman
let stickman = Node.NewStickMan()

// Update stickman with default pose
Node.UpdatePose(stickman,appState.currentPose)

// Function to draw the stickman
function DrawStickMan(node) {
    if (node.name != "root") {
        var path = new paper.Path()
        path.strokeWidth = 8
        path.strokeColor = "black"
        if(appState.selectedPart != null){
            if(appState.selectedPart.name == node.name){
                path.strokeColor = "green"
            }
        }
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
            //callback for head selection
            path2.onMouseDown = function (event) {
                appState.selectedPart = node;
                appState.selectedPos = [event.point.x,event.point.y]
            }
        }else {
            //add callback to path segment to record selected joint
            path.onMouseDown = function (event) {
                appState.selectedPart = node;
                appState.selectedPos = [event.point.x,event.point.y]
            }
        }
    }
    node.children.forEach(element => DrawStickMan(element))
}

function InterpolatePoses(t){

   let interpolateJoints = function(i,t,name){
      let j1 = appState.recordedPoses[i-1][1][name]
      let j2 = appState.recordedPoses[i][1][name]
      let t1 = appState.recordedPoses[i-1][0]
      let t2 = appState.recordedPoses[i][0]
      let diff = 0
      if(name == "posX" || name == "poxY"){
          diff = j2-j1
      }else{
          let diff1 = (360 + (j2 - j1)) % 360
          let diff2 = (360 + (j1 - j2)) % 360
          if (diff1 > diff2) {
              diff = -diff2
          } else {
              diff = diff1
          }
      }
      let j  = j1 + diff*(t - t1)/(t2-t1)
      return j
   }
   for(let i=1;i<appState.recordedPoses.length;++i){
       if (t >= appState.recordedPoses[i-1][0] && t < appState.recordedPoses[i][0]){
            let l1 = interpolateJoints(i,t,"leftKnee");
            let l2 = interpolateJoints(i,t,"leftFoot");
            let l3 = interpolateJoints(i,t,"leftElbow");
            let l4 = interpolateJoints(i,t,"leftWrist");
            let l5 = interpolateJoints(i,t,"rightKnee");
            let l6 = interpolateJoints(i,t,"rightFoot");
            let l7 =  interpolateJoints(i,t,"rightElbow");
            let l8 =  interpolateJoints(i,t,"rightWrist");
            let l9 =  interpolateJoints(i,t,"torso");
            let l10=  interpolateJoints(i,t,"neck");
            let l11=  interpolateJoints(i,t,"posX");
            let l12=  interpolateJoints(i,t,"posY");
            let pose = {
               "leftKnee" : l1,
               "leftFoot" : l2,
               "leftElbow" : l3,
               "leftWrist" : l4,
               "rightKnee" : l5,
               "rightFoot" : l6,
               "rightElbow" : l7,
               "rightWrist" : l8,
               "torso" :l9,
               "neck" :l10,
               "posX": l11,
               "posY": l12,
           }
           return pose
       }
   }
   let pose = {}
   Node.GetCurrentPose(stickman,pose)
   return pose
}

// callback to change pose when joint is moved
tool.onMouseDrag = function (event) {
    if (appState.selectedPart != null) {
        let location = event.point
        let currJointAngle = Node.angle(appState.selectedPart.parent.endPosg,appState.selectedPart.endPosg) 
        let newJointAngle  = Node.angle(appState.selectedPart.parent.endPosg,[event.point.x,event.point.y])
        let diff1 = (2*Math.PI + (currJointAngle - newJointAngle))%(2*Math.PI)
        let diff2 = (currJointAngle - newJointAngle)
        let diff  = 0
        if(diff1 > Math.abs(diff2)){
            diff = diff2
        }else{
            diff = diff1
        }
        appState.selectedPart.UpdateJointAngle((360 + appState.selectedPart.angle - diff*180/Math.PI)%360)
        Node.UpdatePose(stickman)
        appState.update = true
    }
}


// callback to disable selection
tool.onMouseUp = function (event) {
    appState.selectedPart = null;
}

let playOnClick = function(){
    //Play from current time
    appState.intpfun = setInterval(interpolate,10);    
}

let interpolate = function(){
    let t = parseFloat(appState.slider.value)
    let pose = InterpolatePoses(t) 
    Node.UpdatePose(stickman,pose)
    t += 0.01
    appState.slider.value = t.toString()
    document.getElementById('endtime').value = appState.slider.value
    if(t >= parseFloat(appState.maxTime)){
        clearInterval(appState.intpfun)
    }
}

let endTimeOnChange = function(){
    appState.maxTime = document.getElementById('endtime').value;
    appState.slider.max = appState.maxTime
}

let sliderOnChange = function(){
    document.getElementById('endtime').value = appState.slider.value
    let t = parseFloat(appState.slider.value)
    let pose = InterpolatePoses(t) 
    Node.UpdatePose(stickman,pose)
}

let snapOnClick = function(){
    let poset = parseFloat(appState.slider.value)
    let availindex = -1
    for(let i=0;i<appState.recordedPoses.length;++i){
        if(poset == appState.recordedPoses[i][0]){
            availindex = i
            break
        }
    }
    var shot = canvas.toDataURL('image/png')
    let pose = {}
    Node.GetCurrentPose(stickman,pose) 
    if(availindex < 0){
        appState.recordedPoses.push([poset,pose,shot])
    }else{
        appState.recordedPoses[availindex][1] = pose
        appState.recordedPoses[availindex][2] = shot
    }
    
    console.log(appState.recordedPoses)
    appState.recordedPoses.sort((a,b)=>{
       return a[0]-b[0]
    })
    showRecoredPoses() 
}

function showRecoredPoses(){
    document.getElementById('image-panel').innerHTML = ''
    appState.recordedPoses.forEach(element => { 
        var img = document.createElement("img");
        img.setAttribute("src",element[2])
        img.setAttribute("width","100px")
        img.setAttribute("height","100px")
        img.onclick = function(){
            appState.slider.value = element[0].toString();
            Node.UpdatePose(stickman,element[1])
            document.getElementById('endtime').value = element[0].toString()
        }
        document.getElementById('image-panel').appendChild(img)})
}

function onKeyPress(e){
   if(e.code == "ArrowLeft"){
       stickman.endPosg[0] -= 1;
   }else if(e.code == "ArrowRight"){
       stickman.endPosg[0] += 1;
   }else if(e.code == "ArrowUp"){
       stickman.endPosg[1] -= 1;
   }else if(e.code == "ArrowDown"){
       stickman.endPosg[1] += 1;
   }
   Node.UpdatePose(stickman);
}

// courtesy: https://stackoverflow.com/questions/34156282/how-do-i-save-json-to-local-text-file
function download(content, fileName, contentType) {
    var a = document.createElement("a");
    var file = new Blob([content], {type: contentType});
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}



window.onload = function () {
    // Get a reference to the canvas object
    canvas = document.getElementById('myCanvas');

    appState.maxTime = document.getElementById('endtime').value;
    appState.slider  = document.getElementById('timeRange'); 
    appState.slider.min = 0
    appState.slider.max = appState.maxTime
    appState.slider.step = 0.01
    appState.slider.value = appState.slider.min

    appState.slider.onchange = sliderOnChange
    document.getElementById('endtime').onchange = endTimeOnChange
    document.getElementById('snap').onclick = snapOnClick
    document.getElementById('play').onclick = playOnClick
    document.getElementById('stop').onclick = function(){clearInterval(appState.intpfun)}

    document.getElementById('download').onclick= ()=>{
        if (appState.recordedPoses.length > 0) {
            let textdata = JSON.stringify(appState.recordedPoses)
            download(textdata, 'poses.txt', 'text/plain')
        }{
            alert("No recorded poses")
        }
    }

    document.getElementById('file-input').onchange=()=>{
        let file = document.getElementById('file-input').files
        const reader = new FileReader();
        reader.onload = function(e) { 
            let recposes = JSON.parse(e.target.result) 
            appState.recordedPoses = recposes;
            showRecoredPoses()
        }
        reader.readAsText(file[0]);
    }
    
    document.onkeydown = onKeyPress

    // Create an empty project and a view for the canvas:
    paper.setup(canvas);
    paper.view.autoUpdate = false;
    paper.view.onFrame=function(event){
        paper.project.clear();
        DrawStickMan(stickman);
        paper.view.update();
    }

}

