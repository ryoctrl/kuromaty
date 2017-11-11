/*!
    Copyright 2017 Kuromatch
*/
"use strict";

import { Position, PositionLike } from "./Position";
import { Decimal } from "decimal.js-light";

export class PositionSet {
    private positions: { [priceKey: string]: Position } = {};
    private _size = new Decimal(0);
    private _length = 0;
    private _totalAmount = new Decimal(0);
    private _maxTime = 0;

    constructor(positions?: PositionLike[]) {
        if (positions) {
            positions.forEach(position => {
                this.add(new Position(position));
            })
        }
    }

    get size() {
        return this._size.toNumber();
    }

    add(position: Position) {

        this._size = this._size.plus(position.size);
        this._maxTime = Math.max(this._maxTime, position.time);

        const amount = position.price.mul(position.size);
        this._totalAmount = position.side === "L" ? this._totalAmount.plus(amount) : this._totalAmount.minus(amount);

        const key = position.price.toString();
        const existed = this.positions[key];

        if (existed) {
            existed.merge(position);
            return;
        }

        this.positions[key] = position;
        this._length++;
    }

    forEach(callbackFn) {
        const positions = this.positions;
        Object.keys(positions).forEach(key => callbackFn(positions[key], key));
    }

    marginAgainst(price: number) {

        let margin = 0;
        this.forEach(pos => {
            margin += pos.marginAgainst(price);
        });

        return margin;
    }

    getMergedPosition() {
        return new Position({
            time: this._maxTime,
            price: this._totalAmount.dividedBy(this._size).todp(0, 2).abs().toNumber(),
            size: this._size.toNumber(),
            side: this._totalAmount.isPositive() ? "L" : "S"
        });
    }

    isEmpty() {
        return this._length === 0;
    }
}
