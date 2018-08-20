// const BaseTool = cornerstoneTools.BaseTool;

class SvgBrush {
  constructor() {
    this.name = "svgBrush";
    this.configuration = {
      radius: 10,
      segmentationIndex: 0,
      segmentationColors: ["#bada55", "#55daba", "#ba55da"],
      pinchToZoom: false,
      simplifyPrecision: 0.4
    };

    this.supportedInteractionTypes = ["mouse", "touch"];
    this.touchEventCache = new Map();
  }

  renderToolData(evt) {
    const element = evt.detail.element;
    const toolState = cornerstoneTools.getToolState(element, this.name);
    if (toolState) {
      const data = toolState.data[0];
      this.configuration.radius = _setCursor(data, this.configuration.radius);
      this._draw(element, data);
    }
  }

  preMouseDownCallback(evt) {
    const element = evt.currentTarget;
    // TODO:
    // element.setPointerCapture(evt.pointerId);

    if (this.configuration.pinchToZoom && evt.pointerType === "touch") {
      touchEventCache.set(e.pointerId, e);
      element.addEventListener("pointermove", dragCallback);
      element.addEventListener("pointerup", pointerUpCallback);
      element.addEventListener("pointercancel", pointerUpCallback);
      // element.addEventListener('pointerout', pointerUpCallback);
      element.addEventListener("pointerleave", pointerUpCallback);
      return;
    }

    const toolState = cornerstoneTools.getToolState(element, this.name);
    if (toolState) {
      const data = toolState.data[0];
      const enabledElement = cornerstone.getEnabledElement(element);
      const scale = enabledElement.transform
        ? enabledElement.transform.m[0]
        : enabledElement.viewport.scale;
      data.removeMode = !!evt.ctrlKey;

      const currentImagePoint = cornerstone.canvasToPixel(element, {
        x: evt.detail.event.offsetX,
        y: evt.detail.event.offsetY
      });

      // const patientPoint = cornerstoneTools.imagePointToPatientPoint(currentImagePoint, data.imagePlaneModule)
      const radius =
        evt.pointerType === "pen"
          ? Math.max((evt.pressure - 0.3) * 40, 5)
          : this.configuration.radius;
      const region = createRegion(currentImagePoint, undefined, radius / scale);

      paintRegion(data, this.configuration.segmentationIndex, region);
      this._draw(element, data);

      // todo: Prevent?
      return;
    }
  }

  mouseDragCallback(evt) {
    const element = evt.currentTarget;
    const currentImagePoint = cornerstone.canvasToPixel(element, {
      x: evt.detail.currentPoints.canvas.x,
      y: evt.detail.currentPoints.canvas.y
    });

    if (this.configuration.pinchToZoom && evt.pointerType === "touch") {
      touchEventCache.set(evt.pointerId, evt);
      let deltaTransform;
      if (touchEventCache.size === 1) {
        const lastPoint1 = {
          x: evt.offsetX - evt.movementX,
          y: evt.offsetY - evt.movementY
        };
        const currPoint1 = { x: evt.offsetX, y: evt.offsetY };
        const domain = [[lastPoint1.x, lastPoint1.y]];
        const range = [[currPoint1.x, currPoint1.y]];
        // deltaTransform = nudged.estimateT(domain, range);
      }
      if (touchEventCache.size === 2) {
        const [e1, e2] = touchEventCache.values();
        const lastPoint1 = {
          x: e1.offsetX - (evt.pointerId === e1.pointerId ? e1.movementX : 0),
          y: e1.offsetY - (evt.pointerId === e1.pointerId ? e1.movementY : 0)
        };
        const lastPoint2 = {
          x: e2.offsetX - (evt.pointerId === e2.pointerId ? e2.movementX : 0),
          y: e2.offsetY - (evt.pointerId === e2.pointerId ? e2.movementY : 0)
        };
        const currPoint1 = { x: e1.offsetX, y: e1.offsetY };
        const currPoint2 = { x: e2.offsetX, y: e2.offsetY };
        const domain = [
          [lastPoint1.x, lastPoint1.y],
          [lastPoint2.x, lastPoint2.y]
        ];
        const range = [
          [currPoint1.x, currPoint1.y],
          [currPoint2.x, currPoint2.y]
        ];
        // deltaTransform = nudged.estimateTSR(domain, range);
      }

      if (deltaTransform) {
        // const enabledElement = cornerstone.getEnabledElement(element);
        // const m = cornerstone.internal.getTransform(enabledElement).m;
        // let transform = new nudged.Transform(m[0], m[1], m[4], m[5]);
        // transform = deltaTransform.multiplyBy(transform);
        // const mt = transform.getMatrix();
        // const t = new cornerstone.internal.Transform();
        // t.m = [mt.a, mt.b, mt.c, mt.d, mt.e, mt.f];
        // enabledElement.transform = t;
        // cornerstone.updateImage(element);
      }
      return;
    }

    const toolState = cornerstoneTools.getToolState(element, this.name);
    if (toolState) {
      const data = toolState.data[0];
      const lastImagePoint = cornerstone.canvasToPixel(element, {
        x: evt.detail.lastPoints.canvas.x,
        y: evt.detail.lastPoints.canvas.y
      });
      const enabledElement = cornerstone.getEnabledElement(element);
      const scale = enabledElement.transform
        ? enabledElement.transform.m[0]
        : enabledElement.viewport.scale;
      const radius =
        evt.pointerType === "pen"
          ? Math.max((evt.pressure - 0.3) * 40, 5)
          : this.configuration.radius;
      const region = createRegion(
        currentImagePoint,
        lastImagePoint,
        radius / scale
      );

      paintRegion(data, this.configuration.segmentationIndex, region);
      this._draw(element, data);
    }
  }

