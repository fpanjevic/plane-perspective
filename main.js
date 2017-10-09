// The Path.Circle constructor takes a Point(x, y), and a radius
//var myBall = new Path.Circle(new Point(70, 70), 50);
//myBall.fillColor = 'tomato';
 
//console.log("started")

// The Path.Rectangle constructor can take a Point and a Size object
//var point = new Point(20, 150);
//var size = new Size(100, 50);
//var myRectangle = new Path.Rectangle(point, size);
//myRectangle.fillColor = 'powderblue';
 
// The Path.Arc constructor takes 3 points, var names describing the obvious.
//var from = new Point(170, 120);
//var through = new Point(200, 180);
//var to = new Point(170, 220);
//var curvedPath = new Path.Arc(from, through, to);
//curvedPath.strokeColor = 'black';

var EPSILON = 0.00001;

// state machine
var setupAxis = true;
var setupCenter = false;
var setupVanishing = false;
var addLine = false;
var addSegment = false;
var movePoint = false;
var movingPoint = -1;
var moveLine = false;
var movingLine = -1;
var cloneLine = false;

var axisStartPoint = new Point(0, 0);
var axisEndPoint = new Point(0, 0);

var newLineStartPoint = new Point(0, 0);
var newLineEndPoint = new Point(0, 0);

console.log("1");

var canvas = document.getElementById('myCanvas');
var w = canvas.width;
var h = canvas.height; 
console.log(w);
console.log(h);

// draw grid
var gridLines = [];
var GRID_OPACITY = 0.6
DrawGrid();
var gridEnabled = false
var snapToGridEnabled = false
ShowGrid(gridEnabled);

console.log("1.1");

var axisL1 = 0;
var axisL2 = 2.0 / h;
var axisL3 = 1;

console.log("1.2");

var axisLine3 = [axisL1, axisL2, axisL3];
var axisLine3Draw = new Path.Line(new Point(0, 0), new Point(0, 0));

console.log("1.3");

var centerPointHom = [-100, -100, 1];
var centerPointDraw = new Path.Circle(new Point(-100, -100), 3);
centerPointDraw.fillColor = 'tomato';

console.log("2");

var vanishingLine3 = [0, 1, 0]
var vanishingLine3Draw = new Path.Line(new Point(0, 0), new Point(0, 0));

var lines = []
var segments = []
var axisPoints = []
var vanishingPoints = []
var projectionLines = []
var projectionSegments = []

console.log("3")

var axisLabel = new PointText({
			point: new Point(-100, -100),
			content: 'axis',
			fillColor: 'black',
			justification: 'left'
		});
		
var centerLabel = new PointText({
			point: new Point(-100, -100),
			content: 'center',
			fillColor: 'black',
			justification: 'center'
		});
		
var vanishingLabel = new PointText({
			point: new Point(-100, -100),
			content: "vanishing line",
			fillColor: 'black',
			justification: 'left'
		});

console.log("4");

DrawLine3(axisLine3, axisLine3Draw);
DrawLine3(vanishingLine3, vanishingLine3Draw);

axisLine3Draw.strokeCap = 'round';
vanishingLine3Draw.strokeCap = 'round';

console.log("middle");

