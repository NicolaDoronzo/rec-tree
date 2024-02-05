const canvasSketch = require("canvas-sketch");
const random = require("canvas-sketch-util/random");
const Pane = require("tweakpane").Pane;
const settings = {
  width: 2048,
  height: 1024
};

const params = {
  levels: 5,
  height: 500,
  width: 10,
  mainBranchAngleVariation: 20,
  branchesAngleVariation: 40,
  treesAmount: 10,
  depth: 0,
  sectionedBranching: false,
  branchSections: 5,
  grassEffect: false,
  clearColor: { r: 255, g: 255, b: 255, a: 1 },
  treeColor: { r: 0, g: 0, b: 0, a: 1 },
};

const createPane = (manager) => {
  const pane = new Pane();
  let folder;
  folder = pane.addFolder({ title: "Forest" });
  folder.addInput(params, "levels", {
    min: 3,
    max: 10,
    step: 1,
  });
  folder.addInput(params, "height", {
    min: 100,
    max: 1000,
  });
  folder.addInput(params, "width", {
    min: 5,
    max: 50,
    step: 0.1,
  });
  folder.addInput(params, "mainBranchAngleVariation", {
    min: 1,
    max: 70,
  });
  folder.addInput(params, "branchesAngleVariation", {
    min: 1,
    max: 80,
  });
  folder.addInput(params, "treesAmount", {
    min: 1,
    max: 500,
    step: 1,
  });
  folder.addInput(params, "depth", {
    min: -20,
    max: 20,
    step: 0.1,
  });
  folder.addInput(params, "sectionedBranching");
  folder.addInput(params, "branchSections", {
    min: 2,
    max: 20,
    step: 1,
  });
  folder.addInput(params, "grassEffect");
  folder.addInput(params, "clearColor");
  folder.addInput(params, "treeColor");
  folder.addInput(settings, 'width')
  folder.addInput(settings, 'height')
  pane.on("change", (ev) => {
    manager.update({ dimensions: [settings.width, settings.height]})
    manager.render();
  });
};

const rgbaToString = ({ r, g, b, a }) => `rgba(${r}, ${g}, ${b}, ${a})`;

class Tree {
  constructor(w, h, subtrees = []) {
    this.w = w;
    this.h = h;
    this.subtrees = subtrees;
  }

  drawBranch(context) {
    context.fillStyle = rgbaToString(params.treeColor);
    context.strokeStyle = rgbaToString(params.treeColor);
    if (params.sectionedBranching) {
      context.beginPath();
      const nodes = params.branchSections;

      for (let i = 0; i < nodes; i++) {
        context.save();
        context.translate(0, (this.h / nodes) * i);
        context.rotate((random.rangeFloor(-10, 10) * Math.PI) / 180);
        context.lineWidth = this.w / (i + 1);
        context.lineTo(this.w, this.h / nodes);
        context.stroke();
        context.restore();
      }
      context.closePath();
    } else {
      context.fillRect(0, 0, this.w, this.h);
    }
  }

  static draw(tree, context) {
    tree.drawBranch(context);
    tree.subtrees.forEach((subtree) => {
      context.save();
      context.translate(0, tree.h - random.range(0, tree.h / 4));
      context.rotate(
        (random.rangeFloor(
          -params.branchesAngleVariation,
          params.branchesAngleVariation
        ) *
          Math.PI) /
          180
      );
      Tree.draw(subtree, context);
      context.restore();
    });
  }

  /**
   *
   * @param {*} levels
   * @param {*} w
   * @param {*} h
   * @returns {Tree}
   */
  static build(levels = params.levels, w = params.width, h = params.height) {
    const nodeCons = (width, height) => (subs) => new Tree(width, height, subs);
    if (levels <= 0) {
      return nodeCons(w, h)([]);
    } else {
      return nodeCons(
        w,
        h
      )(
        [...new Array(random.rangeFloor(2, 5))].map((_, j) =>
          Tree.build(
            levels - 1,
            w * (levels / (levels + 1 + j)),
            params.grassEffect
              ? h / levels / (j + 1)
              : h - ((h / levels) * j + 1)
          )
        )
      );
    }
  }

  /**
   *
   * @param {CanvasRenderingContext2D} context
   * @param {number} widht
   * @param {height} height
   */
  static drawScene(context, width, height) {
    const t = Tree.build();

    context.fillStyle = rgbaToString(params.clearColor);
    context.fillRect(0, 0, width, height);
    context.save();
    context.rotate(Math.PI);
    for (let i = 0; i < params.treesAmount; i++) {
      context.save();
      context.translate((width / params.treesAmount) * -i, -height);
      context.rotate(
        (random.rangeFloor(
          -params.mainBranchAngleVariation,
          params.mainBranchAngleVariation
        ) *
          Math.PI) /
          180
      );
      const depth = random.range(
        1 / (params.depth * 10),
        params.depth / 10 + 1
      );
      context.scale(depth, depth);
      Tree.draw(t, context);
      context.restore();
    }
    context.restore();
  }
}

const sketch = () => {
  /**
   * @param {{ context: CanvasRenderingContext2D, width: number, height: number }}
   */
  return ({ context, width, height }) => Tree.drawScene(context, width, height);
};

const start = async () => {
  const manager = await canvasSketch(sketch, { dimensions: [settings.width, settings.height]});
  createPane(manager);
  return manager;
};

let currentFrameTs = 0;
const rafce = (m, elapsed) => {
  if (elapsed - currentFrameTs > 50) {
    m.render();
    currentFrameTs = elapsed;
  }
  requestAnimationFrame((ts) => rafce(m, ts));
};
start().then(rafce);
