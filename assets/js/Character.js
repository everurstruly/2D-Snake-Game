import { FOOD_STATE } from './Enums.js';

export function SnakeFood() {
	this.state = FOOD_STATE.growth,
	this.clr = 'firebrick',
	this.coordX = 0,
	this.coordY = 0
}

export function SnakeBodyPart(x, y) {
	this.coordX = x;
	this.coordY = y;
}

export function Snake() {
	this.body = [];
	this.head = () => this.body[0];
	this.tail = () => this.body[this.body.length-1];
	this.stomach = () => this.body.slice(1, -1);
	this.addNewHead = (head) => this.body.unshift(head);
	this.removeLastTail = () => this.body.pop();
	this.foodEaten = { growth: 0 }
	this.reborn = () => {
		this.foodEaten.growth = 0;
		this.body = [
			new SnakeBodyPart(0, 5), 
			new SnakeBodyPart(1, 5), 
			new SnakeBodyPart(2, 5)
		]
	}

	this.reborn();
}

export function SnakeClrOutfit() {
	this.default = () => {
		this.leftEye = 'black';
		this.rightEye = 'black';
		this.head = 'orange';
		this.tail = '#141414';
		this.stomachOdd = 'green';
		this.stomachEven = 'darkgreen';
		this.outlineBody = 'black';
		this.outlineHead = 'black';
	}
	this.default();
}