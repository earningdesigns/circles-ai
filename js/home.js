// Register GSAP plugins by reference (plugin objects), not by string names
gsap.registerPlugin(SplitText, ScrollTrigger, MotionPathPlugin, DrawSVGPlugin);

gsap.ticker.lagSmoothing(0);

ScrollTrigger.config({
  limitCallbacks: true,
  ignoreMobileResize: true,
});

ScrollTrigger.normalizeScroll(true);

document.addEventListener("DOMContentLoaded", init)

// Split All Headlines
const splitTextToChars = () => { return SplitText.create(".cs-title", {type: "words,chars", charsClass: 'char++', wordsClass: 'word++'}); }


function blobsAnim() {
  const blobs = document.querySelectorAll('#homeBlurCircles .cs-bcircle');
  const blobsLimit = blobs.length;
  const animDefaults = {
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut',
  }
  const randomCoord = () => {
    const marginSpace = 300;

    const x = Math.random() * (window.innerWidth / 2 - marginSpace);
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

function heroCompanies() {
  
  const companies = document.querySelectorAll(".cs-section--h-hero .cs-companies .cs-company");
  const companiesTl = horizontalLoop(companies, {
    paused: true,
    repeat: -1,
    speed: 0.4,
    draggable: true,
    paddingRight: parseFloat(gsap.getProperty(companies[1], "marginRight", "px"))
  }) 
  companies.forEach(company => {
    company.addEventListener("mouseenter", () => gsap.to(companiesTl, {timeScale: 0, overwrite: true}));
    company.addEventListener("mouseleave", () => gsap.to(companiesTl, {timeScale: 1, overwrite: true}));
  });

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
}
function heroAnim() {
  const sectionHero = document.querySelector('.cs-section--h-hero');
  
  const sectionHeroTitle = sectionHero?.querySelector('.cs-title');
  const sectionHeroTitleChar = sectionHeroTitle?.querySelectorAll('.char');
  const titleSvg = sectionHero.querySelectorAll('.cs-titlesvg path')

  gsap.set(sectionHeroTitleChar, {opacity: 0, x: -5})
  gsap.set(titleSvg,{opacity: 0, x: -5})
  
  

  function brandLetters() {
    const meetCirclesContainer = sectionHero.querySelector('.cs-brand');

    const brandLettersList = meetCirclesContainer.querySelectorAll('.cs-brand__letter');
    
    const brandXO = Array.from(brandLettersList).slice(0, 2);
    const brandLetters = Array.from(brandLettersList).slice(2, brandLettersList.length);

    gsap.set(brandXO, {x: -30, opacity: 0})
    gsap.set(brandLetters, {x: 5, opacity: 0})

    const tl = gsap.timeline();

    tl
      .to(brandXO, {x: 0, duration: 0.6, opacity: 1, stagger: 0.24 })
      .to(brandLetters, {x: 0, duration: 0.4, opacity: 1, stagger: 0.16})

    return tl;
  }

  function memberAnim() {
    const members = sectionHero.querySelector('.cs-members');
    const memberTitle = members?.querySelector('.cs-members__text');
    const member = members?.querySelector('.cs-member');
    
    gsap.set([memberTitle, member], {autoAlpha: 0})
    
    return gsap.timeline()
    .to([memberTitle, member], {duration: 0.6, stagger: 0.1,autoAlpha: 1})
  }

  function companiesAnim() {
    const sectionHeroCompanies = sectionHero?.querySelector('.cs-companies');

    if (!sectionHeroCompanies) return gsap.timeline();

    const sectionHeroCompanyTitle = sectionHero?.querySelector('.cs-companies .cs-companies__text');
    const sectionHeroCompaniesList = sectionHeroCompanies?.querySelectorAll('.cs-company');

    gsap.set([sectionHeroCompanyTitle, sectionHeroCompaniesList], {autoAlpha: 0, x: -20})

    const tl = gsap.timeline();

    tl
      .to(sectionHeroCompanyTitle, {autoAlpha: 1, x: 0, duration: .48})
      .to(sectionHeroCompaniesList, {autoAlpha: 1, x: 0, stagger: 0.25, duration: .48}, '-=0.3')

    return tl;
  }

  function liner() {
    const linerLineWidthRange = {min: 50, max: 80};

    const liner = sectionHero?.querySelector(".cs-liner");
    const linerTrack = liner?.querySelector('.cs-liner__track');
    const linerLine = liner?.querySelector('.cs-liner__line');
    gsap.set(linerLine, {opacity:0})
    gsap.set(linerTrack, {drawSVG: 0})
    gsap.set(linerLine, {motionPath: {
          path: linerTrack,
          align: linerTrack,
          alignOrigin: [0.5, 0.5]
        }})

    const tl = gsap.timeline();

    tl
      .to(linerTrack, {duration: 1.2, drawSVG: "100%"})
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
  
  const heroTl = gsap.timeline({ease: "power4.out", });

  heroTl
    .add(brandLetters())
    .to(titleSvg,{x: 0, opacity: 1, stagger: 0.08, duration: .8})
    .to(sectionHeroTitleChar, {x: 0, opacity: 1, stagger: 0.08, duration: .8})
    .add(liner()) 
    .add(memberAnim())
    .add(companiesAnim())

  heroCompanies();
}

function sdmoAnim() {
  const sectionSdmo = document.querySelector('.cs-section--h-sdmo');
  const brand = sectionSdmo.querySelectorAll('.cs-brand svg path');
  const sectionTitle = gsap.utils.toArray(sectionSdmo.querySelectorAll('.cs-title .word'))

  gsap.set(sectionTitle, {opacity: 0, y: 25})
  gsap.set(brand, {opacity: 0, x: 5})

  function ccirclesBackdrop () {
    // const vibes = sectionSdmo?.querySelectorAll('.cs-concentric-vibes .cs-concentric-vibe');
    const circles = sectionSdmo?.querySelectorAll('.cs-concentric-circles .cs-concentric-circle');
    const texts = sectionSdmo?.querySelectorAll('.cs-concentric-texts .cs-concentric-text');



    // ------------------------------------
    // INITIAL SETUP
    // ------------------------------------

    const circlePaths = Array.from(circles).map(circle =>
      MotionPathPlugin.convertToPath(circle)[0]
    );

    // const vibePaths = Array.from(vibes).map(vibe =>
    //   MotionPathPlugin.convertToPath(vibe)[0]
    // );

    gsap.set(circlePaths, {
      opacity: 0,
      scale: (i) => (i * 0.4),
      transformOrigin: "50% 50%"
    });

    // Position text at right edge of each circle
    const circlePathsLength = circlePaths.length - 1;

    texts.forEach((text, i) => {
      gsap.set(text, {
        autoAlpha: 0,
        motionPath: {
          path: circlePaths[circlePathsLength - i],
          align: circlePaths[circlePathsLength - i],
          alignOrigin: [0.5, 0.5],
          autoRotate: false // keeps text upright
        },
      });
    });

    // ------------------------------------
    // INTRO TIMELINE
    // ------------------------------------

    const tl = gsap.timeline();

    tl.to(circlePaths, {
      opacity: 1,
      scale: 1,
      rotation: 60,
      duration: 1.5,
      stagger: 0.3,
      ease: "power2.out"
    })
    

    // --------------------------------
    // ORBIT LOGIC
    // --------------------------------

    tl.add(() => {
      circlePaths.forEach((circle, i) => {
        const duration = 200 + i * 3;
        const clockwise = i % 2 === 0;

        // Rotate circle
        gsap.to(circle, {
          rotation: clockwise ? "+=360" : "-=360",
          duration: duration,
          repeat: -1,
          ease: "none",
          transformOrigin: "50% 50%"
        });
      });

    })
    tl.to(texts, {
      autoAlpha: 1,
      duration: 0.8,
      stagger: 0.2
    }, "-=1");
    tl.add(()=> {
      // Animate text along circle paths
      texts.forEach((text, i) => {

        gsap.to(text, {
          duration: 200,
          repeat: -1,
          ease: "none",
          motionPath: {
            path: circlePaths[circlePathsLength - i],
            align: circlePaths[circlePathsLength - i],
            alignOrigin: [0.5, 0.5],
            autoRotate: false // keeps text upright
          },
          direction: i % 3 === 0 ? "normal" : "reverse"
        });
      });
    }, '<')

    return tl;
  }

  const sdmoTl = gsap.timeline()

  sdmoTl
    .to(brand, {opacity: 1, x: 0, duration: 0.6, stagger: 0.2})
    .add(ccirclesBackdrop())
    .to(sectionTitle, {opacity: 1, y: 0, duration: 0.8, stagger: 0.1}, '-=50%')

  ScrollTrigger.create({
    animation: sdmoTl,
    trigger: sectionSdmo,
    start: "top center"
  })
}

function carexAnim() {
  const carexSection = document.querySelector('.cs-section--h-carex');
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
  gsap.set([linerTrack, linerSub], {opacity: 0, drawSVG: 0})
  const introTl = gsap.timeline({
    scrollTrigger: {
      trigger: carexSection,
      start: "top 80%",
      once: true,
    }
  });

  introTl
    .to(hltTitle, {opacity: 1, duration: 0.8})
    .to(linerTrack, { opacity: 1, drawSVG: "100%", duration: 1 })
    .to(linerSub, { drawSVG: "100%", duration: 1 }, "<");

  

  gsap.to(linerLine, {
    motionPath: {
      path: linerTrack,
      align: linerTrack,
      autoRotate: true,
      alignOrigin: [0.5, 0.5]
    },
    ease: "none",
    scrollTrigger: {
      trigger: carexSection,
      start: "top center+=100", // start AFTER intro visually
      end: "bottom center",
      scrub: 1,
    }
  });

  const swiper = new Swiper('.cs-slider__swiper', {
    loop: true,
    autoplay: {
        delay: 2500,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      },
    // If we need pagination
    pagination: {
      el: '.swiper-pagination',
    },

    // Navigation arrows
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },

    // And if we need scrollbar
    scrollbar: {
      el: '.swiper-scrollbar',
    },
  });
}

function novaAnim () {
  const novaSection = document.querySelector('.cs-section--h-nova');
  const linerTrack = novaSection?.querySelector('.cs-liner .cs-liner__track')
  const linerSub = novaSection?.querySelector('.cs-liner .cs-liner__small')
  const linerLine = novaSection?.querySelector('.cs-liner .cs-liner__line')
  const novaSlider = novaSection.querySelector('.cs-slider__swiper');

  gsap.set([linerTrack, linerSub], {drawSVG: 0})

  const introTl = gsap.timeline({
    scrollTrigger: {
      trigger: novaSection,
      start: "top 80%",
      once: true,
    }
  });

  introTl
    .to(linerTrack, { drawSVG: "100%", duration: 1 })
    .to(linerSub, { drawSVG: "100%", duration: 1 }, "<");

  gsap.to(linerLine, {
    motionPath: {
      path: linerTrack,
      align: linerTrack,
      autoRotate: true,
      alignOrigin: [0.5, 0.5]
    },
    ease: "none",
    scrollTrigger: {
      trigger: novaSection,
      start: "top center+=100", // start AFTER intro visually
      end: "bottom center",
      scrub: 1,
    }
  });

    const swiper = new Swiper('.cs-slider__swiper', {
    loop: true,
    autoplay: {
        delay: 2500,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      },
    // If we need pagination
    pagination: {
      el: '.swiper-pagination',
    },

    // Navigation arrows
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },

    // And if we need scrollbar
    scrollbar: {
      el: '.swiper-scrollbar',
    },
  });
}

function zerofyxAnim() {
  const zerofyxSection = document.querySelector('.cs-section--h-zerofyx');
  const linerTrack = zerofyxSection?.querySelector('.cs-liner .cs-liner__track')
  const linerLine = zerofyxSection?.querySelector('.cs-liner .cs-liner__line')
  const zerofyxSlider = zerofyxSection.querySelector('.cs-slider__swiper');

  
    gsap.to(
      linerTrack, { drawSVG: "100%", duration: 1,
      scrollTrigger: {
        trigger: zerofyxSection,
        start: "top 80%",
        once: true,
      }
    });

    gsap.to(linerLine, {
    motionPath: {
      path: linerTrack,
      align: linerTrack,
      autoRotate: true,
      alignOrigin: [0.5, 0.5]
    },
    ease: "none",
    scrollTrigger: {
      trigger: zerofyxSection,
      start: "top center+=100", // start AFTER intro visually
      end: "bottom center",
      scrub: 1,
    }
  });

  const swiper = new Swiper('.cs-slider__swiper', {
    loop: true,
    autoplay: {
        delay: 2500,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      },
    // If we need pagination
    pagination: {
      el: '.swiper-pagination',
    },

    // Navigation arrows
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },

    // And if we need scrollbar
    scrollbar: {
      el: '.swiper-scrollbar',
    },
  });
}

