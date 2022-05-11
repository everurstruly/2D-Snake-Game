import { WALL, NATURE, FOOD, FOOD_STATE } from './Enums.js';
import { GRID_DIRECTION, GRID_DIRECTION_OPPOSITES } from './Enums.js';
import { MAP_DETAIL, getLevel } from './GameMap.js';
import { SnakeFood } from './Character.js';
import { SnakeClrOutfit } from './Character.js';
import { Snake, SnakeBodyPart } from './Character.js';

const SCREEN_CAN_PLAY = 720;

const EAT_SFX = document.querySelector('.snake-game__assets .activity-eat');
const DEAD_SFX = document.querySelector('.snake-game__assets .checkpoint-dead');

const BRICK_IMG = document.querySelector('.snake-game__assets .brick-wall');
const APPLE_RED = document.querySelector('.snake-game__assets .apple-red');

const PLAY_AGAIN_BTN = document.querySelector('.snake-game__controller .play-again');
const PAUSE_PLAY_BTN = document.querySelector('.snake-game__controller .pause-play');
const GAME_SOUNDS_BTN = document.querySelector('.snake-game__controller .game-sounds-toggle');
const D_BTNS = document.querySelectorAll('.snake-game__controller [data-direction]');
D_BTNS.forEach(button => button.addEventListener('click', handleControllerDirection));

const GAME_START_SCREEN = document.querySelector('.snake-game__can-play');
const SCORE = document.querySelector('#snake-game__score-count');
const HIGHSCORE = document.querySelector('#snake-game__highscore-count');
const PAUSE_PLAY_OVERLAY = document.querySelector('#snake-game .pause-play-overlay');
const snakeBoardCanvas = document.getElementById('snake-game__board');
const snakeBoardCtx = snakeBoardCanvas.getContext('2d');
snakeBoardCanvas.height = MAP_DETAIL.tileHeight * MAP_DETAIL.rows;
snakeBoardCanvas.width = MAP_DETAIL.tileWidth * MAP_DETAIL.columns;
PAUSE_PLAY_OVERLAY.style.width = `${snakeBoardCanvas.width}px`;

const LEVEL_1 = getLevel(1);
const BRICK_BOUNDARY_COORDS = LEVEL_1.getBoundaryCoords(WALL.brick);
const SNAKE_FOOD = new SnakeFood();
const SNAKE_CHARACTER = new Snake();
const SNAKE_COSTUME = new SnakeClrOutfit();

let gameEngineLoop_1,
	gameEngineSpeed = 5;

let gameSoundsOn = true;
let gameOver, 
	gamePaused, 
	gamePlayInteractionStarted;

let scoreValue, 
	snakeTouchFood;

let snakeDesiredDirection, 
	snakeCurrentDirection, 
	snakePrevDirection;

// Func Order
// Handle - On(raise) -> Util -> Did(util2.0) -> Update -> Set -> Draw

GAME_START_SCREEN.innerText = GAME_START_SCREEN.dataset.loadingMsg;
GAME_START_SCREEN.classList.add('show');

GAME_SOUNDS_BTN.addEventListener('click', toggleGameSounds);
PAUSE_PLAY_BTN.addEventListener('click', pausePlaySnakeGame);
PLAY_AGAIN_BTN.addEventListener('click', startNewGame);
gameEngineLoop_1 = requestAnimationFrame(handleGameLoop);
document.addEventListener('keydown', onKeydown);
window.addEventListener('load', handleGameAssetsReady);

function handleGameAssetsReady() {
	if (window.outerWidth < SCREEN_CAN_PLAY) {
		GAME_START_SCREEN.innerText = GAME_START_SCREEN.dataset.cantPlayMsg;
		GAME_START_SCREEN.classList.add('show');
	} else {
		startNewGame();
		GAME_START_SCREEN.classList.remove('show');
	}
}

function handleGameSounds() {
	if (!gameSoundsOn) return;
	if (snakeTouchFood) EAT_SFX.play();
	if (gameOver) DEAD_SFX.play();
}

function handleGameUpdate() {
	if (gamePaused || !gamePlayInteractionStarted) return;
	// order of funcitons matter!
	updateSnakeDirection();
	updateGameOver();
	updateSnakeTouchFood()
	updateSnakeFood();
	updateSnake();
	updateGameScores();
}

function handleGameDraw() {
	// order of funcitons matter!
	drawTileMap();
	drawSnakeFood();
	drawSnake();
	drawGameScores();
	if (gamePaused) {
		PAUSE_PLAY_OVERLAY.classList.add('show');
	} else {
		PAUSE_PLAY_OVERLAY.classList.remove('show');
	}

	if (gamePlayInteractionStarted) {
		PAUSE_PLAY_BTN.removeAttribute('disabled');
	} else {
		PAUSE_PLAY_BTN.setAttribute('disabled', 'true');
	}
}

