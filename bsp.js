var canvas = document.getElementById("canvas");
var context = canvas.getContext("2d");

var canvasWidth = canvas.width;
var canvasHeight = canvas.height;

var nextId = (function() {
  var n = 0;
  return function() {
    return n++;
  };
})();

function randomIntFromInterval(min, max) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function distance(point1, point2) {
  return Math.hypot(point1.x - point2.x, point1.y - point2.y);
}

function Door(from, to) {
  this.from = from;
  this.to = to;
  this.locked = false;
}

function Room(width, height, x, y) {
  this.width = width;
  this.height = height;
  this.x = x;
  this.y = y;
  this.doors = [];
}

Room.prototype.addDoor = function(door) {
  this.doors.push(door);
};

Room.prototype.center = function() {
  return {
    x: this.x + this.width / 2,
    y: this.y + this.height / 2
  };
};

function Tree(width, height, x, y, color) {
  this.id = nextId();
  this.width = width;
  this.height = height;
  this.x = x;
  this.y = y;
  this.color = color;
  this.children = [];
  this.room = null;
}

Tree.prototype.center = function() {
  return {
    x: this.x + this.width / 2,
    y: this.y + this.height / 2
  };
};

Tree.prototype.addRoom = function() {
  var roomWidth = randomIntFromInterval(this.width / 2, this.width);
  var roomHeight = randomIntFromInterval(this.height / 2, this.height);
  var roomX = randomIntFromInterval(1, this.width - roomWidth);
  var roomY = randomIntFromInterval(1, this.height - roomHeight);
  this.room = new Room(roomWidth, roomHeight, this.x + roomX, this.y + roomY);
};

Tree.prototype.area = function() {
  return this.width * this.height;
};

Tree.prototype.split = function() {
  var horizontalSplit = Math.random() < 0.5;
  var magicRatio = 1.25;
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

function iterateTreeLeafs(func, tree) {
  if (tree.isLeaf()) {
    func(tree);
  } else {
    tree.children.forEach(function(child) {
      iterateTreeLeafs(func, child);
    });
  }
}

for (var i = 0; i < 6; i++) {
  iterateTreeLeafs(function(node) {
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

function getRoom(node, nearest) {
  if (node.room != null) {
    return node.room;
  }
  if (node.isLeaf()) {
    return null;
  }
  if (
    distance(nearest, node.children[0].center()) <
    distance(nearest, node.children[1].center())
  ) {
    return getRoom(node.children[0], nearest);
  } else {
    return getRoom(node.children[1], nearest);
  }
}

var roomCount = 0;
iterateTreeLeafs(function(node) {
  context.fillStyle = node.color;
  context.fillRect(node.x, node.y, node.width, node.height);
  node.addRoom();
  roomCount++;
  context.fillStyle = "black";

  context.fillRect(node.room.x, node.room.y, node.room.width, node.room.height);
}, root);

var levels = 5;
var colors = ["#222", "#444", "#666", "#888", "#aaa"];

var interval = Math.ceil(roomCount / levels);

var currentLevel = 0;
var iterations = 0;
function connectRooms(node) {
  if (!node.isLeaf()) {
    node.children.forEach(connectRooms);
    var room1 = getRoom(node.children[0], node.children[1].center());
    var room2 = getRoom(node.children[1], node.children[0].center());
    room1.addDoor(new Door(room1, room2));
    room2.addDoor(new Door(room2, room1));
    context.beginPath();
    context.strokeStyle = colors[currentLevel];
    context.lineWidth = 3;
    center1 = room1.center();
    center2 = room2.center();
    context.moveTo(center1.x, center1.y);
    context.lineTo(center2.x, center2.y);
    context.stroke();
    iterations++;
    if (iterations % interval == 0) {
      currentLevel++;
      if (currentLevel >= levels) {
        currentLevel = levels;
      }
    }
  }
}

connectRooms(root);

iterateTreeLeafs(function(node) {
  if (node.room.doors.length === 1) {
    context.fillStyle = "yellow";

    context.fillRect(
      node.room.x + 2,
      node.room.y + 2,
      node.room.width - 4,
      node.room.height - 4
    );
    context.fillStyle = "black";
  } else {
    context.fillStyle = "white";
  }
  context.font = "14pt Calibri";
  context.fillText(node.id, node.x + node.width / 2, node.y + node.height / 2);
}, root);