function collabAnim() {
  const sectionCollab = document.querySelector('.cs-section--h-collab');
  const title = sectionCollab?.querySelectorAll('.cs-title .word');
  
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


  gsap.set(title, {opacity: 0, y: 20})
  gsap.set(description, {opacity: 0, y: 10})
  gsap.set(articles, {opacity: 0, x: -30})

  const collabTl = gsap.timeline();
  collabTl
    .add(collabConnect())
    .to(title, {y: 0, opacity: 1, stagger: 0.16, duration: 0.6})
    .to(description, {y: 0, opacity: 1, duration: 0.6}, '-=80%')
    .to(articles, {x: 0, opacity: 1, stagger: 0.18, duration: 0.6})

  ScrollTrigger.create({
    trigger: sectionCollab,
    animation: collabTl,
    start: "top center"
  })
}

function trustAnim() {
  const sectionJoin = document.querySelector('.cs-section--h-trust');
  const titleSvg = sectionJoin?.querySelectorAll('.cs-titlesvg');
  const joinSteps = sectionJoin.querySelectorAll('.cs-foundation .cs-foundation__item');

  gsap.set(joinSteps, {opacity: 0, y: 40});
  gsap.set(titleSvg, {y: 20, opacity: 0})

  const trustTl = gsap.timeline();
  trustTl
    .to(titleSvg, {y: 0, opacity: 1, duration: 0.8})
    .to(joinSteps, {y: 0, opacity: 1, stagger: 0.18, duration: 0.8}, '-=15%')

  ScrollTrigger.create({
    trigger: sectionJoin,
    animation: trustTl,
    start: "top center",
  })
}