let lastRenderFrameTime = 0;
function handleGameLoop(currentFrameRenderTime) {
	requestAnimationFrame(handleGameLoop);
	if (gameOver) return;
	const timeLastRenderedFrame = (currentFrameRenderTime-lastRenderFrameTime)/1000;
	if (timeLastRenderedFrame < (1/gameEngineSpeed)) return;
	lastRenderFrameTime = currentFrameRenderTime;
	handleGameSpeed();
	handleGameUpdate();
	handleGameDraw();
	handleGameSounds();
}

function handleGameSpeed() {
	if (snakeTouchFood) {
		gameEngineSpeed += .2;
	}
}

function handleControllerDirection(e) {
	setGamePlayInteractionStarted();
	const direction = e.currentTarget.dataset.direction;
	snakeDesiredDirection = GRID_DIRECTION[direction];
}

function onKeydown(e) {
	setGamePlayInteractionStarted();

	// space key
	if (e.keyCode === 32) {
		pausePlaySnakeGame();
	}
	// up-arow or w key
	if (e.keyCode === 38 || e.keyCode === 87) {
		snakeDesiredDirection = GRID_DIRECTION.up;
	}
	// right-arow or d key
	if (e.keyCode === 39 || e.keyCode === 68) {
		snakeDesiredDirection = GRID_DIRECTION.right;
	}
	// down-arow or s key
	if (e.keyCode === 40 || e.keyCode === 83) {
		snakeDesiredDirection = GRID_DIRECTION.down;
	}
	// left-arow or a key
	if (e.keyCode === 37 || e.keyCode === 65) {
		snakeDesiredDirection = GRID_DIRECTION.left;
	}
}

function startNewGame() {
	gameEngineSpeed = 5;
	gameOver = false;
	gamePaused = false;
	gamePlayInteractionStarted = false;
	scoreValue = 0;
	snakeTouchFood = false;
	snakeDesiredDirection = GRID_DIRECTION.right;
	snakeCurrentDirection = snakeDesiredDirection;
	snakePrevDirection = snakeCurrentDirection;
	SNAKE_CHARACTER.reborn();
	SNAKE_COSTUME.default();
	setRandomSnakeCoord();
	setRandomFoodCoord();
	handleGameLoop();
}

function toggleGameSounds() {
	gameSoundsOn = !gameSoundsOn;
	GAME_SOUNDS_BTN.setAttribute('data-sounds-on', gameSoundsOn);
}

function pausePlaySnakeGame() {
	if (gameOver || !gamePlayInteractionStarted) return;
	gamePaused = !gamePaused;
	PAUSE_PLAY_BTN.setAttribute('data-paused', gamePaused);
}

function didCollideRect(hunter, hunterDirectionOnCollision, target) {
	switch(hunterDirectionOnCollision) {
		case GRID_DIRECTION.up:
			// collide targets down
			if (target.coordY+MAP_DETAIL.tileHeight === hunter.coordY 
				&& target.coordX === hunter.coordX)
				return true;
			break;
		case GRID_DIRECTION.right:
			// collide targets left
			if (target.coordX === hunter.coordX+MAP_DETAIL.tileWidth 
				&& target.coordY === hunter.coordY)
				return true;
			break;
		case GRID_DIRECTION.down:
			// collide targets top
			if (target.coordY === hunter.coordY+MAP_DETAIL.tileHeight
				&& target.coordX === hunter.coordX)
				return true;
			break;
		case GRID_DIRECTION.left:
			// collide targets right
			if (target.coordX+MAP_DETAIL.tileWidth === hunter.coordX 
				&& target.coordY === hunter.coordY)
				return true;
			break;
		default:
			return false;
			break;
	}
}

function didCollideCurve(hunter, hunterDirectionOnCollision, target) {
	switch(hunterDirectionOnCollision) {
		case GRID_DIRECTION.up:
			// collide targets down
			if (target.coordY+MAP_DETAIL.tileHeight === hunter.coordY 
				&& target.coordX === hunter.coordX)
				return true;
			break;
		case GRID_DIRECTION.right:
			// collide targets left
			if (target.coordX-MAP_DETAIL.tileWidth === hunter.coordX 
				&& target.coordY === hunter.coordY)
				return true;
			break;
		case GRID_DIRECTION.down:
			// collide targets top
			if (target.coordY === hunter.coordY+MAP_DETAIL.tileHeight
				&& target.coordX === hunter.coordX)
				return true;
			break;
		case GRID_DIRECTION.left:
			// collide targets right
			if (target.coordX+MAP_DETAIL.tileWidth === hunter.coordX 
				&& target.coordY === hunter.coordY)
				return true;
			break;
		default:
			return false;
			break;
	}
}

