import Polyline from '@mapbox/polyline';
import NanoId from 'nanoid';

export default class WhiteboardPath extends Path2D {
    constructor(color, polylineString, pathId) {
        super();

        this.color = color;
        this.pathId = pathId || NanoId();
        this.points = [];

        if (polylineString) {
            const points = Polyline.decode(polylineString);

            // First point is the start of the path
            const [startX, startY] = points[0];
            this.moveTo(startX, startY);

            for (const [x, y] of points.slice(1)) {
                this.lineTo(x, y);
            }
        }
    }

    moveTo(x, y) {
        super.moveTo(x, y);
        this.points.push([x, y]);
    }

    lineTo(x, y) {
        super.lineTo(x, y);
        this.points.push([x, y]);
    }

    get polyline() {
        return Polyline.encode(this.points);
    }
}