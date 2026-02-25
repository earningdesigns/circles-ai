// Register GSAP plugins by reference (plugin objects), not by string names
gsap.registerPlugin(SplitText, ScrollTrigger, MotionPathPlugin, DrawSVGPlugin);


gsap.ticker.lagSmoothing(0);

ScrollTrigger.config({
  limitCallbacks: true,
  ignoreMobileResize: true,
});

ScrollTrigger.normalizeScroll(true);

const ease = {smooth: 'expo.out', natural: 'power1.inOut', fluid: 'power3.inOut'};
const time = { fast: 0.4, normal: 0.8, slow: 1.4, verySlow: 1.8};
const fadeInUpSettings = {set: { y: 30, opacity: 0}, show: {y: 0, opacity: 1, duration: 0.8}};

const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

document.addEventListener("DOMContentLoaded", init)

// Split All Headlines
// const splitTextToChars = () => { return SplitText.create(".cs-title", {type: "words,chars", charsClass: 'char++', wordsClass: 'word++'}); }


function blobsAnim() {
  const blobs = $$('#homeBlurCircles .cs-bcircle');
  const blobsLimit = blobs.length;
  const animDefaults = {
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut',
  }
  const randomCoord = () => {
    const marginSpace = 300;

    const x = Math.random() * (window.innerWidth / 2) + window.innerWidth / 2;
    const y = Math.random() * (window.innerHeight - marginSpace);

    return {x: x, y: y}
  }

  // Randomize initial positions
  blobs.forEach(blob => {
    const coOrd = randomCoord();
    gsap.set(blob, {x: coOrd.x, y: coOrd.y});
  });

  const blobsTl = gsap.timeline({paused: true});

  // Add floating animation with GSAP
  blobs.forEach((blob, index) => {
    const delay = -index * blobsLimit;
    const coOrd = randomCoord();

    blobsTl.add(
      gsap.to(blob, {
        x: () => coOrd.x,
        y: () => coOrd.y,
        duration: 8,
        ...animDefaults
      }),
      delay
    )
  });

  // Add subtle pulsing animation
  blobsTl.add(
    gsap.to(blobs, {
      scale: '+=0.05',
      duration: 1,
      stagger: 1,
      ...animDefaults
    })
  )
  
  function toggleBlob() {
    const currentScroll = window.scrollY;
    const winHeight = window.innerHeight;

    if (currentScroll < winHeight) {
      if (!blobsTl.isActive()) blobsTl.play();
    } else {
      blobsTl.pause();
    }
  }
  window.addEventListener('load', toggleBlob)
  window.addEventListener('scroll', toggleBlob)
}

let currentScroll = 0;
let scrollDirection = 1;

