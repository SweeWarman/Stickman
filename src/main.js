
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

    tfvec = [M[0][0]*x[0] + M[0][1]*x[1] + t[0],
             M[1][0]*x[0] + M[1][1]*x[1] + t[1]]

    return tfvec
}


class StickMan{
    constructor(){
        this.pos = [0,0]
        this.jointAngles = {}
    }

    ComputePose(pos,jntAngles){
        this.pos = pos
        this.jointAngles = jntAngles
        // Left leg
        var leftKnee   = [0,50]
        var leftFoot   = [0,50]
        // Right leg
        var rightKnee  = [0,50]
        var rightFoot  = [0,50]

        // Torso
        var torso      = [0,-60]

        // Left arm
        var leftElbow  = [-40,0]
        var leftWrist  = [-35,0]

        // Right arm
        var rightElbow  = [40,0]
        var rightWrist  = [35,0]

        var neck = [0,-10]

        // Global position of left knee
        var x1a       = Transform(this.jointAngles['leftKnee'],[0,0],leftKnee)
        var gLeftKnee = Transform(0.0,this.pos,x1a)

        // Global position of left foot
        var x2a       = Transform(this.jointAngles['leftFoot'],[0,0],leftFoot)
        var x2b       = Transform(this.jointAngles['leftKnee'],x1a,x2a)
        var gLeftFoot = Transform(0.0,this.pos,x2b)

        // Global position of right knee
        var x3a        = Transform(this.jointAngles['rightKnee'],[0,0],rightKnee)
        var gRightKnee = Transform(0.0,this.pos,x3a)

        // Global position of right foot
        var x4a        = Transform(this.jointAngles['rightFoot'],[0,0],rightFoot)
        var x4b        = Transform(this.jointAngles['rightKnee'],x3a,x4a)
        var gRightFoot = Transform(0.0,this.pos,x4b)

        
        // Global position of torso
        var x5a        = Transform(this.jointAngles['torso'],[0,0],torso)
        var gTorso     = Transform(0.0,this.pos,x5a)

        // Global position of left elbow
        var x6a        = Transform(this.jointAngles["leftElbow"],[0,0],leftElbow)
        var x6b        = Transform(this.jointAngles["torso"],x5a,x6a)
        var gLeftElbow = Transform(0.0,this.pos,x6b)

        // Global position of left wrist
        var x8a         = Transform(this.jointAngles["leftWrist"],[0,0],leftWrist)
        var x8b         = Transform(this.jointAngles["leftElbow"],x6a,x8a)
        var x8c         = Transform(this.jointAngles["torso"],x5a,x8b)
        var gLeftWrist  = Transform(0.0,this.pos,x8c)


        // Global position of right elbow
        var x7a         = Transform(this.jointAngles["rightElbow"],[0,0],rightElbow)
        var x7b         = Transform(this.jointAngles["torso"],x5a,x7a)
        var gRightElbow = Transform(0.0,this.pos,x7b)

        
        // Global position of right wrist
        var x9a         = Transform(this.jointAngles["rightWrist"],[0,0],rightWrist)
        var x9b         = Transform(this.jointAngles["rightElbow"],x7a,x9a)
        var x9c         = Transform(this.jointAngles["torso"],x5a,x9b)
        var gRightWrist = Transform(0.0,this.pos,x9c)

        // Global position of neck
        var x10a        = Transform(0,[0,0],neck)
        var x10b        = Transform(this.jointAngles["torso"],x5a,x10a)
        var gNeck       = Transform(0.0,this.pos,x10b)

        return {"pos":pos,
                "leftFoot":gLeftFoot,
                "rightFoot": gRightFoot,
                "leftKnee": gLeftKnee,
                "rightKnee": gRightKnee,
                "torso": gTorso,
                "leftElbow": gLeftElbow,
                "rightElbow": gRightElbow,
                "leftWrist": gLeftWrist,
                "rightWrist": gRightWrist,
                "neck":gNeck,
                "neckAngle":this.jointAngles["torso"]}
    }
}

function DrawFigure(pose) {

    ctx.lineWidth=3
    ctx.beginPath();
    ctx.moveTo(pose["pos"][0], pose["pos"][1]);
    ctx.lineTo(pose["leftKnee"][0], pose["leftKnee"][1]);
    ctx.lineTo(pose["leftFoot"][0], pose["leftFoot"][1]);
    ctx.moveTo(pose["pos"][0], pose["pos"][1]);
    ctx.lineTo(pose["rightKnee"][0], pose["rightKnee"][1]);
    ctx.lineTo(pose["rightFoot"][0], pose["rightFoot"][1]);
    ctx.moveTo(pose["pos"][0], pose["pos"][1]);
    ctx.lineTo(pose["torso"][0], pose["torso"][1]);
    ctx.moveTo(pose["torso"][0], pose["torso"][1]);
    ctx.lineTo(pose["leftElbow"][0], pose["leftElbow"][1]);
    ctx.lineTo(pose["leftWrist"][0], pose["leftWrist"][1]);
    ctx.moveTo(pose["torso"][0], pose["torso"][1]);
    ctx.lineTo(pose["rightElbow"][0], pose["rightElbow"][1]);
    ctx.lineTo(pose["rightWrist"][0], pose["rightWrist"][1]);
    ctx.moveTo(pose["torso"][0], pose["torso"][1]);
    ctx.lineTo(pose["neck"][0], pose["neck"][1]);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(pose["torso"][0], pose["torso"][1]);
    dx = (pose["neck"][0] - pose["torso"][0])
    dy = (pose["neck"][1] - pose["torso"][1])
    ang = pose["neckAngle"]*Math.PI/180
    ctx.arc(pose["neck"][0]+dx,pose["neck"][1]+dy,10,ang+Math.PI/2,ang + Math.PI/2 +Math.PI*2)
    ctx.stroke()

}

var canvas = document.getElementById("myCanvas")
var ctx = canvas.getContext("2d");

var fig = new StickMan()
var pose = fig.ComputePose([200,200],{
    "leftFoot": 10,
    "leftKnee": 10,
    "rightFoot": 10,
    "rightKnee": -20,
    "torso": 30,
    "leftElbow":10,
    "rightElbow":-20,
    "leftWrist": 10,
    "rightWrist": -20
})
DrawFigure(pose)
