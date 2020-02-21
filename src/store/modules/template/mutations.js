

export default {
    updateTemplateName: (state, templateName) => state.templateName = templateName,

    updateOriginalFileName: (state, originalFileName) => {
        const newCurrentTemplate = Object.assign(
            {originalFileName: originalFileName},
            state.currentTemplate
        )
        state.currentTemplate = newCurrentTemplate
    },

    updateGlyphInformation: (state, glyphs) => {
        const glyph = glyphs[0]
        if (typeof glyph !== 'undefined') {
            const newCurrentTemplate = Object.assign({}, state.currentTemplate)
            // UPDATE GLYPH HIERARCHY
            // store information about the glyph hierarchy
            // only one level deep hierarchy allowed
            const topGlyph = {
                name: glyph.name,
                type: glyph.type,
                children: []
            }
            for (let childGlyph of glyph.children) {
                topGlyph.children.push({
                    name: childGlyph.name,
                    type: childGlyph.type,
                    children: []
                })
            }
            newCurrentTemplate.topGlyph = topGlyph

            // UPDATE GLYPH PARAMETERS
            // store glyph parameters
            // TODO ensure that glyph parameters are updated in glyphs when modified in VizProps
            const glyphParameters = {}
            for (let glyph_ of glyph.iter()) {
                glyphParameters[glyph_.name] = glyph_.parameters
            }
            newCurrentTemplate.glyphParameters = glyphParameters

            // UPDATE GLYPH POSITIONS
            const glyphsBoxes = []
            for (let glyph_ of glyphs) {
                let boxesPerGlyph = {_id: glyph_.id}  // save id so that glyph box can be matched with correct glyph
                for (let childGlyph of glyph_.iter()) {
                    boxesPerGlyph[childGlyph.name] = {
                        drawingBounds: glyph_.box.drawingBounds,
                        drawingCenter: glyph_.box.drawingCenter,
                        bounds: glyph_.box.bounds,
                        center: glyph_.box.center,
                        shapePositions: glyph_.box.shapePositions,
                        history: glyph_.box.history,
                        maxHistLength: glyph_.box.maxHistLength,
                        applyTransformsFlag: glyph_.box.applyTransformsFlag
                    }
                }
                glyphsBoxes.push(boxesPerGlyph)
            }
            newCurrentTemplate.glyphBoxes = glyphsBoxes  // FIXME change attribute or name
            state.currentTemplate = newCurrentTemplate
        }
    },

    updateElementFeatureBindings: (state, bindings) => {
        const newCurrentTemplate = Object.assign({}, state.currentTemplate)
        newCurrentTemplate.elementFeatureBindings = bindings
        state.currentTemplate = newCurrentTemplate
    },

    updateShapes: (state, shapeJSONStore) => {
        // UPDATE SHAPE DESCRIPTIONS
        const newCurrentTemplate = Object.assign({}, state.currentTemplate)
        newCurrentTemplate.shapes = Array.from(shapeJSONStore).reduce((obj, [key, value]) => (
            Object.assign(obj, { [key]: value }) // Be careful! Maps can have non-String keys; object literals can't.
        ), {});
        state.currentTemplate = newCurrentTemplate
    },

    updateShapeAssignment: (state, varShapeAssignment) => {
        // UPDATE SHAPE ASSIGNMENT TO CATEGORICAL VARIABLES
        const newCurrentTemplate = Object.assign({}, state.currentTemplate)
        newCurrentTemplate.shapeAssignment = varShapeAssignment
    },

    updateDisplayOptions: (state, options) => {
        const {displayOrderField, numDisplayedGlyphs, boundingRectSizeFactor, currentPage} = options
        const newCurrentTemplate = Object.assign({
            displayOrderField: displayOrderField,
            numDisplayedGlyphs: numDisplayedGlyphs,
            boundingRectSizeFactor: boundingRectSizeFactor,
            currentPage: currentPage
        }, state.currentTemplate)
        state.currentTemplate = newCurrentTemplate
    },

    setAvailableTemplates: (state, availableTemplates) => {
        state.availableTemplates = availableTemplates
    },

    setCurrentTemplate: (state, newTemplate) => state.currentTemplate = newTemplate
}