function horizontalLoop(items, config) {
  items = gsap.utils.toArray(items);
  config = config || {};
  let tl = gsap.timeline({repeat: config.repeat, paused: config.paused, defaults: {ease: "none"}, onReverseComplete: () => tl.totalTime(tl.rawTime() + tl.duration() * 100)}),
    length = items.length,
    startX = items[0].offsetLeft,
    times = [],
    widths = [],
    xPercents = [],
    curIndex = 0,
    pixelsPerSecond = (config.speed || 1) * 100,
    snap = config.snap === false ? v => v : gsap.utils.snap(config.snap || 1), // some browsers shift by a pixel to accommodate flex layouts, so for example if width is 20% the first element's width might be 242px, and the next 243px, alternating back and forth. So we snap to 5 percentage points to make things look more natural
    populateWidths = () => items.forEach((el, i) => {
      widths[i] = parseFloat(gsap.getProperty(el, "width", "px"));
      xPercents[i] = snap(parseFloat(gsap.getProperty(el, "x", "px")) / widths[i] * 100 + gsap.getProperty(el, "xPercent"));
    }),
    getTotalWidth = () => items[length-1].offsetLeft + xPercents[length-1] / 100 * widths[length-1] - startX + items[length-1].offsetWidth * gsap.getProperty(items[length-1], "scaleX") + (parseFloat(config.paddingRight) || 0),
      totalWidth, curX, distanceToStart, distanceToLoop, item, i;
  populateWidths();
  gsap.set(items, { // convert "x" to "xPercent" to make things responsive, and populate the widths/xPercents Arrays to make lookups faster.
    xPercent: i => xPercents[i]
  });
  gsap.set(items, {x: 0});
  totalWidth = getTotalWidth();
  for (i = 0; i < length; i++) {
    item = items[i];
    curX = xPercents[i] / 100 * widths[i];
    distanceToStart = item.offsetLeft + curX - startX;
    distanceToLoop = distanceToStart + widths[i] * gsap.getProperty(item, "scaleX");
    tl.to(item, {xPercent: snap((curX - distanceToLoop) / widths[i] * 100), duration: distanceToLoop / pixelsPerSecond}, 0)
      .fromTo(item, {xPercent: snap((curX - distanceToLoop + totalWidth) / widths[i] * 100)}, {xPercent: xPercents[i], duration: (curX - distanceToLoop + totalWidth - curX) / pixelsPerSecond, immediateRender: false}, distanceToLoop / pixelsPerSecond)
      .add("label" + i, distanceToStart / pixelsPerSecond);
    times[i] = distanceToStart / pixelsPerSecond;
  }
  function toIndex(index, vars) {
    vars = vars || {};
    (Math.abs(index - curIndex) > length / 2) && (index += index > curIndex ? -length : length); // always go in the shortest direction
    let newIndex = gsap.utils.wrap(0, length, index),
      time = times[newIndex];
    if (time > tl.time() !== index > curIndex) { // if we're wrapping the timeline's playhead, make the proper adjustments
      vars.modifiers = {time: gsap.utils.wrap(0, tl.duration())};
      time += tl.duration() * (index > curIndex ? 1 : -1);
    }
    curIndex = newIndex;
    vars.overwrite = true;
    return tl.tweenTo(time, vars);
  }
  tl.next = vars => toIndex(curIndex+1, vars);
  tl.previous = vars => toIndex(curIndex-1, vars);
  tl.current = () => curIndex;
  tl.toIndex = (index, vars) => toIndex(index, vars);
  tl.updateIndex = () => curIndex = Math.round(tl.progress() * (items.length - 1));
  tl.times = times;
  tl.progress(1, true).progress(0, true); // pre-render for performance
  if (config.reversed) {
    tl.vars.onReverseComplete();
    tl.reverse();
  }
  if (config.draggable && typeof(Draggable) === "function") {
    let proxy = document.createElement("div"),
        wrap = gsap.utils.wrap(0, 1),
        ratio, startProgress, draggable, dragSnap, roundFactor,
        align = () => tl.progress(wrap(startProgress + (draggable.startX - draggable.x) * ratio)),
        syncIndex = () => tl.updateIndex();
    typeof(InertiaPlugin) === "undefined" && console.warn("InertiaPlugin required for momentum-based scrolling and snapping. https://greensock.com/club");
    draggable = Draggable.create(proxy, {
      trigger: items[0].parentNode,
      type: "x",
      onPress() {
        startProgress = tl.progress();
        tl.progress(0);
        populateWidths();
        totalWidth = getTotalWidth();
        ratio = 1 / totalWidth;
        dragSnap = totalWidth / items.length;
        roundFactor = Math.pow(10, ((dragSnap + "").split(".")[1] || "").length);
        tl.progress(startProgress);
      },
      onDrag: align,
      onThrowUpdate: align,
      inertia: true,
      snap: value => {
        let n = Math.round(parseFloat(value) / dragSnap) * dragSnap * roundFactor;
        return (n - n % 1) / roundFactor;
      },
      onRelease: syncIndex,
      onThrowComplete: () => gsap.set(proxy, {x: 0}) && syncIndex()
    })[0];
  }
  
  return tl;
}

