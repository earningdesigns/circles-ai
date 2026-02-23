// Register GSAP plugins by reference (plugin objects), not by string names
gsap.registerPlugin(SplitText, ScrollTrigger, MotionPathPlugin, DrawSVGPlugin);

document.addEventListener("DOMContentLoaded", init)

// Split All Headlines
const splitTextToChars = () => { return SplitText.create(".cs-title", {type: "words,chars", charsClass: 'char++', wordsClass: 'word++'}); }


function blobsAnim() {
    const blobs = document.querySelectorAll('.cs-main .cs-bcircles .cs-bcircle');
    const blobsLimit = blobs.length;

    const blobsTl = gsap.timeline({
      // paused: true, // Start paused
      scrollTrigger: {
        trigger: '.cs-section--h-hero', // The section containing blobs
        start: 'top top',         // Animation starts when section reaches the middle of the viewport
        end: 'bottom top',           // Animation stops when the section leaves the viewport
        toggleActions: 'play pause resume pause', // Play/pause based on scroll
      },
    })
    const animDefaults = {
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    }

    const randomCoord = () => {
      const marginSpace = 300;

      const x = Math.random() * (window.innerWidth - marginSpace);
      const y = Math.random() * (window.innerHeight - marginSpace);

      return {x: x, y: y}
    }

    // Randomize initial positions
    blobs.forEach(blob => {
      const coOrd = randomCoord();
      gsap.set(blob, {x: coOrd.x, y: coOrd.y});
    });


    // Add floating animation with GSAP
    blobs.forEach((blob, index) => {
      const delay = -index * blobsLimit;
      const coOrd = randomCoord();

      blobsTl.add(
        gsap.to(blob, {
          x: () => coOrd.x,
          y: () => coOrd.y,
          duration: 12,
          ...animDefaults
        }),
        delay
      )
    });

    // Add subtle pulsing animation
    // blobsTl.add(
    //   gsap.to(blobs, {
    //     scale: '+=0.05',
    //     duration: 1,
    //     ...animDefaults
    //   })
    // )
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
}

function sdmoAnim() {
  const sectionSdmo = document.querySelector('.cs-section--h-sdmo');
  const brand = sectionSdmo.querySelectorAll('.cs-brand svg path');
  const sectionTitle = gsap.utils.toArray(sectionSdmo.querySelectorAll('.cs-title .word'))

  gsap.set(sectionTitle, {opacity: 0, y: 25})
  gsap.set(brand, {opacity: 0, x: 5})

  function ccirclesBackdrop () {
    const circles = sectionSdmo?.querySelectorAll('.cs-concentric-circles .cs-concentric-circle');
    const texts = sectionSdmo?.querySelectorAll('.cs-concentric-texts .cs-concentric-text');

    // ------------------------------------
    // INITIAL SETUP
    // ------------------------------------

    const circlePaths = Array.from(circles).map(circle =>
      MotionPathPlugin.convertToPath(circle)[0]
    );

    gsap.set(circlePaths, {
      opacity: 0,
      scale: (i) => (i * 0.2) + 0.3,
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
      rotation: 360,
      duration: 1.5,
      stagger: 0.3,
      ease: "power2.out"
    })
    

    // --------------------------------
    // ORBIT LOGIC
    // --------------------------------

    tl.add(() => {
      circlePaths.forEach((circle, i) => {
        const duration = 8 + i * 3;
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
          duration: 20,
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
  const linerTrack = carexSection?.querySelector('.cs-liner .cs-liner__track')
  const linerSub = carexSection?.querySelector('.cs-liner .cs-liner__small')
  const linerLine = carexSection?.querySelector('.cs-liner .cs-liner__line')
  const carexSlider = carexSection.querySelector('.cs-slider__swiper');

  gsap.set(carexTitle, {opacity: 0})
  gsap.set([linerTrack, linerSub], {drawSVG: 0})

  ScrollTrigger.create ({
    trigger: carexSection,
    start: 'top top',
    once: true,
    onEnter: () => {
      gsap.to(linerTrack, {
        drawSVG: "100%", 
        duration: 0.8,
      })
      gsap.to(linerSub, {
        drawSVG: "100%", 
        duration: 0.8,
      })
      gsap.to(carexTitle, {opacity: 1, duration: 1, stagger: 0.2})
    }
  })
  
  gsap.to(linerLine, {
    motionPath: {
      path: linerTrack,
      align: linerTrack,
      autoRotate: true,
      alignOrigin: [0.5, 0.5]
    },
    scrollTrigger: {
      trigger: carexSection,
      start: 'top center',
      scrub: true,
    }
    
  })

  const swiper = new Swiper('.cs-slider__swiper', {
    loop: true,

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

  ScrollTrigger.create ({
    trigger: novaSection,
    start: 'top top',
    once: true,
    onEnter: () => {
      gsap.to(linerTrack, {
        drawSVG: "100%", 
        duration: 0.8,
      })
      gsap.to(linerSub, {
        drawSVG: "100%", 
        duration: 0.8,
      })
    }
  })
  
  gsap.to(linerLine, {
    motionPath: {
      path: linerTrack,
      align: linerTrack,
      autoRotate: true,
      alignOrigin: [0.5, 0.5]
    },
    scrollTrigger: {
      trigger: novaSection,
      start: 'top center',
      scrub: true,
    }
    
  })

    const swiper = new Swiper('.cs-slider__swiper', {
    loop: true,

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

  gsap.to(linerLine, {
    motionPath: {
      path: linerTrack,
      align: linerTrack,
      autoRotate: true,
      alignOrigin: [0.5, 0.5]
    },
    scrollTrigger: {
      trigger: zerofyxSection,
      start: 'top top',
      scrub: true,
    }
  })

  const swiper = new Swiper('.cs-slider__swiper', {
    loop: true,

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
  const title = sectionJoin?.querySelectorAll('.cs-title .word');
  const joinSteps = sectionJoin.querySelectorAll('.cs-foundation .cs-foundation__item');

  gsap.set(joinSteps, {opacity: 0, y: 40});
  gsap.set(title, {y: 20, opacity: 0})

  const trustTl = gsap.timeline();
  trustTl
    .to(title, {y: 0, opacity: 1, stagger: 0.16, duration: 0.8}, '-=0.6')
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
      gradient: 'radial-gradient(50% 50% at 50% 50%, #BEFFC1 0%, rgba(57, 229, 255, 0) 87.02%, rgba(255, 255, 255, 0.5) 89.9%)',
    },
    {
      size: 59.8,
      gradient: 'radial-gradient(50% 50% at 50% 50%, #BEFFC1 0%, rgba(57, 229, 255, 0) 87.02%, rgba(255, 255, 255, 0.5) 89.9%)',
    },
    {
      size: 135.9,
      gradient: 'radial-gradient(50% 50% at 50% 50%, rgba(189, 255, 163, 0.75) 0%, rgba(97, 255, 218, 0) 100%)',
    },
    {
      size: 135.9,
      gradient: 'radial-gradient(50% 50% at 50% 50%, rgba(218, 189, 255, 0.75) 0%, rgba(0, 242, 255, 0) 100%)',
    },
    {
      size: 135.9,
      gradient: 'radial-gradient(50% 50% at 50% 50%, #65FFF2 0%, rgb(255, 0, 195, 0) 100%)'
    },
    {
      size: 135.9,
      gradient: 'radial-gradient(50% 50% at 50% 50%, #65FFF2 0%, rgb(43, 0, 195, 0) 100%)'
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
      background: settings.gradient,
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
  setFoundationBorder();
  window.addEventListener('resize', setFoundationBorder());
  
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