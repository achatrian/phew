import actions from './actions'
import mutations from './mutations'
import getters from './getters'

const testTemplateItem = JSON.parse('{"name":"lala.json","ext":".json","path":"lala.json"}')

const state = {
    availableTemplates: [testTemplateItem],
    templateName: '',
    currentTemplate: {},
    testTemplate: JSON.parse('{"topGlyph":{"name":"main","children":[]},"glyphParameters":{"main":{"backend":"paper","strokeColor":"#78909C","primaryColor":"#00897B","secondaryColor":"#F50057","lightColor":"#E1F5FE","darkColor":"#880E4F","strokeWidth":1,"thickPathSize":6,"narrowPathSize":3,"numSides":6,"numPoints":150,"spikeHeight":0.3,"meshType":"grid","spikeSize":0.4,"decorationSize":5,"decorationType":"circle","protrusionProportion":0.15,"protrusionBackgroundColor":"#F5F5F5","protrusionStrokeColor":"#212121","islandsType":"circle","islandsSize":10,"maxNumIslands":40}},"glyphBoxes":[{"drawingBounds":{"width":178.25,"height":178.25,"left":53.625,"top":57.074999999999996,"x":53.625,"y":57.074999999999996,"generator":{"type":"grid","id":"x-offset: 178.75; y-offset: 190.25; width: 178.25; height: 178.25"}},"drawingCenter":{"x":142.75,"y":146.2},"bounds":{"width":72.91900906069262,"height":142.16549299312817,"left":106.29049546965369,"top":89.31073941580695,"x":106.29049546965369,"y":89.31073941580695,"generator":{"type":"grid","id":"x-offset: 178.75; y-offset: 190.25; width: 178.25; height: 178.25"}},"center":{"x":142.75,"y":160.39348591237103},"shapePositions":{"leftShift":0.29545860011025915,"topShift":0.18084566292177814,"widthProportion":0.40908279977948175,"heightProportion":0.7975623730329772}}],"elementFeatureBindings":[{"element":"Height","field":"Length","shape":"main"},{"element":"Width","field":"Width","shape":"main"},{"element":"Membrane","field":"Nuc Width","shape":"main"},{"element":"Decoration","field":"Ruffliness","shape":"main"},{"element":"Protrusion","field":"Protrusions","shape":"main"},{"element":"Islands","field":"NF","shape":"main"},{"element":"Spikes","field":"Nuc Text","shape":"main"}],"shapes":{}}')
}

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
}