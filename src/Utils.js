import $ from 'jquery';

export const getRelativeCoordinatesOfMouseEvent = e => {
    const offset = $(e.target).offset();
    return {
        x: e.pageX - offset.left,
        y: e.pageY - offset.top,
    };
};