function updateGameOver() {
	BRICK_BOUNDARY_COORDS.forEach(brick => {
		if (didCollideRect(SNAKE_CHARACTER.head(), snakeCurrentDirection, brick)) {
			gameOver = true;
			return;
		}
	})

	!gameOver 
	&& SNAKE_CHARACTER.body.forEach((bodyPart, index) => {
		if (didCollideRect(SNAKE_CHARACTER.head(), snakeCurrentDirection, bodyPart)) {
			gameOver = true;
			return;
		}
	})
}

function updateSnakeTouchFood() {
	 if (didCollideCurve(
			SNAKE_CHARACTER.head(), snakeCurrentDirection, SNAKE_FOOD)) {
	 	snakeTouchFood = true;
	 } else snakeTouchFood = false;
}

function updateSnakeFood() {
	if (snakeTouchFood) {
		setRandomFoodCoord();
	}
}

function updateSnakeDirection() {
	snakePrevDirection = snakeCurrentDirection;
	if (
		(snakeCurrentDirection===GRID_DIRECTION.up
		  && snakeDesiredDirection===GRID_DIRECTION_OPPOSITES.up
		) 
		|| (snakeCurrentDirection===GRID_DIRECTION.right
		  && snakeDesiredDirection===GRID_DIRECTION_OPPOSITES.right
		)
		|| (snakeCurrentDirection===GRID_DIRECTION.down
		  && snakeDesiredDirection===GRID_DIRECTION_OPPOSITES.down
		)
		|| (snakeCurrentDirection===GRID_DIRECTION.left
		  && snakeDesiredDirection===GRID_DIRECTION_OPPOSITES.left
		)
	) {	 return; }
	snakeCurrentDirection = snakeDesiredDirection;
}

function getNewSnakeHead() {
	let newHead = new SnakeBodyPart();
	switch(snakeCurrentDirection) {
		case GRID_DIRECTION.up:
			newHead.coordX = SNAKE_CHARACTER.head().coordX;
			newHead.coordY = SNAKE_CHARACTER.head().coordY-MAP_DETAIL.tileHeight;
			break;
		case GRID_DIRECTION.right:
			newHead.coordY = SNAKE_CHARACTER.head().coordY;
			newHead.coordX = SNAKE_CHARACTER.head().coordX+MAP_DETAIL.tileWidth;
			break;
		case GRID_DIRECTION.down:
			newHead.coordX = SNAKE_CHARACTER.head().coordX;
			newHead.coordY = SNAKE_CHARACTER.head().coordY+MAP_DETAIL.tileHeight;
			break;
		case GRID_DIRECTION.left:
			newHead.coordY = SNAKE_CHARACTER.head().coordY;
			newHead.coordX = SNAKE_CHARACTER.head().coordX-MAP_DETAIL.tileWidth;
			break;
	}
	return newHead;
}

function updateSnake() {
	if (gameOver) {
		SNAKE_COSTUME.LeftEye = '#629f65';
		SNAKE_COSTUME.rightEye = '#629f65';
		SNAKE_COSTUME.head = 'whitesmoke';
		SNAKE_COSTUME.tail = '#629f65';
		SNAKE_COSTUME.stomachEven = '#629f65';
		SNAKE_COSTUME.stomachOdd = '#629f65';
		SNAKE_COSTUME.bodyOutlineClr = 'darkgreen';
	} else if (snakeTouchFood) {
		SNAKE_COSTUME.leftEye = 'white';
		SNAKE_COSTUME.rightEye = 'white';
		SNAKE_CHARACTER.foodEaten.growth++;
		SNAKE_CHARACTER.addNewHead(getNewSnakeHead());
	} else {
		SNAKE_COSTUME.leftEye = 'black';
		SNAKE_COSTUME.rightEye = 'black';
		SNAKE_CHARACTER.addNewHead(getNewSnakeHead());
		SNAKE_CHARACTER.removeLastTail();
	}
}

function updateGameScores() {
	scoreValue = SNAKE_CHARACTER.foodEaten.growth*9;
}

function setGamePlayInteractionStarted() {
	if (!gamePlayInteractionStarted) 
		gamePlayInteractionStarted = true;
}