function heroAnim() {
  const sectionHero = $('.cs-section--h-hero');
  
  const sectionHeroTitle = sectionHero?.querySelector('.cs-title');
  const titleSvg = sectionHero.querySelectorAll('.cs-titlesvg')
  const meetCirclesContainer = sectionHero.querySelector('.cs-brand');
  const members = sectionHero.querySelector('.cs-members');
  const sectionHeroCompanies = sectionHero?.querySelector('.cs-companies');
  const companies = sectionHeroCompanies?.querySelectorAll('.cs-company');

  gsap.set(meetCirclesContainer, {y: -25, opacity: 0})
  gsap.set(titleSvg,{opacity: 0, y: -25});
  gsap.set(sectionHeroTitle, {opacity: 0, y: -25})
  gsap.set(members, {opacity: 0})
  gsap.set(sectionHeroCompanies, {opacity: 0})


  function liner() {
    const linerLineWidthRange = {min: 50, max: 80};

    const liner = sectionHero?.querySelector(".cs-liner");
    const linerTrack = liner?.querySelector('.cs-liner__track');
    const linerLine = liner?.querySelector('.cs-liner__line');

    gsap.set(linerLine, {opacity:0})
    gsap.set(linerTrack, {opacity: 0, drawSVG: "60%"})
    gsap.set(linerLine, {motionPath: { path: linerTrack, align: linerTrack, alignOrigin: [0.5, 0.5] }})

    const tl = gsap.timeline({ease: ease.fluid});

    tl
      .to(linerTrack, {opacity: 1, duration: 2, drawSVG: "100%"})
      .to(linerLine, {opacity: 1})
      .to(linerLine, {
        motionPath: {
          path: linerTrack,
          align: linerTrack,
          autoRotate: true,
          alignOrigin: [0.5, 0.5],
          start: 0.036
        },
        transformOrigin: "50% 50%",
        scrollTrigger: {
          trigger: sectionHero,
          scrub: true,
          start: "top top",
          // end: "bottom bottom",
          onLeave: () => {
            gsap.to(linerLine, {opacity: 0, duration: time.normal})
          },
          onEnterBack: () => {
            gsap.to(linerLine, {opacity: 1, duration: time.normal})
          }
          // onUpdate: (self) => {
          //   // Clamp progress to 30%-60% range (0.3 - 0.6)
          //   const startTrigger = 0.3;
          //   const endTrigger = 0.6;

          //   // Map the 0.3-0.6 range to 0-1 (for interpolation)
          //   let mappedProgress = gsap.utils.mapRange(startTrigger, endTrigger, 0, 1, self.progress);
          //   // Clamp values outside 0-1
          //   mappedProgress = gsap.utils.clamp(0, 1, mappedProgress);

          //   // Calculate width (e.g., between 200px and 500px)
          //   const minWidth = 50;
          //   const maxWidth = 150;
          //   const newWidth = gsap.utils.interpolate(minWidth, maxWidth, mappedProgress);

          //   gsap.set(linerLine, {width: newWidth});
          // }

        }
      }
    )

    return tl;
  }

  const companiesTl = horizontalLoop(companies, {
    repeat: -1,
    speed: 0.4,
    draggable: true,
    paddingRight: parseFloat(gsap.getProperty(companies[1], "marginRight", "px"))
  });

  companies.forEach(company => {
    company.addEventListener("mouseenter", () => gsap.to(companiesTl, {timeScale: 0, overwrite: true}));
    company.addEventListener("mouseleave", () => gsap.to(companiesTl, {timeScale: 1, overwrite: true}));
  });

  function toggleCompaniesAnim() {
    const currentScroll = window.scrollY;
    const winHeight = window.innerHeight;

    if (currentScroll < winHeight) {
      if (!companiesTl.isActive()) companiesTl.play();
    } else {
      companiesTl.pause();
    }
  }

  window.addEventListener('load', toggleCompaniesAnim)
  window.addEventListener('scroll', toggleCompaniesAnim)

 
  const heroTl = gsap.timeline({ease: ease.smooth, });

  heroTl
    .to(meetCirclesContainer, {opacity: 1, y: 0, duration: 1.6})
    .to(titleSvg,{y: 0, opacity: 1, duration: .8})
    .to(sectionHeroTitle, {y: 0, opacity: 1, duration: .8})

    .to(members, {duration: 0.6,opacity: 1})
    .to(sectionHeroCompanies, {opacity: 1}, '-=0.3')
    .add(liner())
}
// Hero Anim: End

// function sdmoAnim() {
//   const sectionSdmo = $('.cs-section--h-sdmo');
//   const brand = sectionSdmo.querySelectorAll('.cs-brand');
//   const circlesContainer = sectionSdmo.querySelector('.cs-concentric');
  
//   const vibes = circlesContainer.querySelectorAll('.cs-concentric-vibe');
//   const circleCenter = circlesContainer.querySelectorAll('.cs-concentric-centre');
//   const sectionTitle = gsap.utils.toArray(sectionSdmo.querySelectorAll('.cs-title'))

//   gsap.set(sectionTitle, {opacity: 0, y: 25})
//   gsap.set(brand, {opacity: 0, x: 5})
//   gsap.set([vibes, circleCenter], {opacity: 0, scale: 0.9, transformOrigin: "50% 50%"})

//   const setContainerSize = () => {
//     let rect = circlesContainer.querySelector('.cs-concentric-circles').getBoundingClientRect();
//     circlesContainer.style.setProperty('--cs-concentric-size',`${rect.width}px`)
//   }
//   setContainerSize();
//   window.addEventListener('resize', setContainerSize());


//     const circles = circlesContainer.querySelectorAll('.cs-concentric-circles .cs-concentric-circle');
//     const texts = sectionSdmo?.querySelectorAll('.cs-concentric-circles .cs-concentric-txt');
//     const paths = sectionSdmo?.querySelectorAll('.cs-concentric-circles .cs-concentric-txt');

//     // ------------------------------------
//     // INITIAL SETUP
//     // ------------------------------------

//     const circlePaths = Array.from(circles).map(circle =>
//       MotionPathPlugin.convertToPath(circle)[0]
//     );

