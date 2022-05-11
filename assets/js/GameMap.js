import { WALL, NATURE, FOOD } from './Enums.js';

export const MAP_DETAIL = {
	rows: 26,
	columns: 28,
	tileWidth: 22,
	tileHeight: 22
}

let levels = {
	list: [],
}

export function getLevel(level) {
	return levels.list[level-1];
}

class Level {
	constructor() {
		this.tileMap = Array(MAP_DETAIL.rows).fill(0)
			.map(row => Array(MAP_DETAIL.columns).fill(0));;
		this.getBoundaryCoords = (boundry) => {
			const boundryCoords = [];
			this.tileMap.forEach((row, row_index) => {
				row.forEach((col, col_index) => {
					if (this.tileMap[row_index][col_index] === boundry) {
						boundryCoords.push({
							coordX: col_index*MAP_DETAIL.tileWidth,
							coordY: row_index*MAP_DETAIL.tileHeight
						})
					}
				})
			})
			return boundryCoords;
		}
		levels.list.push(this);
	}
}

const level_1 = new Level();
level_1.tileMap
	.forEach((row, row_index) => {
	row.forEach((col, col_index) => {
		// edge boundry
		if (row_index === 0 
			|| row_index === MAP_DETAIL.rows-1) {
			level_1.tileMap[row_index][col_index] = WALL.brick;
		}

		// edge boundry
		else if (col_index === 0 
			|| col_index === MAP_DETAIL.columns-1) 
			level_1.tileMap[row_index][col_index] = WALL.brick;

		// safe paths - lawns
		else level_1.tileMap[row_index][col_index] = NATURE.lawn;
	})
});

const level_2 = new Level();
level_2.tileMap
	.forEach((row, row_index) => {
	row.forEach((col, col_index) => {
		// edge boundry
		if (row_index === 0 
			|| row_index === MAP_DETAIL.rows-1) {
			level_2.tileMap[row_index][col_index] = WALL.brick;
		}

		// edge boundry
		else if (col_index === 0 
			|| col_index === MAP_DETAIL.columns-1) 
			level_2.tileMap[row_index][col_index] = WALL.brick;

		// obstacle
		else if ( (row_index > 4 && row_index < 7)
			&& (col_index > 6 && col_index < 10)
		)
			level_2.tileMap[row_index][col_index] = WALL.brick;

		// safe paths - lawns
		else level_2.tileMap[row_index][col_index] = NATURE.lawn;
	})
});