function setRandomSnakeCoord() {
	let randLocationAvailable = true;
	let spaceRightFromTail = SNAKE_CHARACTER.body.length + 7;

	let randY = Math.floor(Math.random()*(
		LEVEL_1.tileMap.length-1))*MAP_DETAIL.tileHeight;
	let randX_1 = Math.floor(Math.random()*(
		LEVEL_1.tileMap[0].length-spaceRightFromTail))*MAP_DETAIL.tileWidth;
	let randX_2 = randX_1+MAP_DETAIL.tileWidth
	let randX_3 = randX_2+MAP_DETAIL.tileWidth;

	BRICK_BOUNDARY_COORDS.forEach(boundry => {
		if (boundry.coordY===randY
			&& (boundry.coordX===randX_1 
				|| boundry.coordX===randX_2
				|| boundry.coordX===randX_3)
		) { 
			randLocationAvailable = false;
			return;
		}
	})

	if (randLocationAvailable) {
		SNAKE_CHARACTER.tail().coordX = randX_1;
		SNAKE_CHARACTER.stomach()[0].coordX = randX_2;
		SNAKE_CHARACTER.head().coordX = randX_3;
		SNAKE_CHARACTER.body.forEach((part, index) => part.coordY = randY);		
	} else setRandomSnakeCoord();
}

function setRandomFoodCoord() {
	let randLocationAvailable = true;
	let randY = Math.floor(
		Math.random()*(LEVEL_1.tileMap.length-1))*MAP_DETAIL.tileWidth;
	let randX = Math.floor(
		Math.random()*(LEVEL_1.tileMap[0].length-1))*MAP_DETAIL.tileHeight;
	
	SNAKE_CHARACTER.body.forEach(part => {
		if (part.coordX === randX && part.coordY === randY) {
			randLocationAvailable = false;
			return;
		}
	})

	randLocationAvailable 
	&& BRICK_BOUNDARY_COORDS.forEach(boundry => {
		if (boundry.coordX === randX && boundry.coordY === randY) {
			randLocationAvailable = false;
			return;
		}
	})

	if (randLocationAvailable) {
		SNAKE_FOOD.coordX = randX;
		SNAKE_FOOD.coordY = randY;		
	} else setRandomFoodCoord();
}

function drawSquare(clr, x, y, size) {
	snakeBoardCtx.fillStyle = clr;
	snakeBoardCtx.fillRect(x, y, size, size);
}

function drawSquareStroke(clr, x, y, size) {
	snakeBoardCtx.strokeStyle = clr;
	snakeBoardCtx.strokeRect(x, y, size, size);
}

function drawWall(img, x, y) {
	snakeBoardCtx.drawImage(
		img, x, y, 
		MAP_DETAIL.tileWidth, MAP_DETAIL.tileHeight
	);
}

function drawTileMap() {
	const LAWN_ONE = '#acd954';
	const LAWN_TWO = '#8eb541';
	LEVEL_1.tileMap.forEach((row, row_index) => {
		row.forEach((col, col_index) => {
			let coordY = row_index*MAP_DETAIL.tileHeight;
			let coordX = col_index*MAP_DETAIL.tileWidth;
			if (col === WALL.brick) drawWall(BRICK_IMG, coordX, coordY);
			if (col === NATURE.lawn) {
				// alternate lawn clr for every row - pattern
				if (row_index%2 === 0) {
					if (col_index%2 === 0)
						return drawSquare(LAWN_ONE, coordX, coordY, MAP_DETAIL.tileWidth);
					return drawSquare(LAWN_TWO, coordX, coordY, MAP_DETAIL.tileWidth);
				} 
				// alternate lawn clr for every column - pattern
				else {
					if (col_index%2 === 0)
						return drawSquare(LAWN_TWO, coordX, coordY, MAP_DETAIL.tileWidth);
					return drawSquare(LAWN_ONE, coordX, coordY, MAP_DETAIL.tileWidth);
				}
			}
		})
	});
}

function drawSnakeFood() {
	let img;
	switch(SNAKE_FOOD.state) {
		case FOOD_STATE.poisoned:
			img = APPLE_PURPLE;
			break;
		default:
			img = APPLE_RED;
			break;
	}
	snakeBoardCtx.drawImage(img, 
		SNAKE_FOOD.coordX, SNAKE_FOOD.coordY,
		MAP_DETAIL.tileWidth, MAP_DETAIL.tileHeight
	);
	/*snakeBoardCtx.beginPath();
	snakeBoardCtx.fillStyle = SNAKE_FOOD.clr;
	snakeBoardCtx.arc(
		SNAKE_FOOD.coordX+MAP_DETAIL.tileWidth/2, 
		SNAKE_FOOD.coordY+MAP_DETAIL.tileWidth/2, 
		MAP_DETAIL.tileWidth/2, 
		0, Math.PI * 2, false);
	snakeBoardCtx.fill();
	snakeBoardCtx.closePath();*/
}