//     gsap.set(circlePaths, { transformOrigin: "50% 50%" });
//     gsap.set(texts, { opacity: 0, });


//     const center = { x: 350, y: 350 };

//     // Custom starting angles (YOU CONTROL POSITION)
//     const configs = [
//       { selector: ".cs-concentric-circles .cs-concentric-txt--1", radius: 267, speed: 0.01, angles: [0, 1.5] },
//       { selector: ".cs-concentric-txt--2", radius: 452, speed: -0.007, angles: [0.8, 2.4] },
//       { selector: ".cs-concentric-txt--3", radius: 604, speed: 0.004, angles: [1.2] }
//     ];

//     // configs.forEach(cfg => {
//     //   const pills = document.querySelectorAll(cfg.selector);

//     //   paths.forEach((pill, i) => {
//     //     let angle = cfg.angles[i] || (i / pills.length) * Math.PI * 2;

//     //     gsap.ticker.add(() => {
//     //       angle += cfg.speed;

//     //       const x = center.x + cfg.radius * Math.cos(angle);
//     //       const y = center.y + cfg.radius * Math.sin(angle);

//     //       gsap.set(pill, {
//     //         x: x - 40, // half width
//     //         y: y - 14, // half height
//     //         rotation: 0 // KEEP TEXT UPRIGHT
//     //       });
//     //     });
//     //   });
//     // });
    

//     const tl = gsap.timeline();

//     // texts.forEach((text, i) => {
//     //   gsap.set(text, {
//     //     opacity: 0,
//     //     motionPath: {
//     //       path: circlePaths[i],
//     //       align: circlePaths[i],
//     //       alignOrigin: [0.5, 0.5],
          
//     //       autoRotate: false // keeps text upright
//     //     },
//     //   });
//     // });

//   const sdmoTl = gsap.timeline({ease: ease.smooth})

//   sdmoTl
//     .to(brand, {opacity: 1, x: 0, duration: 0.6})
//     .to(vibes, {opacity: 1, scale: 1,  stagger: 0.16, duration: 0.8})
//     .to(circleCenter, {opacity: 1, scale: 1, duration: 0.8}, '-=25%')
//     .to(texts, {
//       opacity: 1,
//       duration: 0.8,
//       stagger: 0.2
//     }, "-=1")
//     // .add(()=> {
//     //   gsap.to()
//     // }, '<')
//     // .to(circlePaths, {rotation: 360, duration: 60, repeat: -1, transformOrigin: "50% 50%"})
//     // .to(ccircles, {opacity: 1, duration: 1, repeat: -1})
    
//     .to(sectionTitle, {opacity: 1, y: 0, duration: 0.8}, '-=50%')

