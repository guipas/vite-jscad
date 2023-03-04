
This code is basically a copy of jscad's demo code for the [regl renderer](https://github.com/jscad/OpenJSCAD.org/tree/master/packages/utils/regl-renderer), adapted to run in a vite project.

This allows you to:
- use vscode to write your jscad code instead of their provided in-browser editor (meaning you can use all the nice features of vscode, copilot, etc)
- easily show and display your jscad model once you're done writing it
- just basically keep using the tools you're already used while learning jscad !

## How to use

- clone this repo
- run `npm install`
- run `npm run dev`
- modify the code in `src/design.ts` to create your own model.

## Roadmap

- [x] basic application setup
- [ ] NPM command to export your design as a stl file
- [ ] make the model parameters editable in the browser using a library like [leva](https://github.com/pmndrs/leva)
