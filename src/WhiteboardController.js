import $ from 'jquery';
import Canvas from './view/Canvas';
import * as Realm from './services/Realm';
import {gql} from 'apollo-client-preset';
import WhiteboardPath from "./view/WhiteboardPath";
import throttle from 'lodash/throttle';

let editorCanvas, colorPicker;

$(document).ready(setup);

async function setup() {
    editorCanvas = new Canvas($('#editor'), true);

    editorCanvas.onNewPath = handlePathDrawn;
    editorCanvas.onPathChange = throttle(handlePathUpdated, 600);
    editorCanvas.onDeletePath = handlePathDeleted;

    $('#btn-clear').click(clearWhiteboard);

    await Realm.subscribe(gql`
        subscription {
            paths {
                pathId
                color
                polyline
            }
        }
    `, handleRemoteUpdate);

    const result = await Realm.query(gql`
        query {
            paths {
                pathId
                color
                polyline
            }
        }
    `);

    const paths = result.paths.map(({color, polyline, pathId}) => new WhiteboardPath(color, polyline, pathId));

    editorCanvas.setPaths(paths);
}

function handlePathDrawn(newPath) {
    Realm.update(gql`
        mutation {
            addPath(input: {
                pathId: "${newPath.pathId}"
                color: "${newPath.color}"
                polyline: "${newPath.polyline}"
            }) {
                color
                polyline
                pathId
            }
        }
    `);
}

function handlePathDeleted(deletedPath) {
    Realm.update(gql`
        mutation {
            deletePath(pathId: "${deletedPath.pathId}")
        }
    `);
}

function handlePathUpdated(updatedPath) {
    Realm.update(gql`
        mutation {
            updatePath(input: {
                pathId: "${updatedPath.pathId}"
                color: "${updatedPath.color}"
                polyline: "${updatedPath.polyline}"
            }) {
                pathId
            }
        }
    `);
}

function handleRemoteUpdate({paths}) {
    editorCanvas.setPaths(paths.map(({color, pathId, polyline}) => new WhiteboardPath(color, polyline, pathId)));
}

function clearWhiteboard() {
    Realm.update(gql`
        mutation {
            deletePaths
        }
    `);
}