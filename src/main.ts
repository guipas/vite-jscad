import "./style.css";
import typescriptLogo from "./typescript.svg";
import { setupCounter } from "./counter";
import jscadModeling from "@jscad/modeling";
import jscadReglRenderer from "@jscad/regl-renderer";

// document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
//   <div>
//     <a href="https://vitejs.dev" target="_blank">
//       <img src="/vite.svg" class="logo" alt="Vite logo" />
//     </a>
//     <a href="https://www.typescriptlang.org/" target="_blank">
//       <img src="${typescriptLogo}" class="logo vanilla" alt="TypeScript logo" />
//     </a>
//     <h1>Vite + TypeScript</h1>
//     <div class="card">
//       <button id="counter" type="button"></button>
//     </div>
//     <p class="read-the-docs">
//       Click on the Vite and TypeScript logos to learn more
//     </p>
//   </div>
// `

// setupCounter(document.querySelector<HTMLButtonElement>('#counter')!)
const { booleans, colors, primitives } = jscadModeling; // modeling comes from the included MODELING library

const { intersect, subtract } = booleans;
const { colorize } = colors;
const { cube, cuboid, line, sphere, star } = primitives;

const demo = (parameters: any) => {
  const logo = [
    colorize(
      [1.0, 0.4, 1.0],
      subtract(cube({ size: 300 }), sphere({ radius: 200 }))
    ),
    colorize(
      [1.0, 1.0, 0],
      intersect(sphere({ radius: 130 }), cube({ size: 210 }))
    ),
  ];

  const transpCube = colorize(
    [1, 0, 0, 0.75],
    cuboid({
      size: [100 * parameters.scale, 100, 210 + 200 * parameters.scale],
    })
  );
  const star2D = star({ vertices: 8, innerRadius: 300, outerRadius: 400 });
  const line2D = colorize(
    [1.0, 0, 0],
    line([
      [260, 260],
      [-260, 260],
      [-260, -260],
      [260, -260],
      [260, 260],
    ])
  );
  // some colors are intentionally without alpfa channel to test geom2ToGeometries will add alpha channel
  const colorChange = [
    [1, 0, 0, 1],
    [1, 0.5, 0],
    [1, 0, 1],
    [0, 1, 0],
    [0, 0, 0.7],
  ];
  star2D.sides.forEach((side: any, i) => {
    if (i >= 2) side.color = colorChange[i % colorChange.length];
  });

  return [transpCube, star2D, line2D] as any;
};

// ********************
// Renderer configuration and initiation.
// ********************
const { prepareRender, drawCommands, cameras, controls, entitiesFromSolids } =
  jscadReglRenderer;

const perspectiveCamera = cameras.perspective;
const orbitControls = controls.orbit;

const containerElement = document.getElementById("jscad");

const width = containerElement!.clientWidth;
const height = containerElement!.clientHeight;

const state: any = {};

// prepare the camera
state.camera = Object.assign({}, perspectiveCamera.defaults);
perspectiveCamera.setProjection(state.camera, state.camera, { width, height });
perspectiveCamera.update(state.camera, state.camera);

// prepare the controls
state.controls = orbitControls.defaults;

// prepare the renderer
const setupOptions = {
  glOptions: { container: containerElement! },
};
const renderer = prepareRender(setupOptions);

const gridOptions = {
  visuals: {
    drawCmd: "drawGrid",
    show: true,
  },
  size: [500, 500],
  ticks: [25, 5],
  // color: [0, 0, 1, 1],
  // subColor: [0, 0, 1, 0.5]
};

const axisOptions = {
  visuals: {
    drawCmd: "drawAxis",
    show: true,
  },
  size: 300,
  // alwaysVisible: false,
  // xColor: [0, 0, 1, 1],
  // yColor: [1, 0, 1, 1],
  // zColor: [0, 0, 0, 1]
};

const entities = entitiesFromSolids({}, demo({ scale: 1 }));

// assemble the options for rendering
const renderOptions = {
  camera: state.camera,
  drawCommands: {
    drawAxis: drawCommands.drawAxis,
    drawGrid: drawCommands.drawGrid,
    drawLines: drawCommands.drawLines,
    drawMesh: drawCommands.drawMesh,
  },
  // define the visual content
  entities: [gridOptions, axisOptions, ...entities],
};

// the heart of rendering, as themes, controls, etc change
let updateView = true;

const doRotatePanZoom = () => {
  if (rotateDelta[0] || rotateDelta[1]) {
    const updated = orbitControls.rotate(
      { controls: state.controls, camera: state.camera, speed: rotateSpeed },
      rotateDelta
    );
    state.controls = { ...state.controls, ...updated.controls };
    updateView = true;
    rotateDelta = [0, 0];
  }

  if (panDelta[0] || panDelta[1]) {
    const updated = orbitControls.pan(
      { controls: state.controls, camera: state.camera, speed: panSpeed },
      panDelta
    );
    state.controls = { ...state.controls, ...updated.controls };
    panDelta = [0, 0];
    state.camera.position = updated.camera.position;
    state.camera.target = updated.camera.target;
    updateView = true;
  }

  if (zoomDelta) {
    const updated = orbitControls.zoom(
      { controls: state.controls, camera: state.camera, speed: zoomSpeed },
      zoomDelta
    );
    state.controls = { ...state.controls, ...updated.controls };
    zoomDelta = 0;
    updateView = true;
  }
};

const updateAndRender = (timestamp: number) => {
  doRotatePanZoom();

  if (updateView) {
    const updates = orbitControls.update({
      controls: state.controls,
      camera: state.camera,
    });
    state.controls = { ...state.controls, ...updates.controls };
    updateView = state.controls.changed; // for elasticity in rotate / zoom

    state.camera.position = updates.camera.position;
    perspectiveCamera.update(state.camera);

    renderer(renderOptions);
  }
  window.requestAnimationFrame(updateAndRender);
};
window.requestAnimationFrame(updateAndRender);

// convert HTML events (mouse movement) to viewer changes
let lastX = 0;
let lastY = 0;

const rotateSpeed = 0.002;
const panSpeed = 1;
const zoomSpeed = 0.08;
let rotateDelta = [0, 0];
let panDelta = [0, 0];
let zoomDelta = 0;
let pointerDown = false;

const moveHandler = (ev: any) => {
  if (!pointerDown) return;
  const dx = lastX - ev.pageX;
  const dy = ev.pageY - lastY;

  const shiftKey =
    ev.shiftKey === true || (ev.touches && ev.touches.length > 2);
  if (shiftKey) {
    panDelta[0] += dx;
    panDelta[1] += dy;
  } else {
    rotateDelta[0] -= dx;
    rotateDelta[1] -= dy;
  }

  lastX = ev.pageX;
  lastY = ev.pageY;

  ev.preventDefault();
};
const downHandler = (ev: any) => {
  pointerDown = true;
  lastX = ev.pageX;
  lastY = ev.pageY;
  containerElement!.setPointerCapture(ev.pointerId);
};

const upHandler = (ev: any) => {
  pointerDown = false;
  containerElement!.releasePointerCapture(ev.pointerId);
};

const wheelHandler = (ev: any) => {
  zoomDelta += ev.deltaY;
  ev.preventDefault();
};

containerElement!.onpointermove = moveHandler;
containerElement!.onpointerdown = downHandler;
containerElement!.onpointerup = upHandler;
containerElement!.onwheel = wheelHandler;
