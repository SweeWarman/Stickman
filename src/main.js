function Transform(theta,t,x){
    /**
     * Homogeneous transfomration
     * theta: angle [degree]
     * t    : translation vector
     * x    : point
     */
    ang = theta*Math.PI/180;
    M = [[Math.cos(ang), -Math.sin(ang), t[0]],
         [Math.sin(ang),  Math.cos(ang), t[1]],
         [0.0,                 0.0,      0.0]]

    tfvec = [M[0][0]*(x[0]+t[0]) + M[0][1]*(x[1]+t[1]),
             M[1][0]*(x[0]+t[0]) + M[1][1]*(x[1]+t[1])]

    return tfvec
}

class Node{
    /**
     * 
     * @param {string} name id of node 
     * @param {double} angle angle of node relative to parent
     * @param {double} nodeLen length of node
     * @param {[double,double]} limits constraints on rotation angles
     * @param {[double,double]} anchor anchor point
     */
    constructor(name,angle,nodeLen,limits=null,anchor=null){
        this.name        = name;          
        this.angle       = angle;         
        this.length      = nodeLen;      
        this.parent      = null;        
        this.children    = [];         
        this.limits      = limits;    
        if (anchor != null) {
            this.endPosg = anchor;   
        }else{
            this.endPosg = [0.0,0.0];
        }
    }

    AddChildren(children){
        children.forEach(element => {
           element.parent = this;
           this.children.push(element);   
        });
    }

    UpdateJointAngle(angle){
        this.angle = angle;
    }

    ComputePose(vec=null){
        if(vec == null){
            if(this.parent != null){
                var x = Transform(this.angle,[0,0],[this.length,0])
                this.endPosg = this.parent.ComputePose(x)
            }
        }else{
            if(this.parent != null){
                var x = Transform(this.angle,[this.length,0],vec)
                return this.parent.ComputePose(x)
            }else{
                return Transform(0,this.endPosg,vec)
            }
        }

    }
}

function NewStickMan() {
    /**
     * Create a new stick man instace
     */
    var stickman   = new Node("root", 0, 0,limits=null, anchor=[200,200])
    var leftKnee   = new Node("leftKnee", 90, 50, limits = [-10, 135])
    var leftFoot   = new Node("leftFoot", 0, 50, limits = [0, 135])
    var rightKnee  = new Node("rightKnee", 90, 50, limits = [-10, 135])
    var rightFoot  = new Node("rightFoot", 0, 50, limits = [0, 135])
    var torso      = new Node("torso", -90, 50, limits = [-135, 45])
    var leftElbow  = new Node("leftElbow", -90, 30)
    var leftWrist  = new Node("leftWrist", 0, 30, limits = [-150, 135])
    var rightElbow = new Node("rightElbow", 90, 30)
    var rightWrist = new Node("rightWrist", 0, 30, limits = [-150, 135])
    var neck       = new Node("neck",0,7)

    leftKnee.AddChildren([leftFoot])
    rightKnee.AddChildren([rightFoot])
    rightElbow.AddChildren([rightWrist])
    leftElbow.AddChildren([leftWrist])
    torso.AddChildren([leftElbow, rightElbow, neck])
    stickman.AddChildren([torso,leftKnee, rightKnee])
    return stickman;
}


function UpdatePose(stickman,newpose){
    /**
     * stickman: object whose pose must be updated
     * newpose: new pose
     */
    var nodeToCompute = Array.from(stickman.children)
    while (nodeToCompute.length > 0) {
        const element = nodeToCompute.shift();
        nodeToCompute = nodeToCompute.concat(element.children);
        element.UpdateJointAngle(newpose[element.name])
        element.ComputePose();
    }
}

function DrawStickMan(stickman) {
    /**
     * stickman: object to be drawn on the canvas.
     * ctx: context containing a canvas
     */
    var nodeToDraw = Array.from(stickman.children)
    while (nodeToDraw.length > 0) {
        const element = nodeToDraw.shift();
        nodeToDraw = nodeToDraw.concat(element.children);
        var path = new paper.Path()
        path.strokeWidth=3
        path.strokeColor="black"
        path.add(new paper.Point(element.parent.endPosg[0],element.parent.endPosg[1]))
        path.add(new paper.Point(element.endPosg[0],element.endPosg[1]))
        if (element.name == "neck") {
            dx  = (element.endPosg[0] - element.parent.endPosg[0])
            dy  = (element.endPosg[1] - element.parent.endPosg[1])
            center = [element.endPosg[0] + dx,element.endPosg[1] + dy]
            var path2 = new paper.Path.Circle(new paper.Point(center[0],center[1]),10)
            path2.strokeWidth=1
            path2.strokeColor="black"
            path2.fillColor="black"
        }else{
            path.onMouseDown = function(event){
                selection = element.name;
                console.log(selection)
            }
        }
    }
}

var canvas = document.getElementById("myCanvas")
var ctx = canvas.getContext("2d");

stickman = NewStickMan()
defaultPose = {
                 "leftKnee": 95,
                 "leftFoot": 10,
                 "rightKnee": 85,
                 "rightFoot": 0,
                 "torso": -90,
                 "leftElbow": -135,
                 "leftWrist": -10,
                 "rightElbow": 135,
                 "rightWrist": 10,
                 "neck": 0
              }
UpdatePose(stickman,defaultPose)
selection = null

window.onload = function () {
    // Get a reference to the canvas object
    var canvas = document.getElementById('myCanvas');
    // Create an empty project and a view for the canvas:
    paper.setup(canvas);
    DrawStickMan(stickman);
}