function onMouseDown(event) {
    console.log("setupAxis: " + setupAxis);
    console.log("setupVanishing: " + setupVanishing);
    console.log("setupCenter: " + setupCenter);
    console.log("addLine: " + addLine);
    console.log("addSegment: " + addSegment);
    console.log("movePoint: " + movePoint);
    console.log("moveLine: " + moveLine);
    
    var snapPoint = event.point
    snapPoint.x = Math.round((event.point.x - 10) / 30.0) * 30.0 + 10
    snapPoint.y = Math.round((event.point.y - 10) / 30.0) * 30.0 + 10

    var mousePoint;
    if (snapToGridEnabled)
    {
        mousePoint = snapPoint
    }
    else
    {
        mousePoint = event.point
    }

    if (setupAxis) {
        axisStartPoint = mousePoint;
    	axisEndPoint = mousePoint

    	axisLine3Draw.segments[0].point = axisStartPoint;
    	axisLine3Draw.segments[1].point = axisEndPoint;
    	
        axisLine3Draw.strokeColor = 'tomato';
        axisLine3Draw.strokeWidth = 1
        axisLine3Draw.dashArray = [5, 3];
        //axisLine3Draw.dashArray = [10, 12];
        
        axisLabel.point = new Point(-100, -100)
        axisLabel.rotation = 0
        axisLabel.point += (new Point(-5, -7)).rotate(axisLabel.rotation)
    }
    else if (setupCenter) {
        centerLabel.point = new Point(-100, -100)
        centerLabel.rotation = 0
        centerLabel.point += (new Point(-7, 0)).rotate(centerLabel.rotation)
    }
    else if (setupVanishing)
    {
        vanishingLine3 = ParallelToLine3AndContainsPointHom(axisLine3, [mousePoint.x, mousePoint.y, 1])
        DrawLine3(vanishingLine3, vanishingLine3Draw);
        
        vanishingLine3Draw.strokeColor = 'tomato';
        vanishingLine3Draw.strokeWidth = 1
        vanishingLine3Draw.dashArray = [1];
        //vanishingLine3Draw.dashArray = [10, 12];
        
        vanishingLabel.point = new Point(-100, -100)
        vanishingLabel.rotation = 0
        vanishingLabel.point += (new Point(-5, -7)).rotate(vanishingLabel.rotation)
    }
    else if (addLine) {
        newLineStartPoint = mousePoint;
    	newLineEndPoint = mousePoint;
    	
    	var newLine3Draw = new Path.Line(newLineStartPoint, newLineEndPoint)
    	newLine3Draw.strokeColor = 'tomato';
    	lines.push(newLine3Draw)
    }
    else if (addSegment) {
        //console.log("add segment mouse down")
        newSegmentStartPoint = mousePoint;
    	newSegmentEndPoint = mousePoint;
    	
    	var newSegment3Draw = new Path.Line(newSegmentStartPoint, newSegmentEndPoint)
    	newSegment3Draw.strokeColor = 'purple';
    	newSegment3Draw.strokeWidth = 2
    	newSegment3Draw.strokeCap = 'round'
    	segments.push(newSegment3Draw)
    }
    else if (movePoint) {
        for (i = 0; i < vanishingPoints.length; i++) {
            if (PointDistance(vanishingPoints[i].position, event.point) < 5) {
                vanishingPoints[i].fillColor = 'blue'
                movingPoint = i;
                break;
            }
        }
    }
    else if (moveLine) {
        for (i = 0; i < lines.length; i++) {
            if (PointLine3Distance(event.point, Line3FromLineDraw(lines[i])) < 5) {
                lines[i].strokeColor = 'blue'
                //console.log("found line " + i)
                movingLine = i;
                break;
            }
        }
    }
    else if (cloneLine)
    {
        for (i = 0; i < lines.length; i++) 
        {
            if (PointLine3Distance(event.point, Line3FromLineDraw(lines[i])) < 5) 
            {
                console.log("found line " + i)
                console.log("total lines " + lines.length)
                var v = new Path.Circle(vanishingPoints[i].position, 3);
                v.fillColor = 'tomato'
                vanishingPoints.push(v)
                
                var l = new Path.Circle(axisPoints[i].position, 3)
                l.fillColor = 'tomato'
                axisPoints.push(l)
                
                var p = new Path.Line(lines[i].segments[0].point, lines[i].segments[1].point)
                p.strokeColor = lines[i].strokeColor
                p.dashArray = lines[i].dashArray
                lines.push(p)
                
                var pp = new Path.Line(projectionLines[i].segments[0].point, projectionLines[i].segments[1].point)
                pp.strokeColor = projectionLines[i].strokeColor
                pp.dashArray = projectionLines[i].dashArray
                projectionLines.push(pp)
                
                cloneLine = false   
                break;
            }
        }
    }
}