  mouseUpCallback(evt) {
    const element = evt.currentTarget;
    // TODO:
    // element.releasePointerCapture(evt.pointerId);

    if (this.configuration.pinchToZoom && evt.pointerType === "touch") {
      touchEventCache.delete(evt.pointerId);
      return;
    }

    const toolState = cornerstoneTools.getToolState(element, this.name);
    if (toolState) {
      const data = cornerstoneTools.getToolState(element, this.name).data[0];
      const seg = data.segmentations[this.configuration.segmentationIndex];
      for (let i = 0; i < seg.regions.length; i++) {
        seg.regions[i] = seg.regions[i]; // simplify(
        // seg.regions[i],
        // this.configuration.simplifyPrecision,
        // true
        // );
      }
      this._draw(element, data);
    }
  }

  /**
   * MouseWheel + `shift`
   * Used to change the cursor size
   *
   * @param {*} e
   * @returns
   * @memberof SvgBrush
   */
  mouseWheelCallback(evt) {
    // todo: fix this event in cornerstone-tools
    if (evt.detail.detail.shiftKey) {
      const element = evt.currentTarget;
      const data = cornerstoneTools.getToolState(element, this.name).data[0];
      const newRadius =
        this.configuration.radius +
        evt.detail.direction * Math.ceil(this.configuration.radius / 20);

      // Set
      this.configuration.radius = _setCursor(data, newRadius);

      // Prevent
      evt.preventDefault();
      evt.stopPropagation();
      evt.stopImmediatePropagation();
      return false;
    }
  }

  // MODE CHANGES
  activeCallback(element, options) {
    const enabledElement = cornerstone.getEnabledElement(element);

    // TODO:
    // It would be nice if we could activate this tool before an image has been loaded
    // It might be better to move the data initialization to a different callback/check?
    let data = cornerstoneTools.getToolState(element, this.name);
    if (!data) {
      data = {
        segmentations: [],
        imagePlaneModule: enabledElement.image.imagePlaneModule,
        removeMode: false,
        currentCursor: {
          url: undefined,
          radius: undefined
        },
        svgElementId: "svg"
      };
      cornerstoneTools.addToolState(element, this.name, data);
    }

    this.configuration.radius = _setCursor(data, this.configuration.radius);
  }

  passiveCallback(element, options) {
    const toolState = cornerstoneTools.getToolState(element, this.name);
    if (toolState) {
      const data = toolState.data[0];
      _setCursor(data, undefined);
    }
  }

  // ~~ PRIVATE

