import "./style/main.css";

import { Dom } from "./modules/dom";
import { Viewport } from "./modules/viewport";
import { Scroll } from "./modules/scroll";
import { Pages } from "./modules/pages";
import gsap from "./gsap";

import { Slider } from "./slider";
import { Embla } from "./embla";

class App {
  constructor() {
    this.body = document.querySelector("body");
    this.viewport = new Viewport();

    this.time = 0;

    this.init();
  }

  init() {
    this.scroll = new Scroll();
    this.pages = new Pages();
    this.dom = new Dom();

    this.initEvents();

    this.slider = new Slider();

    /** RAF should come from gsap */
    gsap.ticker.add((t) => this.render(t));
    this.render();
  }

  initEvents() {
    // prettier-ignore
    new ResizeObserver((entry) => this.resize(entry[0])).observe(this.body);
  }

  resize({ contentRect }) {
    this.slider?.resize();
  }

  render(t) {
    this.slider?.render(t);
  }

  /* Events */
}

window.app = new App();
