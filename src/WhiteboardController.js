import $ from 'jquery';
import Canvas from './view/Canvas';
import * as Realm from './services/Realm';
import {gql} from 'apollo-client-preset';
import WhiteboardPath from "./view/WhiteboardPath";
import throttle from 'lodash/throttle';

let editorCanvas;

$(document).ready(setup);

function handleRemoteUpdate({paths}) {
    editorCanvas.setPaths(paths.map(({color, pathId, polyline}) => new WhiteboardPath(color, polyline, pathId)));
}

async function setup() {
    editorCanvas = new Canvas($('#editor'), true);

    editorCanvas.onNewPath = handlePathDrawn;
    editorCanvas.onPathChange = throttle(handlePathUpdated, 600);
    editorCanvas.onDeletePath = handlePathDeleted;

    $('#btn-clear').click(clearWhiteboard);

    // TODO: Subscribe for updates from Realm so we can get paths from other devices
    await Realm.subscribe(gql`
        
    `, handleRemoteUpdate);

    // TODO: Retrieve the initial paths already drawn on the whiteboard at load time
    const initialQueryResult = await Realm.query(gql`

    `);

    const paths = initialQueryResult.paths.map(({color, polyline, pathId}) => new WhiteboardPath(color, polyline, pathId));

    editorCanvas.setPaths(paths);
}

function handlePathDrawn(newPath) {
    // TODO: Handle an additional path being drawn on the whiteboard by the user
    Realm.update(gql`

    `);
}

function handlePathDeleted(deletedPath) {
    // TODO: Handle a path being deleted by the user
    Realm.update(gql`

    `);
}

function handlePathUpdated(updatedPath) {
    // TODO: Handle an existing path being edited by the user, such as a color change
    Realm.update(gql`

    `);
}

function clearWhiteboard() {
    // TODO: Handle the user clicking the clear button (remove all apths)
    Realm.update(gql`

    `);
}