  /**
   * Draw's a representation of the tool's data
   *
   * @param {*} element
   * @param {*} data
   * @memberof SvgBrush
   */
  _draw(element, data) {
    const svgElement = document.getElementById("svg");

    // clear the svg

    // TODO: add ability to remove segmentations
    const paths = Array.from(svgElement.children);
    data.segmentations.forEach((seg, index) => {
      let pathString = "";
      // imagePoint = cornerstoneTools.projectPatientPointToImagePlane(point, data.imagePlaneModule);
      seg.regions.forEach(region => {
        const canvasRegion = region.map(p => {
          const canvasPoint = cornerstone.pixelToCanvas(element, {
            x: p[0],
            y: p[1]
          });
          return [canvasPoint.x | 0, canvasPoint.y | 0];
        });

        pathString += `M${canvasRegion[0][0]},${canvasRegion[0][1]},`;
        for (let i = 1; i < canvasRegion.length; i++) {
          pathString += `L${canvasRegion[i][0]},${canvasRegion[i][1]},`;
        }
        pathString += `L${canvasRegion[0][0]},${canvasRegion[0][1]},`;
      });
      if (paths.length <= index) {
        const pathElement = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "path"
        );
        pathElement.setAttributeNS(null, "d", pathString);
        pathElement.setAttributeNS(null, "stroke", "#000");
        pathElement.setAttributeNS(null, "stroke-width", 1);
        pathElement.setAttributeNS(null, "opacity", 0.5);
        pathElement.setAttributeNS(
          null,
          "fill",
          this.configuration.segmentationColors[index]
        );
        svgElement.appendChild(pathElement);
        paths.push(pathElement);
      }
      paths[index].setAttributeNS(null, "d", pathString);
    });
  }
}

/**
 * Creates an SVG Cursor for the target element
 *
 * @param {*} data
 * @param {*} radius
 * @returns
 */
function _setCursor(data, radius) {
  if (data.currentCursor.radius === radius) {
    return radius;
  }

  if (radius === undefined) {
    window.URL.revokeObjectURL(data.currentCursor.url);
    data.currentCursor.url = undefined;
    document.getElementById(data.svgElementId).style.cursor = `auto`;
    return;
  }

  if (radius > 32) {
    radius = 32;
  } else if (radius < 3) {
    radius = 3;
  } else {
    radius = radius | 0;
  }

  if (data.currentCursor.url) {
    window.URL.revokeObjectURL(data.currentCursor.url);
    data.currentCursor.url = undefined;
  }

  let cursorBlob = new Blob(
    [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${radius * 2 +
        1}" height="${radius * 2 + 1}">
          <circle cx="${radius}" cy="${radius}" r="${radius}" stroke="#000000" fill="gray" style="opacity: 0.5; stroke-width: 1;"/>
       </svg>`
    ],
    { type: "image/svg+xml" }
  );
  data.currentCursor.url = window.URL.createObjectURL(cursorBlob);
  document.getElementById(data.svgElementId).style.cursor = `url('${
    data.currentCursor.url
  }') ${radius} ${radius}, auto`;
  data.currentCursor.radius = radius;
  return radius;
}

function createRegion(p1, p2, radius) {
  const polygon = [];
  const steps = 16;
  if (p2 && (p1.x > p2.x || (p1.x === p2.x && p1.y > p2.y))) {
    const tmp = p1;
    p1 = p2;
    p2 = tmp;
  }

  const startAngle = p2
    ? Math.PI / 2 + Math.atan2(p2.y - p1.y, p2.x - p1.x)
    : 0;

  // first half circle
  for (var i = 0; i < steps / 2; i++) {
    const angle = startAngle + (2 * Math.PI * i) / steps;
    x = p1.x + radius * Math.cos(angle);
    y = p1.y + radius * Math.sin(angle);
    polygon.push([x, y]);
  }

  // second half circle
  for (var i = steps / 2; i < steps; i++) {
    const angle = startAngle + (2 * Math.PI * i) / steps;
    x = (p2 ? p2 : p1).x + radius * Math.cos(angle);
    y = (p2 ? p2 : p1).y + radius * Math.sin(angle);
    polygon.push([x, y]);
  }
  return polygon;
}

function paintRegion(data, segmentationIndex, polygon) {
  if (!data.segmentations[segmentationIndex]) {
    data.segmentations[segmentationIndex] = { regions: [polygon] };
  } else {
    const seg = data.segmentations[segmentationIndex];

    // perform substrations
    if (data.removeMode) {
      for (let i = 0, len = seg.regions.length; i < len; i++) {
        const result = PolygonTools.polygon.subtract(seg.regions[i], polygon);
        seg.regions[i] = result.pop();
        seg.regions = seg.regions.concat(result);
      }
    }
    // perform union
    else {
      seg.regions = PolygonTools.polygon.union(polygon, ...seg.regions);
    }

    // remove holes and empty regions
    seg.regions = seg.regions.filter(r => r && PolygonTools.polygon.is_ccw(r));
  }
}

function pointerenterCallback(e) {
  const element = e.currentTarget;
  const data = cornerstoneTools.getToolState(element, TOOL_NAME).data[0];

  if (e.pointerType !== "mouse") {
    _setCursor(data, undefined);
    return;
  }

  this.configuration.radius = _setCursor(data, this.configuration.radius);
}