function onMouseDrag(event)
{
    var snapPoint = event.point
    snapPoint.x = Math.round((event.point.x - 10) / 30.0) * 30.0 + 10
    snapPoint.y = Math.round((event.point.y - 10) / 30.0) * 30.0 + 10

    var mousePoint;
    if (snapToGridEnabled)
    {
        mousePoint = snapPoint
    }
    else
    {
        mousePoint = event.point
    }

    if (setupAxis)
    {
        //straightLine.segments[0].point = startPoint;
        //axisEndPoint = event.point;
        axisEndPoint = mousePoint;
        
        //axisLine3 = ComputeLine3(axisStartPoint, axisEndPoint)
        //DrawLine3(axisLine3, axisLine3Draw)
    
        if ((axisStartPoint - axisEndPoint).length > 20)
        {
            axisLabel.point = (axisEndPoint + axisStartPoint) / 2.0
            axisLabel.rotation = (axisEndPoint - axisStartPoint).angle
            axisLabel.point += (new Point(-5, -7)).rotate(axisLabel.rotation)
        }
        else
        {
            axisLabel.point = new Point(-100, -100)
        }
        
        axisLine3Draw.segments[0].point = axisStartPoint;
        axisLine3Draw.segments[1].point = axisEndPoint;
    }
    else if (setupCenter) {
        centerPointHom[0] = mousePoint.x
        centerPointHom[1] = mousePoint.y
        
        centerPointDraw.position.x = mousePoint.x
        centerPointDraw.position.y = mousePoint.y
        
        centerLabel.point = centerPointDraw.position + new Point(0, -7)
    }
    else if (setupVanishing) {
        vanishingLine3 = ParallelToLine3AndContainsPointHom(axisLine3, [mousePoint.x, mousePoint.y, 1])
        DrawLine3(vanishingLine3, vanishingLine3Draw);
        
        vanishingLine3Draw.strokeColor = 'tomato';
        vanishingLine3Draw.strokeWidth = 1
        //vanishingLine3Draw.dashArray = [10, 12];
        vanishingLine3Draw.dashArray = [1]
        
        vanishingLabel.point = mousePoint
        vanishingLabel.rotation = axisLabel.rotation
        vanishingLabel.point += (new Point(-5, -7)).rotate(vanishingLabel.rotation)
    }
    else if (addLine) {
        newLineEndPoint = mousePoint
        lines[lines.length - 1].segments[0].point = newLineStartPoint;
        lines[lines.length - 1].segments[1].point = newLineEndPoint;
    }
    else if (addSegment) {
        newSegmentEndPoint = mousePoint
        segments[segments.length - 1].segments[0].point = newSegmentStartPoint;
        segments[segments.length - 1].segments[1].point = newSegmentEndPoint;
    }
    else if (movePoint && movingPoint != -1) {
        var pointHom = ClosestPointHomOnLine(vanishingLine3, mousePoint)
        vanishingPoints[movingPoint].position.x = pointHom[0] / pointHom[2]
        vanishingPoints[movingPoint].position.y = pointHom[1] / pointHom[2]
        ComputeLinesFromPoints()
    }
    else if (moveLine && movingLine != -1) {
        // compute line3 from line3
        var line3 = Line3FromLineDraw(lines[movingLine])
        var newLine3 = ParallelToLine3AndContainsPointHom(line3, Hom(mousePoint))

        DrawLine3(newLine3, lines[movingLine])
        ComputePointsFromLines()
    }
}