function joinAnim () {
  const sectionJoin = document.querySelector('.cs-section--h-join');
  const brand = sectionJoin?.querySelector('.cs-brand');
  const title = sectionJoin?.querySelectorAll('.cs-title .word');
  const joinSteps = sectionJoin.querySelectorAll('.cs-join-step');

  gsap.set(brand, {opacity: 0, scale: 0.5})
  gsap.set(joinSteps, {opacity: 0, y: 40});
  gsap.set(title, {y: 20, opacity: 0})

  const joinTl = gsap.timeline();
  joinTl
    .to(brand, {opacity: 1, scale: 1, rotation: 180, duration: 1.2})
    .to(title, {y: 0, opacity: 1, stagger: 0.16, duration: 0.8}, '-=0.6')
    .to(joinSteps, {y: 0, opacity: 1, stagger: 0.18, duration: 0.8}, '-=15%')

  ScrollTrigger.create({
    trigger: sectionJoin,
    animation: joinTl,
    start: "top center",
  })
}



function init() {
  let splitTexts = splitTextToChars();

  const gradMotion = document.getElementById('gradMotion');
  const gradMotionTrack = gradMotion?.querySelector('.cs-gradmotion__track');
  const gradMotionCircle = gradMotion?.querySelector('.cs-gradmotion__circle');

  gsap.set(gradMotionCircle, {
    motionPath: {
      path: gradMotionTrack,
      align: gradMotionTrack,
    }
  })

  const gradCircleSettings = [
    {
      size: 59.8,
      gradient: 'linear-gradient(to top, #BEFFC1 0%, rgba(57, 229, 255, 0) 87.02%, rgba(255, 255, 255, 0.5) 89.9%)',
    },
    {
      size: 59.8,
      gradient: 'linear-gradient(to top, #BEFFC1 0%, rgba(57, 229, 255, 0) 87.02%, rgba(255, 255, 255, 0.5) 89.9%)',
    },
    {
      size: 90,
      gradient: 'linear-gradient(to top, rgba(189, 255, 163, 0.75) 0%, rgba(97, 255, 218, 0) 100%)',
    },
    {
      size: 80,
      gradient: 'linear-gradient(to top, rgba(218, 189, 255, 0.75) 0%, rgba(0, 242, 255, 0) 100%)',
    },
    {
      size: 80,
      gradient: 'linear-gradient(to top, #65FFF2 0%, rgb(255, 0, 195, 0) 100%)'
    },
    {
      size: 80,
      gradient: 'linear-gradient(to top, #65FFF2 0%, rgb(43, 0, 195, 0) 100%)'
    }
  ]

  const sections = gsap.utils.toArray([
    '.cs-section--h-hero',
    '.cs-section--h-sdmo',
    '.cs-section--h-carex',
    '.cs-section--h-nova',
    '.cs-section--h-zerofyx',
    '.cs-section--h-collab'
  ]);

  const totalProgress = 1; // how far along the path you want to go

  gsap.to(gradMotionCircle, {
    motionPath: {
      path: gradMotionTrack,
      align: gradMotionTrack,
      alignOrigin: [0.5, 0.5],
      autoRotate: false,
      start: 0,
      end: 1
    },
    ease: "power2.inOut",
    scrollTrigger: {
      trigger: sections[0],
      start: "top top",
      endTrigger: sections[sections.length - 1],
      end: "bottom bottom",
      scrub: true,
    }
  });

  sections.forEach((section, index) => {
    const settings = gradCircleSettings[index];

    gsap.to(gradMotionCircle, {
      width: `${settings.size}rem`,
      height: `${settings.size}rem`,
      // background: settings.gradient,
      ease: "sine.inOut",
      scrollTrigger: {
        trigger: section,
        start: "top center",
        end: "bottom center",
        scrub: 2
      }
    });
  });

  function setFoundationBorder() {
    const foundation = document.querySelector('.cs-section--h-trust .cs-foundation');
    const foundationBorder = foundation.querySelector('.cs-foundation__border');

    
    let container = foundation.getBoundingClientRect();

    const newViewBoxVal = `0 0 ${container.width} ${container.height}`
    foundationBorder.setAttribute('viewBox', newViewBoxVal);

    foundationBorder.style.setProperty('--cs-foundation-border-rect-width', `${parseInt(container.width)}px`)
    foundationBorder.style.setProperty('--cs-foundation-border-rect-height', `${parseInt(container.height)}px`)

    function updateGradient() {
      const rect = foundationBorder.querySelector('rect');
      const gradient = foundationBorder.querySelector('#paint0_linear_615_5176')
      const x = rect.getAttribute('x');
      
      // Update gradient to match new width
      gradient.setAttribute('x2', parseInt(container.width));
      gradient.setAttribute('y2', parseInt(container.height));
    }

    updateGradient();
  }
  // setFoundationBorder();
  // window.addEventListener('resize', setFoundationBorder());

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
  
  blobsAnim(); // Hero Blob Animation
  heroAnim(); // Hero Animation
  sdmoAnim(); // Sdmo Second Section Animation
  carexAnim(); // CareX Animation
  novaAnim(); // Nova Animation
  zerofyxAnim(); // Zerofyx Animation
  collabAnim(); // Collab Animation
  trustAnim(); // Trust ANimation
  joinAnim(); // Join Revolution - Last Section Animation
}