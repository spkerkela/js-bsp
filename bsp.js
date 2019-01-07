var canvas = document.getElementById("canvas");
var context = canvas.getContext("2d");

var canvasWidth = canvas.width;
var canvasHeight = canvas.height;

var nextId = (function() {
  var n = 0;
  return function() {
    console.log(n);
    return n++;
  };
})();

function Tree(width, height, x, y, color) {
  this.id = nextId();
  this.width = width;
  this.height = height;
  this.x = x;
  this.y = y;
  this.color = color;
  this.children = [];
}

Tree.prototype.area = function() {
  return this.width * this.height;
};

Tree.prototype.split = function() {
  var horizontalSplit = Math.random() < 0.5;
  var magicRatio = 1.45;
  if (this.width > this.height && this.width / this.height >= magicRatio) {
    horizontalSplit = false;
  } else if (
    this.height > this.width &&
    this.height / this.width >= magicRatio
  ) {
    horizontalSplit = true;
  }
  if (horizontalSplit) {
    var heigthHalved = this.height / 2;
    this.addChild(new Tree(this.width, heigthHalved, this.x, this.y, "green"));
    this.addChild(
      new Tree(
        this.width,
        heigthHalved,
        this.x,
        this.y + heigthHalved,
        "violet"
      )
    );
  } else {
    var widthHalved = this.width / 2;
    this.addChild(new Tree(widthHalved, this.height, this.x, this.y, "red"));
    this.addChild(
      new Tree(widthHalved, this.height, this.x + widthHalved, this.y, "blue")
    );
  }
};

Tree.prototype.addChild = function(child) {
  this.children.push(child);
};

Tree.prototype.addChildren = function(children) {
  this.children.concat(children);
};

Tree.prototype.isLeaf = function() {
  return this.children.length === 0;
};

var root = new Tree(canvasWidth, canvasHeight, 0, 0);
root.split();

function iterateTree(func, tree) {
  if (tree.isLeaf()) {
    func(tree);
  } else {
    tree.children.forEach(function(child) {
      iterateTree(func, child);
    });
  }
}

for (var i = 0; i < 4; i++) {
  iterateTree(function(node) {
    if (!node.isLeaf()) {
      // Don't split other than leaves of tree
      return;
    }
    if (node.area() < 10000) {
      // Don't split if too small
      return;
    }
    node.split();
  }, root);
}

iterateTree(function(node) {
  context.fillStyle = node.color;
  context.fillRect(node.x, node.y, node.width, node.height);
  console.log(node.width, node.height, node.x, node.y);
  context.fillStyle = "white";
  context.font = "14pt Calibri";
  context.fillText(node.id, node.x + node.width / 2, node.y + node.height / 2);
}, root);