import mitt from "mitt";
import { lerp, modulo } from "../util/math";

export class Slider {
  e = mitt();

  _factor = 0.0015;
  _snap = 0.13;
  _damping = 0.98;

  down = false;

  movement = 0;
  speed = 0;
  position = 0;
  lerp = 0;

  pointer = {
    x: 0,
    mx: 0,
    sx: 0,
    ox: 0,
    dx: 0,
  };

  store = {
    x: null,
  };

  current = 0;

  constructor({
    el = document.body,
    total = 0,
    cb = {
      onNew: null,
    },
  }) {
    this.total = total;
    this.init(el);
  }

  init(el) {
    el.addEventListener("mousedown", this.onMouseDown.bind(this));
    el.addEventListener("mousemove", this.onMouseMove.bind(this));
    el.addEventListener("mouseup", this.onMouseUp.bind(this));
    window.addEventListener("mouseout", this.onMouseUp.bind(this));

    hey.on("homePos", (pos) => {
      // console.log(pos);
      this._factor = hey.homePos > 0.5 ? 0.003 : 0.0015;
    });
  }

  onMouseDown(e) {
    this.down = true;

    this.pointer.x = this.pointer.ox = e.clientX;
  }

  onMouseMove(e) {
    if (!this.down) return;

    this.pointer.x = e.clientX;
    this.pointer.dx = e.clientX - this.pointer.ox;

    if (this.store.x === null) {
      this.store.x = e.screenX;
    } else {
      this.pointer.mx = e.screenX - this.store.x;
      this.store.x = e.screenX;
    }

    this.speed = this.pointer.mx * this._factor;
  }

  onMouseUp(e) {
    this.down = false;
    this._current = this.position;

    this.pointer.x = e.clientX;
    this.store.x = null;
  }

  render(t) {
    this.movement += this.speed;
    this.speed *= this._damping;

    if (!this.down || hey.homePos > 0.5) {
      this.rounded = Math.round(this.movement);

      // rounding type 1
      this.movement = lerp(this.movement, this.rounded, this._snap);

      // rounding type 2
      //   const diff = this.rounded - this.movement;
      //   const calc = Math.sign(diff) * Math.pow(Math.abs(diff), 0.75) * 0.1;
      //   this.movement += calc;
    }

    this.position = this.movement;

    this.lerp = lerp(this.lerp, this.position, 0.05);
    // console.log(this.lerp);

    // console.log(this.position);

    return this.lerp;
  }
}
