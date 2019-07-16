/* author: Andrea Chatrian
General Template class that can be used to create glyph instances.
Glyph itself is made of paths in paperjs or other framework.
BaseGlyph and its subclasses are stateless, if not for the references to the paper.js paths (interface model ?)
and references to parent / children glyphs.
*/

import paper from 'paper'
// import store from '../store/index'

class BaseGlyph {
  static baseOptions () {
    return {
      backend: 'paper',
      strokeColor: '#78909C',
      primaryColor: '#00897B',
      secondaryColor: '#F50057',
      lightColor: '#E1F5FE',
      darkColor: '#880E4F',
      strokeWidth: 1,
      thickPathSize: 6,
      narrowPathSize: 3
    }
  }
  parameters = {} // stores the drawing parameters for the glyph
  constructor (
    layer, // paperjs layer where glyph path will be drawn
    id,
    name = '', // name to select / find glyph
    options = BaseGlyph.baseOptions(),
    parent = null) {
    // add options as object
    for (let pathName in options) {
      this.parameters[pathName] = options[pathName]
    }
    this.layer = layer
    this.id = id
    if (name) {
      this.name = name
    } else if (parent === null) {
      this.name = this.constructor.shapes.main // if this is not a child glyph take main name
    } else {
      this.name = this.children[this.parent.children.length] || '' // else take name of nth child
    }
    if (parent !== null && parent.layer !== this.layer) {
      throw Error(`Child ${this.name}'s layer (${this.layer}) differs from parent ${parent.name}'s layer (${parent.layer}`)
    }
    this.parent = parent
    // create main group where to store shape paths:
    paper.project.layers[this.layer].activate()
    this.group = new paper.Group([])
  }
  glyphElements = BaseGlyph.elements // names of available elements for this type of glyph
  drawn = false // flag to check if draw() has been called
  pathIds = {}
  drawnPaths = new Set()

  // height and width don't have any visual properties that can be tweaked by the user
  children = [] // array storing children glyphs
  box = {
    canvasRect: { top: 0, bottom: 0, left: 0, right: 0 },
    bounds: { top: 0, bottom: 0, left: 0, right: 0 },
    center: { x: 0, y: 0 },
    shapePositions: {}
  }

  static get type () {
    return 'BaseGlyph'
  }

  static get settings () {
    return {name: '', message: '', options: []}
  }

  static get shapes () {
    return { main: 'main', children: [] }
  }

  static get elements () {
    return [
      {name: 'Height', type: 'scale', properties: [], target: 'main', subElements: []},
      {name: 'Width', type: 'scale', properties: [], target: 'main', subElements: []}
    ] // not inherited by children
  }

  activateLayer () { paper.project.layers[this.layer].activate() }

  getDrawingBox (options) { // compute box
    const {boundingRect, shapePositions} = options
    const canvasRect = paper.view.element.getBoundingClientRect()
    if (typeof shapePositions[this.name.toLowerCase()] !== 'undefined') {
      const {topShift, leftShift, widthProportion, heightProportion} = shapePositions[this.name.toLowerCase()]
      // topShift and leftShift are relative to boundingRect dimensions before scaling
      boundingRect.top += topShift * boundingRect.height
      boundingRect.left += leftShift * boundingRect.width
      boundingRect.width *= widthProportion
      boundingRect.height *= heightProportion
    }
    return {
      canvasRect: canvasRect,
      bounds: boundingRect,
      center: {
        x: boundingRect.left - canvasRect.left + boundingRect.width / 2,
        y: boundingRect.top - canvasRect.top + boundingRect.height / 2
      },
      shapePositions: shapePositions
    }
  }

  draw (options) {
    // method to draw myself -- must be called by subclasses before rest of drawing statements
    this.box = this.getDrawingBox(options)
    if (this.layer === null) {
      throw Error(`Cannot draw glyph ${this.id} with null layer`)
    }
    if (!Object.is(paper.project.layers[this.layer], paper.project.activeLayer)) {
      throw Error(`Cannot set glyph: Active layer '${paper.project.activeLayer.name}' differs from glyph layer '${paper.project.layers[this.layer].name}'`)
    }
    const drawingBox = paper.Path.Rectangle({
      center: [this.box.center.x, this.box.center.y],
      size: [this.box.bounds.width, this.box.bounds.height],
      strokeColor: 'black',
      strokeWidth: 5,
      visible: false
    })
    this.registerPath(drawingBox, 'drawingBox')
    this.drawn = true
  }