function onMouseUp(event) {
    var snapPoint = event.point
    snapPoint.x = Math.round((event.point.x - 10) / 30.0) * 30.0 + 10
    snapPoint.y = Math.round((event.point.y - 10) / 30.0) * 30.0 + 10

    var mousePoint;
    if (snapToGridEnabled)
    {
        mousePoint = snapPoint
    }
    else
    {
        mousePoint = event.point
    }

    if (setupAxis) {
        
        //straightLine.segments[0].point = startPoint;
        axisEndPoint = snapPoint
        
        if (axisEndPoint == axisStartPoint) {
            axisEndPoint.x += 10
        }
        
        axisLine3 = Line3ContainsPoints(axisStartPoint, axisEndPoint)
        DrawLine3(axisLine3, axisLine3Draw)
        
        axisLine3Draw.strokeColor = 'tomato';
        axisLine3Draw.strokeWidth = 1
        axisLine3Draw.dashArray = [1];
        
        axisLabel.point = (axisEndPoint + axisStartPoint) / 2.0
        axisLabel.rotation = (axisEndPoint - axisStartPoint).angle
        axisLabel.point += (new Point(-5, -7)).rotate(axisLabel.rotation)
        
        setupAxis = false
        setupCenter = true
    }
    else if (setupCenter) {
        centerPointHom[0] = mousePoint.x
        centerPointHom[1] = mousePoint.y
        
        centerPointDraw.position.x = mousePoint.x
        centerPointDraw.position.y = mousePoint.y
        
        centerPointDraw.fillColor = 'tomato'
        
        centerLabel.point = centerPointDraw.position + new Point(0, -7)
        
        setupCenter = false
        setupVanishing = true
    }
    else if (setupVanishing) {
        vanishingLine3 = ParallelToLine3AndContainsPointHom(axisLine3, [mousePoint.x, mousePoint.y, 1])
        //console.log(vanishingLine3)
        DrawLine3(vanishingLine3, vanishingLine3Draw);
        
        vanishingLine3Draw.strokeColor = 'tomato';
        vanishingLine3Draw.strokeWidth = 1
        vanishingLine3Draw.dashArray = [1];

        vanishingLabel.point = mousePoint
        vanishingLabel.rotation = axisLabel.rotation
        vanishingLabel.point += (new Point(-5, -7)).rotate(vanishingLabel.rotation)
        
        setupAxis = false
        setupVanishing = false
        addLine = false
    }
    else if (addLine) {
        newLineEndPoint = mousePoint
        var ln = Line3ContainsPoints(newLineStartPoint, newLineEndPoint)
        DrawLine3(ln, lines[lines.length - 1]);
        
        var pa = Line3Line3Intersection(ln, axisLine3)
        var ca = new Path.Circle(new Point(pa[0] / pa[2], pa[1] / pa[2]), 3);
        ca.fillColor = 'tomato'
        axisPoints.push(ca);
        
        var pv = Line3Line3Intersection(ln, vanishingLine3)
        var cv = new Path.Circle(new Point(pv[0] / pv[2], pv[1] / pv[2]), 3);
        cv.fillColor = 'tomato'
        vanishingPoints.push(cv);
        
        var ov = Line3ContainsPointsHom(centerPointHom, pv)
        var projectionLine3 = ParallelToLine3AndContainsPointHom(ov, pa)
        
        var projectionLine3Draw = new Path.Line(new Point(0, 0), new Point(0, 0))
        DrawLine3(projectionLine3, projectionLine3Draw)
        projectionLine3Draw.strokeColor = 'tomato';
        projectionLine3Draw.dashArray = [5, 3];
        projectionLines.push(projectionLine3Draw)
        
        addLine = false;
        //movePoint = true
    }
    else if (addSegment) {
        newSegmentEndPoint = mousePoint
        segments[segments.length - 1].segments[1].point = newSegmentEndPoint;
        
        var p1 = ProjectPoint(newSegmentStartPoint)
        var p2 = ProjectPoint(newSegmentEndPoint)
        var projectionSegment3Draw = new Path.Line(new Point(p1[0] / p1[2], p1[1] / p1[2]), new Point(p2[0] / p2[2], p2[1] / p2[2]))
        projectionSegment3Draw.strokeColor = 'purple';
        projectionSegment3Draw.dashArray = [5, 3];
        projectionSegment3Draw.strokeWidth = 2
        projectionSegment3Draw.strokeCap = 'round'
        projectionSegments.push(projectionSegment3Draw)
        
        addSegment = false
    }
    else if (movePoint && movingPoint != -1) {
        var pointHom = ClosestPointHomOnLine(vanishingLine3, mousePoint)
        vanishingPoints[movingPoint].position.x = pointHom[0] / pointHom[2]
        vanishingPoints[movingPoint].position.y = pointHom[1] / pointHom[2]
        ComputeLinesFromPoints()
        
        vanishingPoints[movingPoint].fillColor = 'tomato'
        
        movingPoint = -1
        movePoint = false
    } 
    else if (moveLine && movingLine != -1) {
        lines[movingLine].strokeColor = 'tomato'
        movingLine = -1
        moveLine = false
    }
}

function onKeyDown(event) {
    movePoint = false
    addLine = false
    addSegment = false
    moveLine = false
    cloneLine = false

	if (event.key == 'm') {
	    movePoint = true
	    addLine = false
	    addSegment = false
	    moveLine = false
	}
	else if (event.key == 'l') {
	    addLine = true
	}
	else if (event.key == 's') {
	    addSegment = true
	}
	else if (event.key == 'p') {
	    moveLine = true
	}
    else if (event.key == 'c') {
        cloneLine = true
    }
    else if (event.key == 'g')
    {
        if (!gridEnabled)
        {
            gridEnabled = true;
        }
        else if (gridEnabled)
        {
            if (!snapToGridEnabled)
            {
                snapToGridEnabled = true
            }
            else
            {
                snapToGridEnabled = false
                gridEnabled = false
            }
        }

        ShowGrid(gridEnabled)
    }
}

