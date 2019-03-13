import bindFunctionToInstance from 'auto-bind';
import * as Utils from '../Utils';
import WhiteboardPath from "./WhiteboardPath";
import $ from "jquery";
import Picker from 'vanilla-picker';

export default class Canvas {
    constructor(el, editable = false) {
        // Make sure all methods have this class instance as their `this` value
        bindFunctionToInstance(this);

        // Resize canvas to fit current window size
        el[0].width = el.width();
        el[0].height = el.height();

        this.canvas = el;
        this.drawingContext = el[0].getContext('2d');

        // Keeps track of every path currently drawn on this canvas
        this.paths = new Map();
        this.locallyPersistedPaths = new Map();

        // Drawing state - `draftPath` starts as a path with no points; we'll add to it as user drags mouse
        this.draftPath = null;
        this.isDrawing = false;
        this.drawingColor = null;
        this.colorPicker = null;

        // Event handlers
        this.onNewPath = null;
        this.onPathChange = null;
        this.onDeletePath = null;

        this.drawingContext.lineWidth = 8;
        this.drawingContext.lineCap = 'round';

        if (editable) {
            this._setupEditableCanvas();
        }
    }

    setDrawingColor(color) {
        this.drawingColor = color;
        this.drawingContext.strokeStyle = color;
    }

    addOrUpdatePath(path) {
        this.paths.set(path.pathId, path);
        this._render();
    }

    removePath(path) {
        this.paths.delete(path.pathId);
        this._render();
    }

    setPaths(paths) {
        this.paths = new Map(paths.map(p => [p.pathId, p]));
        this.paths.forEach((_, pathId) => {
            this.locallyPersistedPaths.delete(pathId);
        });
        this._render();
    }

    clear() {
        this.drawingContext.clearRect(0, 0, this.canvas.width(), this.canvas.height());
        this.paths = new Map();
        this.locallyPersistedPaths = new Map();
    }

    _render() {
        this.drawingContext.clearRect(0, 0, this.canvas.width(), this.canvas.height());
        for (const p of [...this.paths.values(), ...this.locallyPersistedPaths.values()]) {
            this.drawingContext.beginPath();
            this.drawingContext.strokeStyle = p.color;
            this.drawingContext.stroke(p);
        }
    }

    _setupEditableCanvas() {
        this.canvas.css('cursor', 'crosshair');

        this.canvas.mousedown(this._handleMouseDown);
        this.canvas.mouseup(this._handleMouseUp);
        this.canvas.mousemove(this._handleMouseMove);

        this.setDrawingColor('red');

        this.draftPath = new WhiteboardPath(this.drawingColor);

        this.colorPicker = new Picker({parent: $('#color-picker')[0], popup: false});
        this.colorPicker.onDone = this.colorPicker.hide;
        this.colorPicker.hide();
    }

    _handleMouseDown(e) {
        const {x, y} = Utils.getRelativeCoordinatesOfMouseEvent(e);
        const [_, clickedPath] = Array.from(this.paths).find(([_, p]) => this.drawingContext.isPointInStroke(p, x, y)) || [];

        if (clickedPath) {
            // Left click - change color
            if (e.which === 1) {
                this._changePathColor(clickedPath);
            } else if (e.which === 3) {
                // Right click - delete path
                this._deletePath(clickedPath);
            }
            return;
        }

        this.isDrawing = true;
        this.draftPath = new WhiteboardPath(this.drawingColor);

        this.drawingContext.beginPath();
        this.drawingContext.moveTo(x, y);

        this.draftPath.moveTo(x, y);
    }

    _handleMouseMove(e) {
        if (!this.isDrawing) return;

        const {x, y} = Utils.getRelativeCoordinatesOfMouseEvent(e);

        this.drawingContext.lineTo(x, y);
        this.drawingContext.stroke();

        this.draftPath.lineTo(x, y);
    }

    _handleMouseUp(e) {
        if (!this.isDrawing) return;

        this.isDrawing = false;

        this.locallyPersistedPaths.set(this.draftPath.pathId, this.draftPath);

        if (this.onNewPath) {
            this.onNewPath(this.draftPath);
        }

        this.draftPath = null;
    }

    _changePathColor(path) {
        this.colorPicker.onChange = color => {
            path.color = color.rgbaString;
            this.paths.set(path.pathId, path);
            this._render();
            if (this.onPathChange) {
                this.onPathChange(path);
            }
        };

        this.colorPicker.setColor(path.color, true);
        this.colorPicker.show();

        return true;
    }

    _deletePath(path) {
        this.paths.delete(path.pathId);
        this._render();
        if (this.onDeletePath) {
            this.onDeletePath(path);
        }
    }
}