//   ScrollTrigger.create({
//     animation: sdmoTl,
//     trigger: sectionSdmo,
//     start: "top center"
//   })
// }
function sdmoAnim() {

  const sectionSdmo = document.querySelector('.cs-section--h-sdmo');
  if (!sectionSdmo) return;

  const brand = sectionSdmo.querySelectorAll('.cs-brand');
  const circlesContainer = sectionSdmo.querySelector('.cs-concentric');
  const vibes = circlesContainer.querySelectorAll('.cs-concentric-vibe');
  const circleCenter = circlesContainer.querySelectorAll('.cs-concentric-centre');
  const sectionTitle = gsap.utils.toArray(
    sectionSdmo.querySelectorAll('.cs-title')
  );

  const texts = circlesContainer.querySelectorAll('.cs-concentric-txt');

  // -----------------------------
  // Initial States
  // -----------------------------

  gsap.set(sectionTitle, { opacity: 0, y: 25 });
  gsap.set(brand, { opacity: 0, x: 5 });
  gsap.set([vibes, circleCenter], {
    opacity: 0,
    scale: 0.9,
    transformOrigin: "50% 50%"
  });

  gsap.set(texts, { opacity: 0 });

  // -----------------------------
  // 1️⃣ SUBTLE FLOAT (uses yPercent so it doesn't conflict)
  // -----------------------------

  texts.forEach((text, i) => {
    gsap.to(text, {
      yPercent: 5,
      duration: 2.5 + (i * 0.4),
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true
    });
  });

  // -----------------------------
  // 2️⃣ 200px SCROLL PARALLAX (forward + reverse)
  // -----------------------------

  texts.forEach((text, i) => {

    gsap.fromTo(
      text,
      { y: 0 },
      {
        y: i % 2 === 0 ? -200 : 200,
        ease: "none",
        scrollTrigger: {
          trigger: sectionSdmo,
          start: "top bottom",
          end: "bottom top",
          scrub: true
        }
      }
    );

  });

  // -----------------------------
  // 3️⃣ SUBTLE ROTATION DRIFT
  // -----------------------------

  texts.forEach((text, i) => {
    gsap.to(text, {
      rotation: i % 2 === 0 ? 4 : -4,
      duration: 4 + (i * 0.5),
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
      transformOrigin: "50% 50%"
    });
  });

  // -----------------------------
  // 4️⃣ INTRO ANIMATION
  // -----------------------------

  const sdmoTl = gsap.timeline({ ease: "expo.out" });

  sdmoTl
    .to(brand, { opacity: 1, x: 0, duration: 0.6 })
    .to(vibes, {
      opacity: 1,
      scale: 1,
      stagger: 0.16,
      duration: 0.8
    })
    .to(circleCenter, {
      opacity: 1,
      scale: 1,
      duration: 0.8
    }, "-=25%")
    .to(texts, {
      opacity: 1,
      duration: 0.8,
      stagger: 0.2
    }, "-=1")
    .to(sectionTitle, {
      opacity: 1,
      y: 0,
      duration: 0.8
    }, "-=50%");

  ScrollTrigger.create({
    animation: sdmoTl,
    trigger: sectionSdmo,
    start: "top center",
    toggleActions: "play none none none"
  });

}
function carexAnim() {
  const carexSection = $('.cs-section--h-carex');
  const carexTitle = carexSection?.querySelectorAll('.cs-title .word');
  const hltTitle = carexSection?.querySelector('.cs-hlt-title');
  const linerTrack = carexSection?.querySelector('.cs-liner .cs-liner__track')
  const linerSub = carexSection?.querySelector('.cs-liner .cs-liner__small')
  const linerLine = carexSection?.querySelector('.cs-liner .cs-liner__line')
  const carexSlider = carexSection.querySelector('.cs-slider__swiper');
  const titleSvg = carexSection.querySelectorAll('.cs-titlesvg path')
  
  // gsap.set(titleSvg,{opacity: 0, x: -5})
  // gsap.set(carexTitle, {opacity: 0})
  gsap.set(hltTitle, {opacity: 0})
  // gsap.set([linerTrack, linerSub], {opacity: 0, drawSVG: 0})
  const introTl = gsap.timeline({
    scrollTrigger: {
      trigger: carexSection,
      start: "top 80%",
      once: true,
    }
  });

  introTl
    .to(hltTitle, {opacity: 1, duration: 0.8})
    // .to(linerTrack, { opacity: 1, drawSVG: "100%", duration: 1 })
    // .to(linerSub, { drawSVG: "100%", duration: 1 }, "<");

  

  gsap.to(linerLine, {
    motionPath: {
      path: linerTrack,
      align: linerTrack,
      autoRotate: true,
      alignOrigin: [0.5, 0.5]
    },
    ease: ease.fluid,
    scrollTrigger: {
      trigger: carexSection,
      start: "top center+=100", // start AFTER intro visually
      end: "bottom center",
      scrub: 1,
      onEnter: () => {
        gsap.to(linerLine, {opacity: 1, duration: time.normal})
      },
      onLeave: () => {
        gsap.to(linerLine, {opacity: 0, duration: time.normal})
      },
      onEnterBack: () => {
        gsap.to(linerLine, {opacity: 1, duration: time.normal})
      }
    }
  });
}

function novaAnim () {
  const novaSection = $('.cs-section--h-nova');
  const linerTrack = novaSection?.querySelector('.cs-liner .cs-liner__track')
  const linerSub = novaSection?.querySelector('.cs-liner .cs-liner__small')
  const linerLine = novaSection?.querySelector('.cs-liner .cs-liner__line')
  const novaSlider = novaSection.querySelector('.cs-slider__swiper');

  // gsap.set([linerTrack, linerSub], {drawSVG: 0})

  // const introTl = gsap.timeline({
  //   scrollTrigger: {
  //     trigger: novaSection,
  //     start: "top 80%",
  //     once: true,
  //   }
  // });

  // introTl
  //   .to(linerTrack, { drawSVG: "100%", duration: 1 })
  //   .to(linerSub, { drawSVG: "100%", duration: 1 }, "<");

  gsap.to(linerLine, {
    motionPath: {
      path: linerTrack,
      align: linerTrack,
      autoRotate: true,
      alignOrigin: [0.5, 0.5]
    },
    ease: ease.fluid,
    scrollTrigger: {
      trigger: novaSection,
      start: "top center+=100", // start AFTER intro visually
      end: "bottom center",
      scrub: 1,
      onEnter: () => {
        gsap.to(linerLine, {opacity: 1, duration: time.normal})
      },
      onLeave: () => {
        gsap.to(linerLine, {opacity: 0, duration: time.normal})
      },
      onEnterBack: () => {
        gsap.to(linerLine, {opacity: 1, duration: time.normal})
      }
    }
  });
}