function DrawLine3(line3, line3Draw) {
    if (Math.abs(line3[1]) > Math.abs(line3[0])) {
        // find y when x = 0
        yLeft = -line3[2] / line3[1]
        // find y when x = w
        yRight = -(line3[0] * w + line3[2]) / line3[1]
        
        line3Draw.segments[0].point.x = 0;
        line3Draw.segments[0].point.y = yLeft;
        line3Draw.segments[1].point.x = w;
        line3Draw.segments[1].point.y = yRight;
    }
    else {
        // find x when y = 0
        xTop = -line3[2] / line3[0]
        // find x when y = h
        xBottom = -(line3[1] * h + line3[2]) / line3[0]
        
        line3Draw.segments[0].point.x = xTop;
        line3Draw.segments[0].point.y = 0;
        line3Draw.segments[1].point.x = xBottom;
        line3Draw.segments[1].point.y = h;
    }
}

function ParallelToLine3AndContainsPointHom(line3, pointHom) {
    if (Math.abs(line3[0]) > Math.abs(line3[1])) {
        if (Math.abs(pointHom[0] + pointHom[1] * line3[1] / line3[0]) < EPSILON) {
            //console.log("parallel problem")
        }
        var v1 = -pointHom[2] / (pointHom[0] + pointHom[1] * line3[1] / line3[0])
        var v2 = v1 * line3[1] / line3[0]
        return [v1, v2, 1.0]
    }
    else {
        var v2 = -pointHom[2] / (pointHom[1] + line3[0] / line3[1] * pointHom[0])
        var v1 = v2 * line3[0] / line3[1]
        return [v1, v2, 1.0]
    }
}

function Line3Line3Intersection(a, b) {
    var y = (b[0] * a[2] - b[2] * a[0]) / (a[0] * b[1] - b[0] * a[1]) 
    var x = -(a[1] * y + a[2]) / a[0];
    
    return [x, y, 1]
}

function Line3ContainsPoints(pointA, pointB) {
    var pa = [pointA.x, pointA.y, 1.0]
    var pb = [pointB.x, pointB.y, 1.0]
    return Line3ContainsPointsHom(pa, pb)
}

function Line3ContainsPointsHom(pointA, pointB) {
    var ax = pointA[0] / pointA[2]
    var ay = pointA[1] / pointA[2]
    var bx = pointB[0] / pointB[2]
    var by = pointB[1] / pointB[2]
    if (Math.abs(ay * bx - ax * by) > EPSILON) {
        //var l2 = (ax - bx) / (ay * bx - ax * by)
        //var l1 = -(ay * l2 + 1.0) / ax
        //var l3 = 1
        if (Math.abs(ay) > Math.abs(ax)) {
            var l1 = (by - ay) / (bx * ay - ax * by)
            var l2 = -(l1 * ax + 1.0) / ay
            var l3 = 1.0
        
            return [l1, l2, l3]
        }
        else {
            var l2 = (bx - ax) / (ax * by - bx * ay)
            var l1 = -(l2 * ay + 1.0) / ax
            var l3 = 1.0
        
            return [l1, l2, l3]
        }
    }
    else {
        //console.log('line denominator')    
    }
}

function Line3FromLineDraw(lineDraw) {
    //console.log("linedraw: " + lineDraw.segments[0].point)
    //console.log("linedraw: " + lineDraw.segments[1].point)
    return Line3ContainsPoints(lineDraw.segments[0].point, lineDraw.segments[1].point)
}

function Hom(point) {
    return [point.x, point.y, 1]
}

function PointDistance(a, b) {
    var dx = a.x - b.x
    var dy = a.y - b.y
    return Math.sqrt(dx * dx + dy * dy)
}

function ClosestPointHomOnLine(line3, point) {
    var pointHom = Hom(point)
    var l1 = line3[0]
    var l2 = line3[1]
    var l3 = line3[2]
    var m = l1 * pointHom[0] + l2 * pointHom[1] + l3 * pointHom[2]
    var ls = l1 * l1 + l2 * l2
    var d1 = l1 * (m) / ls
    var d2 = l2 * (m) / ls
    
    var t = l1 * d1 + l2 * d2 + l3
    var t2 = l1 * (pointHom[0] - d1) + l2 * (pointHom[1] - d2) + l3 * (pointHom[2] - 0.0)
    return [pointHom[0] - d1, pointHom[1] - d2, 1.0]
}

