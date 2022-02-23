const canvasSketch = require("canvas-sketch");
const random = require("canvas-sketch-util/random");
const Pane = require("tweakpane").Pane;
const settings = {
  dimensions: [2048, 2048],
};

const params = {
  levels: 5,
  height: 500,
  width: 10,
  mainBranchAngleVariation: 20,
  branchesAngleVariation: 40,
  treesAmount: 10,
  depth: 0,
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

  pane.on("change", () => {
    manager.render();
  });
};

class Tree {
  constructor(w, h, subtrees = []) {
    this.w = w;
    this.h = h;
    this.subtrees = subtrees;
  }

  draw(context) {
    context.fillStyle = "black";
    // context.fillRect(0,0,this.w, this.h)
    context.beginPath();
    const nodes = 5;
    
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
  }
}

const sketch = () => {
  return ({ context, width, height }) => {
    const t = buildTree(params.levels, params.width, params.height);

    function drawTree(tree) {
      tree.draw(context);
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
        drawTree(subtree);
        context.restore();
      });
    }
    context.fillStyle = "white";
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
      context.scale(1.5, 1.5);
      const depth = random.range(1 / (params.depth * 10), params.depth / 10 + 1); 
      context.scale(
        depth,
        depth
      );
      drawTree(t);
      context.restore();
    }
    context.restore();
  };
};

const start = async () => {
  const manager = await canvasSketch(sketch, settings);
  createPane(manager);
};

start();

function buildTree(levels = 5, w = 10, h = 400) {
  const nodeCons = (width, height) => (subs) => new Tree(width, height, subs);
  if (levels <= 0) {
    return nodeCons(w, h)([]);
  } else {
    return nodeCons(
      w,
      h
    )(
      new Array(random.rangeFloor(2, 5))
        .fill(null)
        .map((_, j) =>
          buildTree(
            levels - 1,
            w * (levels / (levels + 1 + j)),
            h - (h / levels * j + 1)
          )
        )
    );
  }
}
