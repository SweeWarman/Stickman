function Transform(theta,t,x){
    /**
     * Homogeneous transfomration
     * theta: angle [degree]
     * t    : translation vector
     * x    : point
     */
    let ang = theta*Math.PI/180;
    let M = [[Math.cos(ang), -Math.sin(ang), t[0]],
             [Math.sin(ang),  Math.cos(ang), t[1]],
             [0.0,                 0.0,      0.0]]

    let tfvec = [M[0][0]*(x[0]+t[0]) + M[0][1]*(x[1]+t[1]),
                 M[1][0]*(x[0]+t[0]) + M[1][1]*(x[1]+t[1])]

    return tfvec
}

export function angle(X1,X2){
   return (2*Math.PI + Math.atan2(X2[1]-X1[1],X2[0]-X1[0]))%(2*Math.PI)
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

export function GetCurrentPose(node,pose={}){
    if(node.name == "root"){
        pose["posX"] = node.endPosg[0]
        pose["posY"] = node.endPosg[1]
    }
    pose[node.name] = node.angle
    node.children.forEach(element => {
       GetCurrentPose(element,pose);
    })
}


export function NewStickMan() {
    /**
     * Create a new stick man instace
     */
    var stickman   = new Node("root", 0, 0,null,[200,200])
    var leftKnee   = new Node("leftKnee", 90, 50, [-10, 135])
    var leftFoot   = new Node("leftFoot", 0, 50, [0, 135])
    var rightKnee  = new Node("rightKnee", 90, 50, [-10, 135])
    var rightFoot  = new Node("rightFoot", 0, 50,[0, 135])
    var torso      = new Node("torso", -90, 50,[-135, 45])
    var leftElbow  = new Node("leftElbow", -90, 30)
    var leftWrist  = new Node("leftWrist", 0, 30,[-150, 135])
    var rightElbow = new Node("rightElbow", 90, 30)
    var rightWrist = new Node("rightWrist", 0, 30,[-150, 135])
    var neck       = new Node("neck",0,7)

    leftKnee.AddChildren([leftFoot])
    rightKnee.AddChildren([rightFoot])
    rightElbow.AddChildren([rightWrist])
    leftElbow.AddChildren([leftWrist])
    torso.AddChildren([leftElbow, rightElbow, neck])
    stickman.AddChildren([torso,leftKnee, rightKnee])
    return stickman;
}


export function UpdatePose(node,newpose=null){
    if(newpose != null && node.name != "root"){
        node.UpdateJointAngle(newpose[node.name])
    }else if(newpose !=null && node.name == "root"){
        node.endPosg[0] = newpose["posX"]
        node.endPosg[1] = newpose["posY"]
    }
    node.ComputePose();
    node.children.forEach(element => UpdatePose(element,newpose))
}