function zerofyxAnim() {
  const zerofyxSection = $('.cs-section--h-zerofyx');
  const linerTrack = zerofyxSection?.querySelector('.cs-liner .cs-liner__track')
  const linerLine = zerofyxSection?.querySelector('.cs-liner .cs-liner__line')
  const zerofyxSlider = zerofyxSection.querySelector('.cs-slider__swiper');

  
    // gsap.to(
    //   linerTrack, { drawSVG: "100%", duration: 1,
    //   scrollTrigger: {
    //     trigger: zerofyxSection,
    //     start: "top 80%",
    //     once: true,
    //   }
    // });
    gsap.set(linerLine, {opacity: 0})

    gsap.to(linerLine, {
    motionPath: {
      path: linerTrack,
      align: linerTrack,
      autoRotate: true,
      alignOrigin: [0.5, 0.5]
    },
    ease: ease.fluid,
    scrollTrigger: {
      trigger: zerofyxSection,
      start: "top center+=100", // start AFTER intro visually
      end: "bottom center",
      scrub: 1,
      onEnter: () => {
        gsap.to(linerLine, {opacity: 1, duration: time.normal})
      },
      onLeave: () => {
        gsap.to(linerLine, {opacity: 0, duration: time.normal})
      },
      onEnterBack: () => {
        gsap.to(linerLine, {opacity: 1, duration: time.normal})
      }
    }
  });
}

function collabAnim() {
  const sectionCollab = $('.cs-section--h-collab');
  const title = sectionCollab?.querySelectorAll('.cs-title');
  
  const description = sectionCollab.querySelector('.cs-description');
  const articles = sectionCollab?.querySelectorAll('.cs-article');

  function collabConnect () {
    const collab = sectionCollab.querySelector('.cs-circles-collab');
    const collabConnect = collab.querySelector('.cs-circles-collab__connect');
    const bcircles = collab.querySelector('.cs-brand--circles');
    const bopenai = collab.querySelector('.cs-brand--openai');

    gsap.set(collabConnect, {opacity: 0, scale: 0.1});
    gsap.set(bcircles, {opacity: 0, x: -30})
    gsap.set(bopenai, {opacity: 0, x: 30})

    const tl = gsap.timeline();
    tl
      .to(collabConnect, {opacity: 1, scale: 1, rotation: 360, duration: 0.4})
      .to(bcircles, {opacity: 1, x: 0, duration: 0.6}, '<')
      .to(bopenai, {opacity: 1, x: 0, duration: 0.6}, '<')

    return tl;
  }


  gsap.set(title, fadeInUpSettings.set)
  gsap.set(description, fadeInUpSettings.set)
  gsap.set(articles, {opacity: 0, x: -30})

  const collabTl = gsap.timeline({ease: ease.smooth});
  collabTl
    .add(collabConnect())
    .to(title, fadeInUpSettings.show)
    .to(description, fadeInUpSettings.show, '-=80%')
    .to(articles, {x: 0, opacity: 1, stagger: 0.14, duration: time.normal})

  ScrollTrigger.create({
    trigger: sectionCollab,
    animation: collabTl,
    start: "top center",
    once: true,
  })
}
// Collab: End

function trustAnim() {
  const sectionJoin = $('.cs-section--h-trust');
  const titleSvg = sectionJoin?.querySelectorAll('.cs-titlesvg');
  const joinSteps = sectionJoin.querySelectorAll('.cs-foundation .cs-foundation__item');
  

  gsap.set(joinSteps, fadeInUpSettings.set);
  gsap.set(titleSvg, fadeInUpSettings.set)

  const trustTl = gsap.timeline({ease: ease.smooth});
  trustTl
    .to(titleSvg, fadeInUpSettings.show)
    .to(joinSteps, {...fadeInUpSettings.show, stagger: 0.14}, '-=15%')

  ScrollTrigger.create({
    trigger: sectionJoin,
    animation: trustTl,
    start: "top center",
    once: true,
  })
}
// Trust Section: End

