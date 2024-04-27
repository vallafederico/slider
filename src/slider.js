import { lerp, map, modulo } from "./util/math";

/* outside ctrls */
const speedDial = document.querySelector(".speed");

export class Slider {
  // params
  _center = true;
  _factor = 0.008;
  _isEnabled = true;
  _snapping = true;
  _bouncy = 0.45;
  _lerp = 0.1;

  // slider
  time = 0;
  current = 0;
  target = 0;
  mvmt = 0;

  lspeed = 0;
  speed = 0;

  progress = 0;

  pointerDown = false;
  pointer = {
    x: 0,
    ox: 0,
    cx: 0,
    sx: 0,
    psx: 0,
  };

  store = {
    itemWidth: 0,
    max: 0,
  };

  currentSlide = 0;

  constructor(element = document.querySelector("[data-slider='w']")) {
    this.element = element;
    this.slides = [...this.element.children];
    this.store.max = this.slides.length - 1;

    this.resize();
    this.init();

    document.onkeydown = (e) => {
      if (e.key === "ArrowRight") {
        this.slideTo(this.currentSlide + 1);
      } else if (e.key === "ArrowLeft") {
        this.slideTo(this.currentSlide - 1);
      }
    };
  }

  init() {
    this.element.addEventListener("pointerdown", this.onDown.bind(this));
    this.element.addEventListener("pointerup", this.onUp.bind(this));
    this.element.addEventListener("pointermove", this.onMove.bind(this));
    this.element.addEventListener("pointerleave", this.onUp.bind(this));

    // initial state
    this.slides[0].classList.add("active");
  }

  // -- events

  onDown(e) {
    this.pointer.ox = e.clientX;
    this.pointerDown = true;
  }

  onUp(e) {
    this.pointerDown = false;
    this.pointer.ox = 0;

    this.pointer.sx = 0;
    this.pointer.psx = 0;
    this.lspeed = 0;
  }

  onMove(e) {
    if (!this._isEnabled) return;
    if (!this.pointerDown) return;

    this.pointer.x = e.clientX - this.pointer.ox;
    this.current += this.pointer.x * this._factor;
    this.pointer.ox = e.clientX;
    this._direction = this.pointer.x;

    if (this.pointer.psx === 0) {
      this.pointer.psx = e.screenX;
    }

    this.pointer.sx = e.screenX - this.pointer.psx;
    this.lspeed += this.pointer.sx * 0.01;
    this.pointer.psx = e.screenX;
  }

  set _direction(dir) {
    if (dir > 0) {
      this.direction = -1;
    } else {
      this.direction = 1;
    }
  }

  set _currentSlide(val) {
    const curr = Math.round(val * -1);
    if (curr < 0 || curr > this.store.max) return;
    if (this.currentSlide === curr) return;

    queueMicrotask(() => {
      this.slides[curr].classList.add("active");
      this.slides[this.currentSlide].classList.remove("active");

      this.currentSlide = curr;
    });
  }

  slideTo(index) {
    if (!this._isEnabled) return;
    this.current = index * -1;
  }

  /** Resize */
  resize() {
    let total = 0;
    this.slides.forEach((slide, i) => (total += slide.offsetWidth));
    this.store.itemWidth = total / this.slides.length;

    if (this._center) {
      const diff = this.element.clientWidth - this.store.itemWidth;
      this.element.style.paddingLeft = `${diff / 2}px`;
    }
  }

  /** Render */
  render() {
    this.time++;

    this.renderSpeed();
    this.renderProgress();

    if (this.time % 5 === 0) {
      this.renderCurrent();
    }

    this.renderRounding();
    this.renderClamp();

    this.target = lerp(this.target, this.current, this._lerp);

    this.renderDOM();
  }

  renderDOM() {
    this.slides.forEach((slide) => {
      slide.style.transform = `translateX(${this.target * this.store.itemWidth}px)`;
    });
  }

  renderRounding() {
    if (!this.pointerDown && this._snapping) {
      this.rounded = Math.round(this.current);
      const diff = this.rounded - this.current;
      const calc = Math.sign(diff) * Math.pow(Math.abs(diff), 0.75) * 0.1;
      this.current += calc;
    }
  }

  renderClamp() {
    if (this.current > this._bouncy) {
      this.current = this._bouncy;
    } else if (this.current < -this.store.max - this._bouncy) {
      this.current = -this.store.max - this._bouncy;
    }
  }

  renderSpeed() {
    this.speed = lerp(this.speed, this.lspeed, 0.1);
    this.lspeed *= 0.9;
    speedDial.style.transform = `translateX(${this.speed * 1000}%)`;
  }

  renderProgress() {
    this.progress = map(this.current, 0, this.store.max, 0, 1);
  }

  renderCurrent() {
    this._currentSlide = this.current;
  }
}