  set group (group) {
    if (!Object.is(paper.project.layers[this.layer], paper.project.activeLayer)) {
      throw Error(`Cannot set glyph: Active layer '${paper.project.activeLayer.name}' differs from glyph layer '${paper.project.layers[this.layer].name}'`)
    }
    const children = paper.project.layers[this.layer].children
    const groupName = this.name + 'Group'
    const oldGroup = children.find(item => { return item.name === groupName })
    if (typeof oldGroup !== 'undefined') {
      oldGroup.replaceWith(group)
    }
    group.name = groupName
  }

  get group () {
    const children = paper.project.layers[this.layer].children
    const groupName = this.name + 'Group'
    const group = children.find(item => { return item.name === groupName })
    if (typeof group === 'undefined') {
      console.warn(`No group in layer ${this.layer} matched name '${groupName}'.`)
    }
    return group
  }

  buildPathGroups () { // group drawn paths for ease of translation
    const namedPaths = this.getNamedPaths(false)
    let paths = []
    Object.values(namedPaths).forEach(path => paths.push(path))
    this.group = new paper.Group(paths)
    this.children.forEach(glyph => glyph.buildPathGroups()) // recursive call on children
  }

  registerPath (path, pathName, selectable = true) {
    // associate path unique id with a name that can be used to retrieve it
    // pathName should be lower case (as it's not used for display here)
    this.pathIds[pathName] = path.id
    this.drawnPaths.add(pathName)
    path.name = pathName // assign name to path
    // if (selectable) {
    //   path.onClick = async function () {
    //     await store.dispatch('glyph/selectGlyphEl', {
    //       layer: this.layer,
    //       path: pathName
    //     })
    //     console.log(`Selected path ${pathName} of glyph ${this.layer}`)
    //   }.bind(this)
    // } // TODO use hitTest instead
  }

  getPath (pathName = this.constructor.shapes.main) {
    const findPath = children => children.find(path => { return path.id === this.pathIds[pathName] && path.name === pathName })
    let children = this.group.children
    let path = findPath(children)
    if (typeof path === 'undefined') {
      children = paper.project.layers[this.layer].children
      path = findPath(children)
    }
    // id matching should make layer search work, but in case glyph has children of same type there will be multiple
    // paths with the same namae
    if (typeof path === 'undefined') {
      throw new Error(`Either id or name did not match the tracked id (${this.pathIds[pathName]}) / name (${pathName})`)
    }
    return path
  }

  deletePath (pathName = this.constructor.shapes.main) {
    // deleting path if it is drawn (and id was registered using registerPath)
    let found = false
    const pathId = this.pathIds[pathName]
    if (pathId !== null) {
      for (let path of paper.project.layers[this.layer].children) {
        if (path.id === pathId) {
          path.remove()
          this.pathIds[pathName] = null
          found = true
          break
        }
      }
    }
    if (pathId !== null && !found) {
      // shouldn't get here
      throw new Error(`Either id or name did not match the tracked id (${this.pathIds[pathName]}) / name (${pathName})`)
    }
  }

  set mainPath (path) {
    this.registerPath(path, this.constructor.shapes.main)
  }

  get mainPath () {
    return this.getPath(this.constructor.shapes.main)
  }

  getNamedPaths (includeChildren = true) {
    // object with keys referencing path objects in layer
    let paths = {}
    paths[this.constructor.shapes.main] = this.getPath(this.constructor.shapes.main)
    for (let element of this.glyphElements) {
      let targetGlyph
      if (element.target === this.constructor.shapes.main) {
        targetGlyph = this
      } else if (includeChildren) {
        targetGlyph = this.children.find(glyph => glyph.name === element.target)
      } else {
        continue
      }
      if (typeof targetGlyph === 'undefined') {
        throw Error(`Neither main glyph nor children names matched element's target '${element.target}' `)
      }
      let name = element.name.toLowerCase()
      if (element.type === 'path' && this.drawnPaths.has(name)) {
        let pathName = element.name.toLowerCase()
        let path = this.getPath(pathName)
        paths[pathName] = path
      }
    }
    return paths
  }

  clonePath (pathName = this.constructor.shapes.main, numPoints = 300) {
    // clone glyph path with an arbitrary number of points
    const path = this.getPath(pathName)
    let newPath = new paper.Path()
    const theta = path.length / numPoints
    for (let t = 0; t < numPoints; t++) {
      newPath.add(path.getLocationAt(theta * t))
    }
    return newPath
  }