function joinAnim () {
  const sectionJoin = $('.cs-section--h-join');
  const brand = sectionJoin?.querySelector('.cs-brand');
  const title = sectionJoin?.querySelector('.cs-title');
  const joinSteps = sectionJoin.querySelectorAll('.cs-join-step');

  gsap.set(brand, {opacity: 0, scale: 0.5, rotation: 180})
  gsap.set(joinSteps, fadeInUpSettings.set);
  gsap.set(title, fadeInUpSettings.set)

  const linerTrack = sectionJoin?.querySelector('.cs-liner .cs-liner__track')
  const linerLine = sectionJoin?.querySelector('.cs-liner .cs-liner__line')

  gsap.set(linerTrack, {drawSVG: 0})
  gsap.set(linerLine, {
    opacity: 0,
    motionPath: {
      path: linerTrack,
      align: linerTrack,
      autoRotate: true,
      alignOrigin: [0.5, 0.5]
    }})

  // const introTl = gsap.timeline({
  //   scrollTrigger: {
  //     trigger: sectionJoin,
  //     start: "top 80%",
  //     once: true,
  //   }
  // });

  // introTl
    

  // gsap.to(linerLine, {
  //   motionPath: {
  //     path: linerTrack,
  //     align: linerTrack,
  //     autoRotate: true,
  //     alignOrigin: [0.5, 0.5]
  //   },
  //   ease: "none",
  //   scrollTrigger: {
  //     trigger: sectionJoin,
  //     start: "top center+=100", // start AFTER intro visually
  //     end: "bottom center",
  //     scrub: 1,
  //   }
  // });

  const joinTl = gsap.timeline({ease: ease.smooth});

  joinTl
    .to(linerTrack, { drawSVG: "100%", duration: time.fast })
    .to(linerLine, {
      opacity: 1,
      duration: 1,
    motionPath: {
      path: linerTrack,
      align: linerTrack,
      start: 0.15,
      end: 1,
      autoRotate: true,
      alignOrigin: [0.5, 0.5]
    }}, '<')

    .to([linerTrack, linerLine], { opacity: 0, duration: time.fast })
    .to(brand, {opacity: 1, scale: 1, rotation: 0, duration: time.slow}, '-=75%')
    .to(title, fadeInUpSettings.show, '-=0.6')
    .to(joinSteps, {...fadeInUpSettings.show, stagger: 0.12}, '-=15%')

  ScrollTrigger.create({
    trigger: sectionJoin,
    animation: joinTl,
    start: "top center",
    once: true,
  })
}
// Join Anim: End

function onPageStartEnd() {
  window.addEventListener("scroll", () => {
    const doc = document.documentElement;
    
    let isBottom = doc.scrollTop + window.innerHeight >= doc.scrollHeight - 5;
    let isTop = doc.scrollTop <= window.innerHeight;

    if (isBottom) {
      gsap.to('#handSymbol', {rotate: 180, duration: time.normal, transformOrigin: "top center", ease: ease.natural})
    }
    else if (isTop) {
      gsap.to('#handSymbol', {rotate: 0, duration: time.normal, transformOrigin: "top center", ease: ease.natural})
    }
  });
}

// Usage


