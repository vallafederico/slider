import { lerp, map } from "./util/math";

function mod(value, x) {
  return ((value % x) + x) % x;
}

function symmetricMod(value, x) {
  let modded = mod(value, 2 * x);
  return modded >= x ? (modded -= 2 * x) : modded;
}

const def = {
  parallax: 50,
};

/* outside ctrls */
const speedDial = document.querySelector(".speed");
const progressDial = document.querySelector(".bar");

export class Slider {
  // params
  _center = true;
  _factor = 0.005;
  _isEnabled = true;
  _snapping = true;
  _bouncy = 0.45;
  _lerp = 0.1;
  _infinite = true;
  _parallax = true;

  // slider
  time = 0;
  current = 0;
  target = 0;
  mvmt = 0;

  lspeed = 0;
  speed = 0;

  progress = 0;

  pointerDown = false;
  isDragging = false;
  // preventClick = false;

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

    // --- debug

    this.slides.forEach((slide, i) => {});

    document.onkeydown = (e) => {
      if (e.key === "ArrowRight") {
        this.slideTo(this.current - 1);
      } else if (e.key === "ArrowLeft") {
        this.slideTo(this.current + 1);
      }
    };
    // --- debug
  }

  init() {
    if (this._parallax) this.initParallax();
    this.initEvents();

    // initial state
    this.slides[0].classList.add("active");
  }

  initEvents() {
    this.element.addEventListener("pointerdown", this.onDown.bind(this));
    this.element.addEventListener("pointerup", this.onUp.bind(this));
    this.element.addEventListener("pointermove", this.onMove.bind(this));
    this.element.addEventListener("pointerleave", this.onUp.bind(this));
  }

  initParallax() {
    this.parallax = this.slides.map((slide, i) => {
      const item = slide.querySelector("[data-parallax]");
      const amount = +item.getAttribute("data-parallax") || def.parallax;
      return { item, amount };
    });
  }

  // -- events
  onDown(e) {
    this.pointer.ox = e.clientX;
    this.pointerDown = true;

    this.element.style.cursor = "grabbing";

    return false;
  }

  onUp(e) {
    this.pointerDown = false;
    this.pointer.ox = 0;

    this.pointer.sx = 0;
    this.pointer.psx = 0;
    this.lspeed = 0;

    this.element.style.cursor = "grab";
  }

  onMove(e) {
    if (!this._isEnabled) return;
    if (!this.pointerDown) return;

    this.pointer.x = e.clientX - this.pointer.ox;
    this.current += this.pointer.x * this._factor;
    this.pointer.ox = e.clientX;
    this._direction = this.pointer.x;

    if (this.pointer.psx === 0) this.pointer.psx = e.screenX;

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
    let curr = Math.round(val * -1);
    if (this._infinite) curr = mod(curr, this.store.max + 1);

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

    // speed calculation
    const speed = this.current - index;
    this.lspeed -= speed;

    // > slide to
    this.current = index;
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
      this._currentSlide = this.current;
    }

    this.renderRounding();
    if (!this._infinite) this.renderClamp();

    this.target = lerp(this.target, this.current, this._lerp);

    this.renderDOM();
  }

  renderDOM() {
    this.slides.forEach((slide, index) => {
      const x = this.renderSlide(index, slide);
      slide.style.transform = `translateX(${x * this.store.itemWidth}px)`;
    });
  }

  renderSlide(index, slide) {
    // parallax
    if (this.parallax && this.parallax.length > 0 && this.parallax[index]) {
      const parallax = this.target + index;
      const x = symmetricMod(parallax, (this.store.max + 1) / 2);

      this.parallax[index].item.style.transform =
        `translateX(${x * this.parallax[index].amount}%)`;
    }

    // infinite loop
    if (this._infinite) {
      let pos = this.target + index;
      const x = symmetricMod(pos, (this.store.max + 1) / 2);

      return x - index;
    } else {
      return this.target;
    }
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
    this.speed = lerp(this.speed, this.lspeed, this._lerp);
    this.lspeed *= 0.9;
    speedDial.style.transform = `translateX(${this.speed * 1000}%)`;
  }

  renderProgress() {
    this.progress = mod(map(Math.abs(this.target), 0, this.store.max, 0, 1), 1);

    progressDial.style.transform = `scaleX(${this.progress})`;
  }
}