  scale (factorX = 1, factorY = 1) {
    // wrapper to paper scale function - can only make smaller if features are normalized correctly into [0, 1]
    if (factorX > 1 || factorY > 1) {
      throw Error("Cannot scale by factor greater than 1")
    }
    if (factorX === 0.0) {
      factorX += 0.05 // cannot scale to 0
    }
    if (factorY === 0.0) {
      factorY += 0.05 // cannot scale to 0
    }
    this.activateLayer()
    paper.project.layers[this.layer].scale(factorX, factorY)
  }

  reset () { // delete all paperjs paths associated with glyph
    if (this.drawn) {
      if (this.parent === null) { // if this is root glyph, clear layer
        paper.project.layers[this.layer].removeChildren()
        this.pathIds = {}
        this.drawnPaths = new Set()
      } else {
        for (let pathName in this.pathIds) {
          if (this.pathIds.hasOwnProperty(pathName)) {
            this.deletePath(pathName) // this should loop over children paths as well
          }
        }
      }
      this.children = [] // clear all children
      this.drawn = false
      this.activateLayer()
      this.group = new paper.Group([]) // reset to empty group (needed for path methods to work on new glyph)
    }
  }

  registerChild (glyph) { // function to register children, used mainly in constructor of complex glyphs
    if (!glyph.id) {
      glyph.id = `${this.children.length - 1}`
    }
    if (glyph.layer !== this.layer) {
      throw Error(`Child ${glyph.name}'s layer (${glyph.layer}) differs from parent ${this.name}'s layer (${this.layer}`)
    }
    glyph.parent = this // storing reference
    this.children.push(glyph)
    // register drawing methods
    for (let element of glyph.constructor.elements) {
      if (element.type !== 'scale') { // scale elements don't have draw function
        this[`draw${glyph.name}${element.name}`] = glyph[`draw${element.name}`].bind(glyph) // drawElement method of child
      }
    }
    if (glyph.drawn) {
      // made child paths accessible through parent
      for (let pathName in glyph.pathIds) {
        if (glyph.pathIds.hasOwnProperty(pathName)) { this.pathIds[glyph.name + '-' + pathName] = glyph.pathIds[pathName] }
      }
    } else {
      console.warn(`Passed glyph '${glyph.name}' has not been drawn`)
    }
  }

  getChild (childName) {
    try {
      return this.children.find(childGlyph => { return childGlyph.name === childName })
    } catch (e) {
      throw Error(`Glyph ${this.name} has no children named '${childName}'`)
    }
  }

  deleteChild (childName) {
    let i
    for (i = 0; i < this.children.length; i++) {
      if (this.children[i] === childName) { return i }
    }
    delete this.children[i]
    throw Error(`Glyph ${this.name} has no children named '${childName}'`)
  }
}

export default BaseGlyph

// {
//   deleted: false,
//     enable: true,
//   shape: 'ellipse',
//   dynamicColor: '#edf8fb-#bfd3e6-#9ebcda-#8c96c6-#8856a7-#810f7c',
//   colorFill: '#dac8f4', // hex
//   colorChoice: true,
//   colorGradient: 'empty',
//   colorBorder: '#231736', // hex
//   sizeBorder: 1,
//   length: 'empty',
//   width: 'empty',
//   spikeFraction: 'empty',
//   spikeHeight: 'empty',
//   sizeBorderSpike: 2,
//   colorSpike: '#2d118e',
//   numberOfPoints: 60,
//   staticHeight: true,
//   enableSpike: true,
//   membraneFraction: 'empty',
//   colorMembrane: '#ee311a',
//   membraneSize: 4,
//   enableMembrane: true,
//   symbolFilling: 'empty',
//   orderSymbol: 'radial',
//   colorSymbol: '#eeea3e',
//   sizeSymbol: 3,
//   symbol1: 'circle',
//   enableSymbol: true,
//   protrusionFraction: 'empty',
//   sizeBorderProtrusion: 3,
//   colorProtrusion: '#2d118e',
//   enableProtrusion: true,
//   symbolBorderFraction: 'empty',
//   colorSymbolBorder: '#ed5cee',
//   sizeSymbolBorder: 2,
//   symbolBorderSymbol: 'dashes',
//   enableBorderSymbol: true,
//   densityElement: 'empty',
//   organisationMesh: 'vertical',
//   colorMesh: '#2d118e',
//   sizeMesh: 1,
//   enableMesh: true,
//   centerX: 0,
//   centerY: 0
// }