function PointLine3Distance(point, line3) {
    var pointHom = Hom(point)
    var l1 = line3[0]
    var l2 = line3[1]
    var l3 = line3[2]
    var m = l1 * pointHom[0] + l2 * pointHom[1] + l3 * pointHom[2]
    var ls = l1 * l1 + l2 * l2
    
    var d = m / Math.sqrt(ls) 
    
    //console.log("pointHom: " + pointHom)
    //console.log("l3: " + line3)
    //console.log("pl distance:" + d)
    
    return Math.abs(d)
}

function ProjectPoint(point) {
    ////console.log("ProjectPoint")
    
    var G = Hom(point)
    ////console.log("G: " + G)
    var V = ClosestPointHomOnLine(vanishingLine3, point)
    ////console.log("V: " + V)
    var VG = Line3ContainsPointsHom(G, V)
    ////console.log("VG: " + VG)
    var L = Line3Line3Intersection(VG, axisLine3)
    ////console.log("L: " + L)
    var OV = Line3ContainsPointsHom(centerPointHom, V)
    ////console.log("OV: " + OV)
    var OG = Line3ContainsPointsHom(centerPointHom, G)
    ////console.log("OG: " + OG)
    var pprime = ParallelToLine3AndContainsPointHom(OV, L)
    ////console.log("pprime: " + pprime)
    var Gprime = Line3Line3Intersection(OG, pprime)
    ////console.log("Gprime: " + Gprime)
    return Gprime
}

/**
 * GLOBAL MODIFICATION AREA
 * 
 * Following methods perform global state updates based on 
 * changes in element positions, likely coming from user input
 */

function ComputeLinesFromPoints() {
    for (i = 0; i < lines.length; i++) {
        // recompute line
        var v = Hom(vanishingPoints[i].position)
        var l = Hom(axisPoints[i].position)
        var p = Line3ContainsPointsHom(l, v)
        
        DrawLine3(p, lines[i])
        
        // recompute line projection
        var pa = Line3Line3Intersection(p, axisLine3)
        var pv = Line3Line3Intersection(p, vanishingLine3)
        
        var ov = Line3ContainsPointsHom(centerPointHom, pv)
        var projectionLine3 = ParallelToLine3AndContainsPointHom(ov, pa)
        
        DrawLine3(projectionLine3, projectionLines[i])
    }
}

function ComputePointsFromLines() {
    for (i = 0; i < lines.length; i++)
    {
        // compute line3 from lineDraw
        var p = Line3FromLineDraw(lines[i])
        
        var v = Line3Line3Intersection(p, vanishingLine3)
        var l = Line3Line3Intersection(p, axisLine3)
        
        vanishingPoints[i].position.x = v[0] / v[2]
        vanishingPoints[i].position.y = v[1] / v[2]
        axisPoints[i].position.x = l[0] / l[2]
        axisPoints[i].position.y = l[1] / l[2]
        
        // recompute line projection
        var ov = Line3ContainsPointsHom(centerPointHom, v)
        var projectionLine3 = ParallelToLine3AndContainsPointHom(ov, l)
        
        DrawLine3(projectionLine3, projectionLines[i])
    }
}

function DrawGrid()
{
    for (x = 10; x < w; x += 30)
    {
        var gridLine = new Path.Line(new Point(x, 0), new Point(x, h));
        gridLine.strokeColor = 'powderblue';    
        gridLine.strokeWidth = 1.0;
        gridLines.push(gridLine);
    }
    for (y = 10; y < h; y += 30)
    {
        var gridLine = new Path.Line(new Point(0, y), new Point(w, y));
        gridLine.strokeColor = 'powderblue';    
        gridLine.strokeWidth = 1.0;
        gridLines.push(gridLine);
    }
}

function ShowGrid(showGrid)
{
    for (var i = 0; i < gridLines.length; i++)
    {
        if (showGrid)
        {
            gridLines[i].opacity = GRID_OPACITY
        }
        else
        {
            gridLines[i].opacity = 0.0;
        }
    }
}