function drawSnake() {
	function drawSnakeEye(clr, x, y, r) {
		snakeBoardCtx.beginPath();
		snakeBoardCtx.fillStyle = clr;
		snakeBoardCtx.arc(x, y, r, 0, Math.PI*2, false);
		snakeBoardCtx.fill();
		snakeBoardCtx.closePath();
	}

	const HEAD_FEATURES_BOUNDARY = 1/3.2 * MAP_DETAIL.tileWidth;
	const HEAD_FEATURES_RADIAL_SCALE = 1/8;
	let headFeatures = {
		radius: HEAD_FEATURES_RADIAL_SCALE * MAP_DETAIL.tileWidth,
		top: SNAKE_CHARACTER.head().coordY + HEAD_FEATURES_BOUNDARY,
		right: SNAKE_CHARACTER.head().coordX + MAP_DETAIL.tileWidth-HEAD_FEATURES_BOUNDARY,
		bottom: SNAKE_CHARACTER.head().coordY + MAP_DETAIL.tileHeight-HEAD_FEATURES_BOUNDARY,
		left: SNAKE_CHARACTER.head().coordX + HEAD_FEATURES_BOUNDARY,
	}

	// stomach
	SNAKE_CHARACTER.body.forEach((part, index) => {
		if (index>0 && index<SNAKE_CHARACTER.body.length-1 
			&& index%2===0) {
			drawSquare(
				SNAKE_COSTUME.stomachEven,
				part.coordX, 
				part.coordY, 
				MAP_DETAIL.tileWidth
			);
		}

		if (index>0 && index<SNAKE_CHARACTER.body.length-1 
			&& index%2!==0) {
			drawSquare(
				SNAKE_COSTUME.stomachOdd,
				part.coordX, 
				part.coordY, 
				MAP_DETAIL.tileWidth
			);
		}
	})

	// tail
	drawSquare(
		SNAKE_COSTUME.tail,
		SNAKE_CHARACTER.tail().coordX, 
		SNAKE_CHARACTER.tail().coordY,
		MAP_DETAIL.tileWidth
	);

	// head
	drawSquare(
		SNAKE_COSTUME.head,
		SNAKE_CHARACTER.head().coordX, 
		SNAKE_CHARACTER.head().coordY, 
		MAP_DETAIL.tileWidth
	);

	SNAKE_CHARACTER.body.forEach((part, index) => {
		// stroke each body part
		drawSquareStroke(SNAKE_COSTUME.outlineBody, 
			SNAKE_CHARACTER.body[index].coordX, 
			SNAKE_CHARACTER.body[index].coordY, 
			MAP_DETAIL.tileWidth
		);
	})

	// eyes
	switch (snakeCurrentDirection) {
		case GRID_DIRECTION.up:
			drawSnakeEye(
				SNAKE_COSTUME.leftEye, headFeatures.left, headFeatures.bottom, 
				headFeatures.radius);
			drawSnakeEye(
				SNAKE_COSTUME.leftEye, headFeatures.right, headFeatures.bottom, 
				headFeatures.radius);
			break;
		case GRID_DIRECTION.right:
			drawSnakeEye(
				SNAKE_COSTUME.leftEye, headFeatures.right, headFeatures.top, 
				headFeatures.radius);
			break;
		case GRID_DIRECTION.down:
			drawSnakeEye(
				SNAKE_COSTUME.leftEye, headFeatures.left, headFeatures.top, 
				headFeatures.radius);
			drawSnakeEye(
				SNAKE_COSTUME.leftEye, headFeatures.right, headFeatures.top, 
				headFeatures.radius);
			break;
		case GRID_DIRECTION.left:
			drawSnakeEye(
				SNAKE_COSTUME.rightEye, headFeatures.left, headFeatures.top, 
				headFeatures.radius);
			break;
		default:
			drawSnakeEye(
				SNAKE_COSTUME.leftEye, headFeatures.right, headFeatures.top, 
				headFeatures.radius);
			drawSnakeEye(
				SNAKE_COSTUME.leftEye, headFeatures.right, headFeatures.bottom, 
				headFeatures.radius);
			break;
	}
}

function drawGameScores() {
	if (scoreValue < 10) SCORE.innerText = `0${scoreValue}`;
	else SCORE.innerText = scoreValue;
	if (gameOver) HIGHSCORE.innerText = SCORE.innerText;
}