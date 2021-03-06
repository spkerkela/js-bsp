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
  this.hasKey = false;
  this.exit = false;
  this.entrance = false;
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

Tree.prototype.getNode = function(id) {
  if (this.id === id) {
    return this;
  } else {
    for (let i = 0; i < this.children.length; i++) {
      var node = this.children[i].getNode(id);
      if (node != null) {
        return node;
      }
    }
  }

  return null;
};

Tree.prototype.forEach = function(func) {
  this.children.forEach(function(child) {
    child.forEach(func);
  });
  func(this);
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

Tree.prototype.iterateLeafs = function iterate(func) {
  if (this.isLeaf()) {
    func(this);
  } else {
    this.children.forEach(function(child) {
      child.iterateLeafs(func);
    });
  }
};

var bspIterations = 8;
var halfRoundedDown = Math.floor(bspIterations / 2);
for (var i = 0; i < bspIterations; i++) {
  root.iterateLeafs(function(node) {
    if (!node.isLeaf()) {
      // Don't split other than leaves of tree
      return;
    }
    if (node.area() < 10000) {
      // Don't split if too small
      return;
    }
    node.split();
  });
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
root.iterateLeafs(function(node) {
  context.fillStyle = node.color;
  context.fillRect(node.x, node.y, node.width, node.height);
  node.addRoom();
  roomCount++;
  context.fillStyle = "black";

  context.fillRect(node.room.x, node.room.y, node.room.width, node.room.height);
});

var levels = 5;
var colors = ["#222", "#444", "#666", "#888", "#aaa"];

var interval = Math.ceil(roomCount / levels);

var currentLevel = 0;
var iterations = 0;
var worldLocks = 0;
var worldKeys = 0;
function connectRooms(node) {
  if (!node.isLeaf()) {
    iterations++;
    node.children.forEach(connectRooms);
    var room1 = getRoom(node.children[0], node.children[1].center());
    var room2 = getRoom(node.children[1], node.children[0].center());
    var door1 = new Door(room1, room2);
    var door2 = new Door(room2, room1);
    room1.addDoor(door1);
    room2.addDoor(door2);
    context.beginPath();
    context.strokeStyle = colors[currentLevel];
    context.lineWidth = 3;
    center1 = room1.center();
    center2 = room2.center();
    context.moveTo(center1.x, center1.y);
    context.lineTo(center2.x, center2.y);
    context.stroke();
    if (iterations % interval == 0) {
      currentLevel++;
      if (currentLevel >= levels) {
        currentLevel = levels;
      }
    }
  }
}

connectRooms(root);

var entrancePlaced = false;
var lastLeafId = -1;
var keysPlaced = 0;
var locksPlaced = 0;

root.iterateLeafs(function(node) {
  if (node.room.doors.length === 1) {
    lastLeafId = node.id;
    if (!entrancePlaced) {
      entrancePlaced = true;
      node.room.entrance = true;
      return;
    }
    if (Math.random() < 0.5) {
      if (locksPlaced === keysPlaced) {
        node.room.hasKey = true;
        keysPlaced++;
      } else if (keysPlaced > locksPlaced) {
        node.room.doors[0].locked = true;
        locksPlaced++;
      }
    }
  }
});

var lastNode = root.getNode(lastLeafId);

lastNode.room.exit = true;
if (locksPlaced < keysPlaced) {
  if (lastNode.room.hasKey) {
    lastNode.room.hasKey = false;
    keysPlaced--;
  } else {
    lastNode.room.doors[0].locked = true;
  }
}
root.iterateLeafs(function(node) {
  var nodeText = node.id;
  if (node.room.doors.length === 1) {
    context.fillStyle = "yellow";

    if (node.room.hasKey) {
      nodeText = "Has Key";
    }
    if (node.room.doors[0].locked) {
      context.fillStyle = "red";
    }

    context.fillRect(
      node.room.x + 2,
      node.room.y + 2,
      node.room.width - 4,
      node.room.height - 4
    );
    context.fillStyle = "black";

    if (node.room.entrance) {
      nodeText = "Entrance";
    } else if (node.room.exit) {
      nodeText = "Exit";
    }
  } else {
    context.fillStyle = "white";
  }
  context.font = "14pt Calibri";
  context.fillText(nodeText, node.x + node.width / 2, node.y + node.height / 2);
});