function init() {
  // let splitTexts = splitTextToChars();

  // const gradMotion = document.getElementById('gradMotion');
  // const gradMotionTrack = gradMotion?.querySelector('.cs-gradmotion__track');
  // const gradMotionCircle = gradMotion?.querySelector('.cs-gradmotion__circle');

  // gsap.set(gradMotionCircle, {
  //   motionPath: {
  //     path: gradMotionTrack,
  //     align: gradMotionTrack,
  //   }
  // })

  // const gradCircleSettings = [
  //   {
  //     size: 59.8,
  //     gradient: 'radial-gradient(50% 50% to 50% 50%, #BEFFC1 0%, rgba(57, 229, 255, 0.1) 47%%, rgba(255, 255, 255, 0.5) 89.9%)',
  //   },
  //   {
  //     size: 59.8,
  //     gradient: 'radial-gradient(50% 50% to 50% 50%, #BEFFC1 0%, rgba(57, 229, 255, 0.1) 47%, rgba(255, 255, 255, 0.5) 89.9%)',
  //   },
  //   {
  //     size: 135,
  //     gradient: 'radial-gradient(50% 50% to 50% 50%, rgba(189, 255, 163, 0.75) 0%, rgba(97, 255, 218, 0.1) 46%, rgba(97, 255, 218, 0) 100%)',
  //   },
  //   {
  //     size: 135,
  //     gradient: 'radial-gradient(50% 50% to 50% 50%, rgba(218, 189, 255, 0.75) 0%, rgba(0, 242, 255, 0.1) 48%, rgba(0, 242, 255, 0) 100%)',
  //   },
  //   {
  //     size: 135,
  //     gradient: 'radial-gradient(50% 50% to 50% 50%, #65FFF2 0%, rgb(255, 0, 195, 0.1) 48%, rgb(255, 0, 195, 0) 100%)'
  //   },
  //   {
  //     size: 135,
  //     gradient: 'radial-gradient(50% 50% to 50% 50%, #65FFF2 0%, rgb(43, 0, 195, 0.1) 48%, rgb(43, 0, 195, 0) 100%)'
  //   }
  // ]

  // const sections = gsap.utils.toArray([
  //   '.cs-section--h-hero',
  //   '.cs-section--h-sdmo',
  //   '.cs-section--h-carex',
  //   '.cs-section--h-nova',
  //   '.cs-section--h-zerofyx',
  //   '.cs-section--h-collab'
  // ]);

  // const totalProgress = 1; // how far along the path you want to go

  // gsap.to(gradMotionCircle, {
  //   motionPath: {
  //     path: gradMotionTrack,
  //     align: gradMotionTrack,
  //     alignOrigin: [0.5, 0.5],
  //     autoRotate: false,
  //     start: 0,
  //     end: 1
  //   },
  //   ease: "power2.inOut",
  //   scrollTrigger: {
  //     trigger: sections[0],
  //     start: "top top",
  //     endTrigger: sections[sections.length - 1],
  //     end: "bottom bottom",
  //     scrub: true,
  //   }
  // });

  // sections.forEach((section, index) => {
  //   const settings = gradCircleSettings[index];

  //   gsap.to(gradMotionCircle, {
  //     width: `${settings.size}rem`,
  //     height: `${settings.size}rem`,
  //     background: settings.gradient,
  //     ease: "sine.inOut",
  //     scrollTrigger: {
  //       trigger: section,
  //       start: "top top",
  //       end: "bottom center",
  //       scrub: true
  //     }
  //   });
  // });

  // Fixed Message: Start
  ScrollTrigger.create({
    trigger: '.cs-footer',
    onEnter: () => {
      gsap.to('.cs-fixed-message', {
        opacity: 0,
        duration: 0.4
      })
    },
    onLeaveBack: () => {
      gsap.to('.cs-fixed-message', {
        opacity: 1,
        duration: 1
      })
    }
  })
  // Fixed Message: End

  // All Page Swipers: Start
  const swipers = $$(".swiper");
  const swiperInstances = [];

  swipers.forEach((el, index) => {
    swiperInstances[index] = new Swiper(el, {
      loop: true,
      autoplay: { delay: 2500 },
      slidesPerView: 1,
      pauseOnMouseEnter: true,
      pagination: {
        el: '.swiper-pagination',
      },

      // Navigation arrows
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
    });
  });

  // Observe each swiper
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const swiperEl = entry.target;
      const swiper = swiperEl.swiper; // Swiper instance

      if (entry.isIntersecting) {
        swiper.autoplay.start();
      } else {
        swiper.autoplay.stop();
      }
    });
  }, { threshold: 0.3 });

  // Attach observer
  swipers.forEach(swiper => observer.observe(swiper));
  // All Page Swipers: End
  
  blobsAnim(); // Hero Blob Animation
  heroAnim(); // Hero Animation
  sdmoAnim(); // Sdmo Second Section Animation
  carexAnim(); // CareX Animation
  novaAnim(); // Nova Animation
  zerofyxAnim(); // Zerofyx Animation
  collabAnim(); // Collab Animation
  trustAnim(); // Trust ANimation
  joinAnim(); // Join Revolution - Last Section Animation

  onPageStartEnd();
}

const sections = document.querySelectorAll('.cs-section');
const hand = document.getElementById('handSymbol');

let direction = 1; // 1 = down, -1 = up

function getCurrentSectionIndex() {
  let index = 0;

  sections.forEach((section, i) => {
    const rect = section.getBoundingClientRect();
    if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
      index = i;
    }
  });

  return index;
}

function updateDirectionByScroll() {
  const currentIndex = getCurrentSectionIndex();

  if (currentIndex === sections.length - 1) {
    direction = -1;
  } else if (currentIndex === 0) {
    direction = 1;
  }

  hand.classList.remove('up', 'down');
  hand.classList.add(direction === -1 ? 'up' : 'down');
}

/* -------- CLICK -------- */

let isScrolling = false;

hand.addEventListener('click', () => {
  if (isScrolling) return;
  isScrolling = true;

  let currentIndex = getCurrentSectionIndex();

  if (currentIndex === sections.length - 1) {
    direction = -1;
  } else if (currentIndex === 0) {
    direction = 1;
  }

  const nextIndex = currentIndex + direction;

  sections[nextIndex].scrollIntoView({
    behavior: 'smooth'
  });

  hand.classList.remove('up', 'down');
  hand.classList.add(direction === -1 ? 'up' : 'down');

  setTimeout(() => {
    isScrolling = false;
  }, 800);
});

/* -------- SCROLL DETECTION -------- */

window.addEventListener('scroll', () => {
  updateDirectionByScroll();
});