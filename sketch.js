const CONFIG = {
  textSize: 16,
  initialVXMin: -1,
  initialVXMax: 1,
  initialVYMin: 8,
  initialVYMax: 15,
  fadeSpeed: 8,
  textColor: "#A1CCE2",
  bgColor: "#FFFFFF",
  startY: -50,
  explosionCount: 24,
  ellipseWidth: 200,
  ellipseHeight: 80,
  splashSpeed: 3,
  minOpacityDelay: 0,
  maxOpacityDelay: 20,
  fadeDuration: 15,
  dropletCount: 20,
  spawnInterval: 1,
  horizontalSpread: 1
};

class Letter {
  constructor(char, x, y, size, opacityDelay, isExplosion = false) {
    this.char = char;
    this.x = x;
    this.y = y;
    this.originX = x;
    this.originY = y;
    this.alpha = 255;
    this.size = size;
    this.dispersing = false;
    this.color = color(CONFIG.textColor);
    this.isExplosion = isExplosion;
    this.angle = 0;
    this.explosionFrame = 0;
    this.shouldRemove = false;
    this.hasExploded = false;
    this.opacityDelay = opacityDelay;
  }
  
  update() {
    if (this.shouldRemove) return;
    
    if (!this.dispersing) {
      this.x += this.vx;
      this.y += this.vy;
      
      if (this.y >= this.explodeYThreshold && !this.isExplosion && !this.hasExploded) {
        this.dispersing = true;
        this.hasExploded = true;
        this.explosionFrame = frameCount;
        this.createExplosion(this.x, this.y);
        this.shouldRemove = true;
      }
      
      if (this.x < -100 || this.x > width + 100 || this.y > height + 100) {
        this.shouldRemove = true;
      }
    } else {
      this.x += this.vx;
      this.y += this.vy;
      
      const timeSinceExplosion = frameCount - this.explosionFrame;
      
      if (timeSinceExplosion > this.opacityDelay) {
        const fadeProgress = (timeSinceExplosion - this.opacityDelay) / CONFIG.fadeDuration;
        this.alpha = 255 * (1 - fadeProgress);
      }
      
      if (this.x < -200 || this.x > width + 200 || this.y < -200 || this.y > height + 200) {
        this.shouldRemove = true;
      }
    }
  }
  
  draw() {
    if (this.shouldRemove || this.alpha <= 0) return;
    
    push();
    let col = this.color;
    col.setAlpha(this.alpha);
    fill(col);
    noStroke();
    textSize(this.size);
    textAlign(CENTER, CENTER);
    text(this.char, this.x, this.y);
    pop();
  }
  
  isFinished() {
    return this.shouldRemove || this.alpha < 0;
  }
  
  setEllipseSplash(angle) {
    this.angle = angle;
    
    const a = CONFIG.ellipseWidth;
    const b = CONFIG.ellipseHeight;
    
    const ellipseX = cos(angle) * a;
    const ellipseY = sin(angle) * b;
    
    const dirX = ellipseX;
    const dirY = ellipseY;
    
    const length = sqrt(dirX * dirX + dirY * dirY);
    const normalizedX = dirX / length;
    const normalizedY = dirY / length;
    
    const speedScale = sqrt(
      pow(cos(angle), 2) + 
      pow(sin(angle) * (b/a), 2)
    );
    
    this.vx = normalizedX * CONFIG.splashSpeed * speedScale;
    this.vy = normalizedY * CONFIG.splashSpeed * speedScale;
  }
  
  createExplosion(x, y) {
    for (let i = 0; i < CONFIG.explosionCount; i++) {
      let randomChar = getRandomLowercaseLetter();
      
      let angle = map(i, 0, CONFIG.explosionCount, 0, TWO_PI);
      
      let explosionLetter = new Letter(
        randomChar,
        x,
        y,
        this.size,
        this.opacityDelay,
        true
      );
      
      explosionLetter.dispersing = true;
      explosionLetter.originX = x;
      explosionLetter.originY = y;
      explosionLetter.explosionFrame = frameCount;
      explosionLetter.setEllipseSplash(angle);
      
      allLetters.push(explosionLetter);
    }
  }
}

class Droplet {
  constructor() {
    this.letters = [];
    
    const screenSections = 6;
    const sectionWidth = width / screenSections;
    const sectionIndex = floor(dropletCounter % screenSections);
    
    const minX = sectionIndex * sectionWidth;
    const maxX = (sectionIndex + 1) * sectionWidth;
    this.startX = random(minX, maxX);
    
    const randomOffset = random(-sectionWidth * 0.2, sectionWidth * 0.2);
    this.startX += randomOffset;
    
    this.startX = constrain(this.startX, -50, width + 50);
    
    this.vx = random(CONFIG.initialVXMin, CONFIG.initialVXMax);
    this.vy = random(CONFIG.initialVYMin, CONFIG.initialVYMax);
    
    const minThreshold = height * 0.66;
    const maxThreshold = height * 0.98;
    this.explodeYThreshold = random(minThreshold, maxThreshold);
    
    this.opacityDelay = random(CONFIG.minOpacityDelay, CONFIG.maxOpacityDelay);
    
    let randomChar = getRandomLowercaseLetter();
    let letter = new Letter(
      randomChar,
      this.startX,
      CONFIG.startY,
      CONFIG.textSize,
      this.opacityDelay
    );
    
    letter.vx = this.vx;
    letter.vy = this.vy;
    letter.explodeYThreshold = this.explodeYThreshold;
    
    this.letters.push(letter);
    allLetters.push(letter);
    
    dropletCounter++;
  }
  
  update() {
  }
  
  isFinished() {
    for (let letter of this.letters) {
      if (!letter.isFinished()) {
        return false;
      }
    }
    return true;
  }
}

let allLetters = [];
let droplets = [];
let bgColor;
let lastSpawnTime = 0;
let dropletCounter = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  bgColor = color(CONFIG.bgColor);
  
  textSize(CONFIG.textSize);
  textAlign(CENTER, CENTER);
  
  initDroplets();
}

function draw() {
  background(bgColor);
  
  if (frameCount - lastSpawnTime > CONFIG.spawnInterval && droplets.length < CONFIG.dropletCount) {
    droplets.push(new Droplet());
    lastSpawnTime = frameCount;
  }
  
  for (let i = allLetters.length - 1; i >= 0; i--) {
    allLetters[i].update();
    
    if (allLetters[i].shouldRemove) {
      allLetters.splice(i, 1);
      continue;
    }
    
    allLetters[i].draw();
    
    if (allLetters[i].isFinished()) {
      allLetters.splice(i, 1);
    }
  }
  
  for (let i = droplets.length - 1; i >= 0; i--) {
    if (droplets[i].isFinished()) {
      droplets.splice(i, 1);
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function initDroplets() {
  allLetters = [];
  droplets = [];
  dropletCounter = 0;
  
  for (let i = 0; i < CONFIG.dropletCount; i++) {
    droplets.push(new Droplet());
  }
  
  lastSpawnTime = frameCount;
}

function getRandomLowercaseLetter() {
  const letters = "abcdefghijklmnopqrstuvwxyz";
  return letters.charAt(Math.floor(random() * letters.length));
}