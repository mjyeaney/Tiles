// 
// A simple board game prototype, created by Michael Yeaney
// Don't think too hard about this one - I didn't...
//

//
// Some simple utilities
//

var Utils = {};

Utils.Get = function(id){
	return document.getElementById(id);
};

Utils.CreateDelegate = function(method, context){
	return function(){
		method.apply(context);
	};
};

Utils.CreateAsyncDelegate = function(method, context){
	return function(){
		window.setTimeout(function(){
			method.apply(context);
		}, 0);
	};
};

//
// Define the game board
//

function GameBoard(domElementId){
	this.uniquePositions = 4;
	this.columns = 14;
	this.rows = 4;
	this.playerName = '';
	this.currentScore = 0;
	this.matches = 0;
	this.domElement = Utils.Get(domElementId);
	this.pieces = null;
};

// Our static strategy data
// Indexed array is: [match, marker position (orig), marker position (match)]
GameBoard.prototype.Data = {
	rMatches:{1:[3,2,4],2:[4,2,4],3:[1,2,4],4:[2,2,4]},
	bMatches:{1:[3,3,1],2:[4,3,1],3:[1,3,1],4:[2,3,1]}
};

// sets up the game pieces, event handlers, etc.
GameBoard.prototype.init = function(){
	// initialize the arrays
	this.pieces = new Array(4);
	for (var j=0; j < this.pieces.length; j++){
		this.pieces[j] = new Array(3);
	}
	
	// setup the pieces
	for (var j=0; j < this.rows; j++){
		for (var k=0; k < this.columns; k++){
			this.pieces[j][k] = new GamePiece(this.domElement, 
				this.getNewPosition());
		}
	}
};

// Calculates a new rotation based on the max positions
GameBoard.prototype.getNewPosition = function(){
	return Math.floor(Math.random() * this.uniquePositions + 1);
};

GameBoard.prototype.reset = function(){
	// reset all counter
	this.matches = 0;
	this.currentScore = 0;
	
	// setup the pieces
	for (var j=0; j < this.rows; j++){
		for (var k=0; k < this.columns; k++){
			if (!this.pieces[j][k].hold){
				this.pieces[j][k].clearHighlighting();
				this.pieces[j][k].rotateTo(this.getNewPosition());
			}
		}
	}
};

// redraws the game with the newest information
GameBoard.prototype.draw = function(){
	for (var j=0; j < this.rows; j++){
		for (var k=0; k < this.columns; k++){
			this.pieces[j][k].draw(j, k);
		}
	}
};

// Determines if a set of cells is a match
GameBoard.prototype.EvaluateMatch = function(k, j){
	var cell = this.pieces[j][k];
	var currentPos = cell.currentPosition;
	var rMatch = this.Data.rMatches[currentPos];
	var bMatch = this.Data.bMatches[currentPos];
	
	if ((rMatch != null) && (k < (this.columns - 1))){
		if (this.pieces[j][k+1].currentPosition == rMatch[0]){
			this.matches++;
			cell.highlightMatch(rMatch[1]);
			this.pieces[j][k+1].highlightMatch(rMatch[2]);
		}
	}
	
	if ((bMatch != null) && (j < (this.rows - 1))){
		if (this.pieces[j+1][k].currentPosition == bMatch[0]){
			this.matches++;
			cell.highlightMatch(bMatch[1]);
			this.pieces[j+1][k].highlightMatch(bMatch[2]);
		}
	}

    this.currentScore = this.matches * 1.5;
};

// Locates all matches on the current board,
// and updates the score accordingly.
GameBoard.prototype.findMatches = function(){
	for (var j=0; j < this.rows; j++){
		for (var k=0; k < this.columns; k++){
			var cell = this.pieces[j][k];
			if (!cell.hold){
				this.EvaluateMatch(k, j);
			}
		}
	}
};

//
// Define a game piece
//

function GamePiece(boardElement, position){
	this.currentPosition = position;
	this.boardElement = boardElement;
	this.hold = false;
	this.domElement = document.createElement('DIV');
	this.domElement.title = 'Click to hold';
	this.domElement.className = 'gamePiece tile' + this.currentPosition;	
	this.domElement.display = 'none';
	this.boardElement.appendChild(this.domElement);
	
	// Wire the hold function up
	this.domElement.onclick = Utils.CreateDelegate(function(){
		this.hold = !this.hold
		this.draw();
	}, this);
};

GamePiece.prototype.rotateTo = function(position){
	this.domElement.display = 'none';
	this.currentPosition = position;
	this.domElement.className = 'gamePiece tile' + this.currentPosition;
};

// Creates the gamepiece on the canvas
GamePiece.prototype.draw = function(row, column){
	// Update position
	if (this.hold){
		this.domElement.style.opacity = .5;
		this.domElement.style.filter = 'alpha(opacity=50)';
		this.domElement.title = 'Click to release';
	} else {
		this.domElement.style.opacity = 1;
		this.domElement.style.filter = 'alpha(opacity=100)';
		this.domElement.title = 'Click to hold';
	}

	if ((typeof(row) != 'undefined') && (typeof(column) != 'undefined')){
		// calc the parent (board) offset / position
		var top = (row * 64) + 13;
		var left = (column * 64) + 13;
		
		if (row > 0) top += (5 * row);
		if (column > 0) left += (4 * column);
		
		// update dom positions
		this.domElement.style.top = top + 'px';
		this.domElement.style.left = left + 'px';
	}	
};

GamePiece.prototype.highlightMatch = function(position){
	if (!this.hold){
		var match = document.createElement('DIV');
		match.className = 'highlighter match' + position;
		this.domElement.appendChild(match);
	}
};

GamePiece.prototype.clearHighlighting = function(){
	if (this.domElement.childNodes.length > 0){
		for (var j = (this.domElement.childNodes.length - 1); j >= 0; j--){
			var child = this.domElement.childNodes[j];
			this.domElement.removeChild(child);
		}
	}
};

//
// Begin game 'play'
//
window.onload = function(){
	var matchLabel = Utils.Get('matchCount');
	var scoreLabel = Utils.Get('currentScore');
	var nameLabel = Utils.Get('playerName');
	var rollButton = Utils.Get('btnRoll');
	
	// supports simluations
	var bRunSim = false;
	var hSimTimer = null;
	
	var g = new GameBoard('gameBoard');
	g.playerName = 'Player 1';
	g.init();
	g.draw();
	g.findMatches();
	
	nameLabel.innerHTML = g.playerName;
	matchLabel.innerHTML = g.matches;
	scoreLabel.innerHTML = g.currentScore;
	
    // Handle clicking the 'roll' button
	rollButton.onclick = function(){
		g.reset();
		g.findMatches();
		matchLabel.innerHTML = g.matches;
		scoreLabel.innerHTML = g.currentScore;
	};
};
